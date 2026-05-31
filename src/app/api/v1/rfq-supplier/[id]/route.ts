import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request); if (auth.error) return auth.error
  const { id } = await params

  const { data: rfq, error: rfqError } = await supabaseAdmin
    .from('rfq_supplier')
    .select('*, supplier!supplier_id(id, nama, kode), sales_order!sales_order_id(id, nomor)')
    .eq('id', id)
    .single()

  if (rfqError) return internalError(rfqError)

  if (!rfq) return notFound('RFQ tidak ditemukan')
  const { data: items } = await supabaseAdmin
    .from('rfq_supplier_item')
    .select('*, barang!barang_id(id, nama, kode, satuan, harga_beli_default)')
    .eq('rfq_supplier_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ data: { ...rfq, items: items ?? [] } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const updateData: Record<string, unknown> = {}
  if (body.supplier_id) updateData.supplier_id = body.supplier_id
  if (body.tanggal) updateData.tanggal = body.tanggal
  if (body.status) updateData.status = body.status
  if (body.keterangan !== undefined) updateData.keterangan = body.keterangan
  if (body.sales_order_id !== undefined) updateData.sales_order_id = body.sales_order_id || null
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('rfq_supplier')
    .update(updateData)
    .eq('id', id)
    .select('*, supplier!supplier_id(id, nama, kode), sales_order!sales_order_id(id, nomor)')
    .single()

  if (error) return internalError(error)
  if (!data) return notFound('RFQ tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('rfq_supplier_item').delete().eq('rfq_supplier_id', id)

    const now = new Date().toISOString()
    const items = body.items.map((item: { barang_id: string; jumlah: number; satuan?: string; harga_target?: number; harga_penawaran?: number; keterangan?: string }) => ({
      rfq_supplier_id: id,
      barang_id: item.barang_id,
      jumlah: item.jumlah,
      satuan: item.satuan ?? null,
      harga_target: item.harga_target ?? null,
      harga_penawaran: item.harga_penawaran ?? null,
      keterangan: item.keterangan ?? null,
      created_at: now,
      updated_at: now,
    }))

    const { error: itemsError } = await supabaseAdmin.from('rfq_supplier_item').insert(items)
    if (itemsError) return internalError(itemsError)
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json().catch(() => null)

  if (body?.action === 'apply_prices') {
    const { data: items } = await supabaseAdmin
      .from('rfq_supplier_item')
      .select('barang_id, harga_penawaran')
      .eq('rfq_supplier_id', id)
      .not('harga_penawaran', 'is', null)

    if (!items || items.length === 0) return badRequest('Tidak ada harga penawaran untuk diterapkan')

    const errors: string[] = []
    for (const item of items) {
      const { error } = await supabaseAdmin
        .from('barang')
        .update({ harga_beli_default: item.harga_penawaran, updated_at: new Date().toISOString() })
        .eq('id', item.barang_id)
      if (error) errors.push(error.message)
    }

    if (errors.length > 0) return internalError(errors.join(', '))
    return NextResponse.json({ message: `${items.length} harga berhasil diterapkan` })
  }

  return badRequest('Aksi tidak dikenali')
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params

  await supabaseAdmin.from('rfq_supplier_item').delete().eq('rfq_supplier_id', id)

  const { error } = await supabaseAdmin.from('rfq_supplier').delete().eq('id', id)
  if (error) return internalError(error)

  return NextResponse.json({ message: 'RFQ berhasil dihapus' })
}
