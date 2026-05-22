import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: po, error } = await supabaseAdmin.from('customer_po').select('*, customer!customer_id(nama, kode)').eq('id', id).single()
  if (error || !po) return notFound('PO tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('customer_po_item').select('*, barang!barang_id(nama, kode, satuan)').eq('customer_po_id', id)
  return NextResponse.json({ data: { ...po, items: items ?? [] } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const upd: Record<string, unknown> = {}
  if (body.status) upd.status = body.status
  if (body.nomor_po_customer !== undefined) upd.nomor_po_customer = body.nomor_po_customer
  if (body.terms_of_payment !== undefined) upd.terms_of_payment = body.terms_of_payment
  if (body.keterangan !== undefined) upd.keterangan = body.keterangan
  upd.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin.from('customer_po').update(upd).eq('id', id).select().single()
  if (error) return internalError(error)
  if (!data) return notFound('PO tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('customer_po_item').delete().eq('customer_po_id', id)
    const now = new Date().toISOString()
    const items = body.items.map((item: { barang_id: string; jumlah: number; harga_satuan: number; keterangan?: string }) => ({
      customer_po_id: id, barang_id: item.barang_id, jumlah: item.jumlah,
      harga_satuan: item.harga_satuan, keterangan: item.keterangan ?? null, created_at: now, updated_at: now,
    }))
    const { error: itemsError } = await supabaseAdmin.from('customer_po_item').insert(items)
    if (itemsError) return internalError(itemsError)
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('customer_po_item').delete().eq('customer_po_id', id)
  const { error } = await supabaseAdmin.from('customer_po').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
