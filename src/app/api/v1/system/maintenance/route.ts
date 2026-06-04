import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { forbidden } from '@/lib/api/errors'

/**
 * @openapi
 * /api/v1/system/maintenance:
 *   get:
 *     tags: [System]
 *     summary: Get maintenance mode status
 *     description: Mengembalikan status maintenance mode (true/false)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance mode status
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [System]
 *     summary: Toggle maintenance mode
 *     description: Mengaktifkan/mematikan maintenance mode (hanya owner/admin)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Maintenance mode updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { data } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single()

  return NextResponse.json({
    data: {
      maintenance_mode: data?.value === 'true',
    },
  })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  if (auth.user?.role !== 'owner' && auth.user?.role !== 'admin') {
    return forbidden('Hanya owner dan admin yang dapat mengubah pengaturan maintenance')
  }

  const body = await request.json()
  const enabled = body.enabled === true

  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert({ key: 'maintenance_mode', value: enabled ? 'true' : 'false' }, { onConflict: 'key' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: {
      maintenance_mode: enabled,
      message: enabled ? 'Mode maintenance diaktifkan' : 'Mode maintenance dinonaktifkan',
    },
  })
}
