import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: kwt, error } = await supabaseAdmin.from('kwitansi').select('*, invoice!invoice_id(nomor)').eq('id', id).single()
  if (error) return internalError(error)
  if (!kwt) return notFound('Kwitansi tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('kwitansi_item').select('*, invoice_item!invoice_item_id(barang_id, harga)').eq('kwitansi_id', id)
  return NextResponse.json({ data: { ...kwt, items: items ?? [] } })
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

  const { data, error } = await supabaseAdmin.from('kwitansi').update(upd).eq('id', id).select().single()
  if (error) return internalError(error)
  if (!data) return notFound('Kwitansi tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('kwitansi_item').delete().eq('kwitansi_id', id)
    const now = new Date().toISOString()
    const items = body.items.map((item: { invoice_item_id: string; jumlah: number }) => ({
      kwitansi_id: id, invoice_item_id: item.invoice_item_id, jumlah: item.jumlah,
      created_at: now, updated_at: now,
    }))
    const { error: itemsError } = await supabaseAdmin.from('kwitansi_item').insert(items)
    if (itemsError) return internalError(itemsError)
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('kwitansi_item').delete().eq('kwitansi_id', id)
  const { error } = await supabaseAdmin.from('kwitansi').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
