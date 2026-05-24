import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: neg, error } = await supabaseAdmin.from('negoiasi').select('*, quotation!quotation_id(nomor)').eq('id', id).single()
  if (error) return internalError(error)
  if (!neg) return notFound('Negosiasi tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('negoiasi_item').select('*, quotation_item!quotation_item_id(id, harga_satuan, diskon, jumlah, barang!barang_id(id, nama, kode, satuan))').eq('negoiasi_id', id)
  return NextResponse.json({ data: { ...neg, items: items ?? [] } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const upd: Record<string, unknown> = {}
  if (body.status) upd.status = body.status
  if (body.keterangan !== undefined) upd.keterangan = body.keterangan
  upd.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin.from('negoiasi').update(upd).eq('id', id).select().single()
  if (error) return internalError(error)
  if (!data) return notFound('Negosiasi tidak ditemukan')
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('negoiasi_item').delete().eq('negoiasi_id', id)
  const { error } = await supabaseAdmin.from('negoiasi').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
