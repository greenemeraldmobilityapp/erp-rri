import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: fp, error } = await supabaseAdmin.from('faktur_pajak').select('*, invoice!invoice_id(nomor)').eq('id', id).single()
  if (error) return internalError(error)
  if (!fp) return notFound('Faktur Pajak tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('faktur_pajak_item').select('*, invoice_item!invoice_item_id(barang_id, harga)').eq('faktur_pajak_id', id)
  return NextResponse.json({ data: { ...fp, items: items ?? [] } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const upd: Record<string, unknown> = {}
  if (body.status) upd.status = body.status
  if (body.nomor_faktur) upd.nomor_faktur = body.nomor_faktur
  if (body.dpp !== undefined) upd.dpp = body.dpp
  if (body.ppn !== undefined) upd.ppn = body.ppn
  if (body.pph !== undefined) upd.pph = body.pph
  upd.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin.from('faktur_pajak').update(upd).eq('id', id).select().single()
  if (error) return internalError(error)
  if (!data) return notFound('Faktur Pajak tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('faktur_pajak_item').delete().eq('faktur_pajak_id', id)
    const now = new Date().toISOString()
    const items = body.items.map((item: { invoice_item_id: string; harga: number; dpp: number; ppn: number; pph?: number }) => ({
      faktur_pajak_id: id, invoice_item_id: item.invoice_item_id,
      harga: item.harga, dpp: item.dpp, ppn: item.ppn, pph: item.pph ?? null,
      created_at: now, updated_at: now,
    }))
    const { error: itemsError } = await supabaseAdmin.from('faktur_pajak_item').insert(items)
    if (itemsError) return internalError(itemsError)
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('faktur_pajak_item').delete().eq('faktur_pajak_id', id)
  const { error } = await supabaseAdmin.from('faktur_pajak').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
