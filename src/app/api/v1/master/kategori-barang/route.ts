import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'

const schema = z.object({
  nama: z.string().min(1, 'Nama kategori harus diisi'),
  keterangan: z.string().optional(),
})

/**
 * @openapi
 * /api/v1/master/kategori-barang:
 *   get:
 *     tags: [Kategori Barang]
 *     summary: Daftar kategori barang
 *     responses:
 *       200:
 *         description: Berhasil
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('kategori_barang').select('*').order('nama')
  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}

/**
 * @openapi
 * /api/v1/master/kategori-barang:
 *   post:
 *     tags: [Kategori Barang]
 *     summary: Tambah kategori barang
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Berhasil
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const { data, error } = await supabaseAdmin.from('kategori_barang').insert(parsed.data).select().single()
  if (error) return internalError(error)
  return NextResponse.json({ data }, { status: 201 })
}
