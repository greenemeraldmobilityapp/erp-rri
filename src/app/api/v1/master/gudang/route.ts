/**
 * @openapi
 * /api/v1/master/gudang:
 *   get:
 *     tags: [Master]
 *     summary: Daftar gudang
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar gudang
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Master]
 *     summary: Tambah gudang baru
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Gudang created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('gudang').select('*').order('nama')
  if (error) return internalError(error)
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')
  const { data, error } = await supabaseAdmin.from('gudang').insert(body).select().single()
  if (error) return internalError(error)
  return NextResponse.json({ data })
}
