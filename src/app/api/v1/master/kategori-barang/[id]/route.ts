import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

const schema = z.object({
  nama: z.string().min(1, 'Nama kategori harus diisi').optional(),
  keterangan: z.string().optional(),
})

/**
 * @openapi
 * /api/v1/master/kategori-barang/{id}:
 *   get:
 *     tags: [Kategori Barang]
 *     summary: Detail kategori barang
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('kategori_barang').select('*').eq('id', id).single()
  if (error) return internalError(error)
  if (!data) return notFound('Kategori barang tidak ditemukan')
  return NextResponse.json({ data })
}

/**
 * @openapi
 * /api/v1/master/kategori-barang/{id}:
 *   put:
 *     tags: [Kategori Barang]
 *     summary: Update kategori barang
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const { data, error } = await supabaseAdmin.from('kategori_barang').update({ ...parsed.data, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return internalError(error)
  if (!data) return notFound('Kategori barang tidak ditemukan')
  return NextResponse.json({ data })
}

/**
 * @openapi
 * /api/v1/master/kategori-barang/{id}:
 *   delete:
 *     tags: [Kategori Barang]
 *     summary: Hapus kategori barang
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const { error } = await supabaseAdmin.from('kategori_barang').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
