import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: so, error } = await supabaseAdmin.from('sales_order').select('*, customer_po!customer_po_id(nomor)').eq('id', id).single()
  if (error || !so) return notFound('Sales Order tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('sales_order_item').select('*, barang!barang_id(nama, kode, satuan)').eq('sales_order_id', id)
  return NextResponse.json({ data: { ...so, items: items ?? [] } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const upd: Record<string, unknown> = {}
  if (body.status) upd.status = body.status
  upd.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin.from('sales_order').update(upd).eq('id', id).select().single()
  if (error) return internalError(error)
  if (!data) return notFound('Sales Order tidak ditemukan')
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('sales_order_item').delete().eq('sales_order_id', id)
  const { error } = await supabaseAdmin.from('sales_order').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
