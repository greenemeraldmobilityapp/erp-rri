import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: pr, error } = await supabaseAdmin.from('purchase_request').select('*, sales_order!sales_order_id(nomor)').eq('id', id).single()
  if (error) return internalError(error)
  if (!pr) return notFound('PR tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('purchase_request_item').select('*, barang!barang_id(nama, kode)').eq('purchase_request_id', id)
  return NextResponse.json({ data: { ...pr, items: items ?? [] } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const upd: Record<string, unknown> = {}
  if (body.status) upd.status = body.status; if (body.keterangan !== undefined) upd.keterangan = body.keterangan
  upd.updated_at = new Date().toISOString()
  const { data, error } = await supabaseAdmin.from('purchase_request').update(upd).eq('id', id).select().single()
  if (error) return internalError(error); if (!data) return notFound('PR tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('purchase_request_item').delete().eq('purchase_request_id', id)
    const now = new Date().toISOString()
    const items = body.items.map((i: { barang_id: string; jumlah: number; keterangan?: string }) => ({
      purchase_request_id: id, barang_id: i.barang_id, jumlah: i.jumlah, keterangan: i.keterangan ?? null, created_at: now, updated_at: now,
    }))
    const { error: ie } = await supabaseAdmin.from('purchase_request_item').insert(items)
    if (ie) return internalError(ie)
  }
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('purchase_request_item').delete().eq('purchase_request_id', id)
  const { error } = await supabaseAdmin.from('purchase_request').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
