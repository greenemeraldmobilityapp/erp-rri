import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { unauthorized } from '@/lib/api/errors'

/**
 * @openapi
 * /api/v1/ai/agents/usage:
 *   get:
 *     tags: [AI Agent]
 *     summary: Statistik penggunaan AI agents
 *     description: Mengembalikan total penggunaan per agent, daily breakdown, distribusi task type, dan top users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal mulai filter (default: 30 hari yang lalu)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal akhir filter (default: hari ini)
 *       - in: query
 *         name: search_user
 *         schema:
 *           type: string
 *         description: Filter top users berdasarkan user_id
 *     responses:
 *       200:
 *         description: Statistik usage
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.user) {
    const res = auth.error
    return res ?? unauthorized('Unauthorized')
  }

  const { searchParams } = new URL(request.url)
  const startDateParam = searchParams.get('start_date')
  const endDateParam = searchParams.get('end_date')
  const searchUser = searchParams.get('search_user') ?? ''

  const fromDate = startDateParam
    ? new Date(startDateParam).toISOString()
    : new Date(Date.now() - 30 * 86400000).toISOString()
  const toDate = endDateParam
    ? new Date(endDateParam + 'T23:59:59').toISOString()
    : new Date().toISOString()

  const { count: negoCount } = await supabaseAdmin
    .from('ai_nego_history')
    .select('*', { count: 'exact', head: true })

  const { count: dataCount } = await supabaseAdmin
    .from('ai_data_history')
    .select('*', { count: 'exact', head: true })

  const { count: visionCount } = await supabaseAdmin
    .from('ai_vision_history')
    .select('*', { count: 'exact', head: true })

  const { count: automationCount } = await supabaseAdmin
    .from('ai_automation_log')
    .select('*', { count: 'exact', head: true })

  const { data: dailyNego } = await supabaseAdmin
    .from('ai_nego_history')
    .select('created_at')
    .gte('created_at', fromDate)
    .order('created_at', { ascending: true })

  const { data: dailyData } = await supabaseAdmin
    .from('ai_data_history')
    .select('created_at')
    .gte('created_at', fromDate)
    .order('created_at', { ascending: true })

  const { data: dailyVision } = await supabaseAdmin
    .from('ai_vision_history')
    .select('created_at')
    .gte('created_at', fromDate)
    .order('created_at', { ascending: true })

  const { data: dailyAutomation } = await supabaseAdmin
    .from('ai_automation_log')
    .select('executed_at')
    .gte('executed_at', fromDate)
    .order('executed_at', { ascending: true })

  const daysDiff = Math.max(1, Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000))
  const dateMap = new Map<string, { nego: number; data: number; vision: number; automation: number }>()
  for (let i = daysDiff; i >= 0; i--) {
    const d = new Date(new Date(fromDate).getTime() + i * 86400000).toISOString().slice(0, 10)
    dateMap.set(d, { nego: 0, data: 0, vision: 0, automation: 0 })
  }

  for (const row of (dailyNego ?? [])) {
    const d = new Date(row.created_at).toISOString().slice(0, 10)
    const existing = dateMap.get(d)
    if (existing) existing.nego++
  }
  for (const row of (dailyData ?? [])) {
    const d = new Date(row.created_at).toISOString().slice(0, 10)
    const existing = dateMap.get(d)
    if (existing) existing.data++
  }
  for (const row of (dailyVision ?? [])) {
    const d = new Date(row.created_at).toISOString().slice(0, 10)
    const existing = dateMap.get(d)
    if (existing) existing.vision++
  }
  for (const row of (dailyAutomation ?? [])) {
    const d = new Date(row.executed_at).toISOString().slice(0, 10)
    const existing = dateMap.get(d)
    if (existing) existing.automation++
  }

  const daily = Array.from(dateMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }))

  const taskTypeMap = new Map<string, number>()
  const { data: rawTaskTypes } = await supabaseAdmin
    .from('ai_data_history')
    .select('task_type')
  for (const row of (rawTaskTypes ?? [])) {
    taskTypeMap.set(row.task_type, (taskTypeMap.get(row.task_type) ?? 0) + 1)
  }
  const byTaskType = Array.from(taskTypeMap.entries()).map(([k, v]) => ({ task_type: k, count: v }))

  let topUsers: Array<{ user_id: string; count: number }> = []
  try {
    const { data } = await supabaseAdmin.rpc('get_top_ai_users')
    topUsers = (data ?? []) as Array<{ user_id: string; count: number }>
  } catch {
    const userCountMap = new Map<string, number>()
    for (const table of ['ai_nego_history', 'ai_data_history', 'ai_vision_history'] as const) {
      const { data: rows } = await supabaseAdmin.from(table).select('user_id')
      for (const row of (rows ?? [])) {
        userCountMap.set(row.user_id, (userCountMap.get(row.user_id) ?? 0) + 1)
      }
    }
    topUsers = Array.from(userCountMap.entries())
      .map(([k, v]) => ({ user_id: k, count: v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  if (searchUser) {
    topUsers = topUsers.filter(u => u.user_id.toLowerCase().includes(searchUser.toLowerCase()))
  }

  return NextResponse.json({
    total: {
      nego: negoCount ?? 0,
      data: dataCount ?? 0,
      vision: visionCount ?? 0,
      automation: automationCount ?? 0,
    },
    daily,
    byTaskType,
    topUsers,
  })
}
