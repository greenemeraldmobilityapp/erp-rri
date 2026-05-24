import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/api/supabase-server'

/**
 * @openapi
 * /api/v1/system/health:
 *   get:
 *     tags: [System]
 *     summary: System health check
 *     description: Mengembalikan status kesehatan database, storage, dan error rate
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Health status
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const dbStart = Date.now()
  const { error: dbError } = await supabaseAdmin.from('users').select('id').limit(1)
  const dbLatency = Date.now() - dbStart

  let storageUsage = 0
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    for (const bucket of buckets ?? []) {
      const { data: files } = await supabaseAdmin.storage.from(bucket.name).list()
      if (files) storageUsage += files.length
    }
  } catch {}

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: recentErrors } = await supabaseAdmin
    .from('audit_log')
    .select('id', { count: 'exact', head: true })
    .eq('action', 'error')
    .gte('created_at', sevenDaysAgo)

  const { count: totalActions } = await supabaseAdmin
    .from('audit_log')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo)

  const errorRate = totalActions && totalActions > 0 ? ((recentErrors ?? 0) / totalActions * 100).toFixed(2) : '0'

  return NextResponse.json({
    status: dbError ? 'degraded' : 'healthy',
    database: {
      connected: !dbError,
      latency_ms: dbLatency,
      error: dbError?.message ?? null,
    },
    storage: {
      total_files: storageUsage,
    },
    errors: {
      count_7d: recentErrors ?? 0,
      rate_pct: errorRate,
    },
    timestamp: new Date().toISOString(),
  })
}
