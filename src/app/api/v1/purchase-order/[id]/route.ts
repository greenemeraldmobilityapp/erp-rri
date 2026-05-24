import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: po, error } = await supabaseAdmin.from('purchase_order').select('*, supplier!supplier_id(nama, kode), purchase_request!purchase_request_id(nomor)').eq('id', id).single()
  if (error) return internalError(error)
  if (!po) return notFound('PO tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('purchase_order_item').select('*, barang!barang_id(nama, kode, satuan)').eq('purchase_order_id', id)
  return NextResponse.json({ data: { ...po, items: items ?? [] } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const upd: Record<string, unknown> = {}
  if (body.status) upd.status = body.status; if (body.terms_of_payment !== undefined) upd.terms_of_payment = body.terms_of_payment
  if (body.keterangan !== undefined) upd.keterangan = body.keterangan
  upd.updated_at = new Date().toISOString()
  const { data, error } = await supabaseAdmin.from('purchase_order').update(upd).eq('id', id).select().single()
  if (error) return internalError(error); if (!data) return notFound('PO tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('purchase_order_item').delete().eq('purchase_order_id', id)
    const now = new Date().toISOString()
    const items = body.items.map((i: { barang_id: string; jumlah: number; harga_satuan: number; link_produk?: string; nama_toko?: string; marketplace?: string; no_resi?: string }) => ({
      purchase_order_id: id, barang_id: i.barang_id, jumlah: i.jumlah, harga_satuan: i.harga_satuan,
      link_produk: i.link_produk ?? null, nama_toko: i.nama_toko ?? null, marketplace: i.marketplace ?? null,
      no_resi: i.no_resi ?? null, created_at: now, updated_at: now,
    }))
    const { error: ie } = await supabaseAdmin.from('purchase_order_item').insert(items)
    if (ie) return internalError(ie)
  }
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('purchase_order_item').delete().eq('purchase_order_id', id)
  const { error } = await supabaseAdmin.from('purchase_order').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
