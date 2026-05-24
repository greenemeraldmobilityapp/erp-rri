import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: qtn, error: qtnError } = await supabaseAdmin
    .from('quotation')
    .select('*, customer!customer_id(id, nama, kode)')
    .eq('id', id)
    .single()

  if (qtnError) return internalError(qtnError)

  if (!qtn) return notFound('Quotation tidak ditemukan')
  const { data: items } = await supabaseAdmin
    .from('quotation_item')
    .select('*, barang!barang_id(id, nama, kode, satuan)')
    .eq('quotation_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ data: { ...qtn, items: items ?? [] } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const updateData: Record<string, unknown> = {}
  if (body.customer_id) updateData.customer_id = body.customer_id
  if (body.tanggal) updateData.tanggal = body.tanggal
  if (body.status) updateData.status = body.status
  if (body.ppn_rate !== undefined) updateData.ppn_rate = body.ppn_rate
  if (body.keterangan !== undefined) updateData.keterangan = body.keterangan
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('quotation')
    .update(updateData)
    .eq('id', id)
    .select('*, customer!customer_id(id, nama, kode)')
    .single()

  if (error) return internalError(error)
  if (!data) return notFound('Quotation tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('quotation_item').delete().eq('quotation_id', id)

    const now = new Date().toISOString()
    const ppnRate = body.ppn_rate ?? data.ppn_rate ?? 0.11
    const items = body.items.map((item: { barang_id: string; jumlah: number; harga_satuan: number; diskon?: number; keterangan?: string }) => ({
      quotation_id: id,
      barang_id: item.barang_id,
      jumlah: item.jumlah,
      harga_satuan: item.harga_satuan,
      diskon: item.diskon ?? 0,
      ppn_per_item: (item.harga_satuan * item.jumlah * ppnRate) / (item.diskon ? 1 : 1),
      keterangan: item.keterangan ?? null,
      created_at: now,
      updated_at: now,
    }))

    const { error: itemsError } = await supabaseAdmin.from('quotation_item').insert(items)
    if (itemsError) return internalError(itemsError)
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params

  await supabaseAdmin.from('quotation_item').delete().eq('quotation_id', id)

  const { error } = await supabaseAdmin.from('quotation').delete().eq('id', id)
  if (error) return internalError(error)

  return NextResponse.json({ message: 'Quotation berhasil dihapus' })
}
