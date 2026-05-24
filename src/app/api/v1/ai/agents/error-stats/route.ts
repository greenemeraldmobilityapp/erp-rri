import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { unauthorized } from '@/lib/api/errors'

/**
 * @openapi
 * /api/v1/ai/agents/error-stats:
 *   get:
 *     tags: [AI Agent]
 *     summary: Error rate monitoring untuk AI agents
 *     description: Mengembalikan statistik error rate, timeout, dan failure per agent
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal mulai filter
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal akhir filter
 *     responses:
 *       200:
 *         description: Statistik error
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

  const fromDate = startDateParam
    ? new Date(startDateParam).toISOString()
    : new Date(Date.now() - 7 * 86400000).toISOString()
  const toDate = endDateParam
    ? new Date(endDateParam + 'T23:59:59').toISOString()
    : new Date().toISOString()

  async function getAgentErrors(
    table: string,
    timeColumn: string,
  ): Promise<{ total: number; errors: number; errorRate: number; avgLatencyMs: number | null }> {
    const { count: total } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true })
      .gte(timeColumn, fromDate)
      .lte(timeColumn, toDate)

    const { count: errors } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true })
      .gte(timeColumn, fromDate)
      .lte(timeColumn, toDate)
      .eq('status', 'error')

    const { data: latencyData } = await supabaseAdmin
      .from(table)
      .select('latency_ms')
      .gte(timeColumn, fromDate)
      .lte(timeColumn, toDate)
      .not('latency_ms', 'is', null)

    const totalLatency = (latencyData ?? []).reduce((sum, r) => sum + (r.latency_ms ?? 0), 0)
    const avgLatency = latencyData && latencyData.length > 0
      ? Math.round(totalLatency / latencyData.length)
      : null

    return {
      total: total ?? 0,
      errors: errors ?? 0,
      errorRate: total && total > 0 ? Math.round(((errors ?? 0) / total) * 10000) / 100 : 0,
      avgLatencyMs: avgLatency,
    }
  }

  const [nego, data, vision, automation] = await Promise.all([
    getAgentErrors('ai_nego_history', 'created_at'),
    getAgentErrors('ai_data_history', 'created_at'),
    getAgentErrors('ai_vision_history', 'created_at'),
    (async () => {
      const { count: total } = await supabaseAdmin
        .from('ai_automation_log')
        .select('*', { count: 'exact', head: true })
        .gte('executed_at', fromDate)
        .lte('executed_at', toDate)

      const { count: failed } = await supabaseAdmin
        .from('ai_automation_log')
        .select('*', { count: 'exact', head: true })
        .gte('executed_at', fromDate)
        .lte('executed_at', toDate)
        .eq('success', false)

      return {
        total: total ?? 0,
        errors: failed ?? 0,
        errorRate: total && total > 0 ? Math.round(((failed ?? 0) / total) * 10000) / 100 : 0,
        avgLatencyMs: null,
      }
    })(),
  ])

  const topErrors = await getTopErrors(fromDate, toDate)

  return NextResponse.json({
    period: { from: fromDate, to: toDate },
    agents: {
      nego,
      data,
      vision,
      automation,
    },
    topErrors,
  })
}

async function getTopErrors(
  fromDate: string,
  toDate: string,
): Promise<Array<{ agent: string; error: string; count: number }>> {
  const errorMap = new Map<string, number>()

  for (const table of ['ai_data_history', 'ai_vision_history', 'ai_nego_history'] as const) {
    const { data } = await supabaseAdmin
      .from(table)
      .select('error_message')
      .gte('created_at', fromDate)
      .lte('created_at', toDate)
      .not('error_message', 'is', null)
      .limit(500)

    for (const row of data ?? []) {
      if (row.error_message) {
        const key = `${table}:${row.error_message.slice(0, 100)}`
        errorMap.set(key, (errorMap.get(key) ?? 0) + 1)
      }
    }
  }

  const { data: automationErrors } = await supabaseAdmin
    .from('ai_automation_log')
    .select('error_message')
    .gte('executed_at', fromDate)
    .lte('executed_at', toDate)
    .not('error_message', 'is', null)
    .limit(500)

  for (const row of automationErrors ?? []) {
    if (row.error_message) {
      const key = `ai_automation_log:${row.error_message.slice(0, 100)}`
      errorMap.set(key, (errorMap.get(key) ?? 0) + 1)
    }
  }

  return Array.from(errorMap.entries())
    .map(([key, count]) => {
      const [agent, ...errorParts] = key.split(':')
      return { agent, error: errorParts.join(':'), count }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
}
