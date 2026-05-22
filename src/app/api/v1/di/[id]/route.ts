import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: di, error } = await supabaseAdmin.from('di').select('*, customer!customer_id(nama, kode)').eq('id', id).single()
  if (error || !di) return notFound('DI tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('di_item').select('*, barang!barang_id(nama, kode, satuan)').eq('di_id', id)
  return NextResponse.json({ data: { ...di, items: items ?? [] } })
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

  const { data, error } = await supabaseAdmin.from('di').update(upd).eq('id', id).select().single()
  if (error) return internalError(error)
  if (!data) return notFound('DI tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('di_item').delete().eq('di_id', id)
    const now = new Date().toISOString()
    const items = body.items.map((item: { barang_id: string; jumlah: number; keterangan?: string }) => ({
      di_id: id, barang_id: item.barang_id, jumlah: item.jumlah,
      keterangan: item.keterangan ?? null, created_at: now, updated_at: now,
    }))
    const { error: itemsError } = await supabaseAdmin.from('di_item').insert(items)
    if (itemsError) return internalError(itemsError)
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('di_item').delete().eq('di_id', id)
  const { error } = await supabaseAdmin.from('di').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
