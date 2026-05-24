import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: grn, error } = await supabaseAdmin.from('grn').select('*, purchase_receiving!purchase_receiving_id(nomor), di!di_id(nomor)').eq('id', id).single()
  if (error) return internalError(error)
  if (!grn) return notFound('GRN tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('grn_item').select('*, barang!barang_id(nama, kode)').eq('grn_id', id)
  return NextResponse.json({ data: { ...grn, items: items ?? [] } })
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
  const { data, error } = await supabaseAdmin.from('grn').update(upd).eq('id', id).select().single()
  if (error) return internalError(error); if (!data) return notFound('GRN tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('grn_item').delete().eq('grn_id', id)
    const now = new Date().toISOString()
    const items = body.items.map((i: { barang_id: string; jumlah: number; keterangan?: string }) => ({
      grn_id: id, barang_id: i.barang_id, jumlah: i.jumlah, keterangan: i.keterangan ?? null, created_at: now, updated_at: now,
    }))
    const { error: ie } = await supabaseAdmin.from('grn_item').insert(items)
    if (ie) return internalError(ie)
  }
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('grn_item').delete().eq('grn_id', id)
  const { error } = await supabaseAdmin.from('grn').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
