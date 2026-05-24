import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

const schema = z.object({
  nama: z.string().min(1, 'Nama barang harus diisi').optional(),
  kode: z.string().min(1, 'Kode barang harus diisi').optional(),
  kategori_id: z.string().min(1, 'Kategori harus dipilih').optional(),
  satuan: z.string().min(1, 'Satuan harus diisi').optional(),
  spesifikasi: z.string().optional(),
  harga_beli_default: z.coerce.number().nonnegative().optional(),
  harga_jual_default: z.coerce.number().nonnegative().optional(),
  stok_minimum: z.coerce.number().nonnegative().optional(),
  is_active: z.boolean().optional(),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('barang').select('*, kategori_barang!kategori_id(nama)').eq('id', id).single()
  if (error) return internalError(error)
  if (!data) return notFound('Barang tidak ditemukan')
  return NextResponse.json({ data })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const { data, error } = await supabaseAdmin.from('barang').update({ ...parsed.data, updated_at: new Date().toISOString() }).eq('id', id).select('*, kategori_barang!kategori_id(nama)').single()
  if (error) return internalError(error)
  if (!data) return notFound('Barang tidak ditemukan')
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const { error } = await supabaseAdmin.from('barang').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
