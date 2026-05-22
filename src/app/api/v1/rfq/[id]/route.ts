import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: rfq, error: rfqError } = await supabaseAdmin
    .from('rfq')
    .select('*, supplier!supplier_id(id, nama, kode)')
    .eq('id', id)
    .single()

  if (rfqError || !rfq) return notFound('RFQ tidak ditemukan')

  const { data: items } = await supabaseAdmin
    .from('rfq_item')
    .select('*, barang!barang_id(id, nama, kode, satuan)')
    .eq('rfq_id', id)
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
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('rfq')
    .update(updateData)
    .eq('id', id)
    .select('*, supplier!supplier_id(id, nama, kode)')
    .single()

  if (error) return internalError(error)
  if (!data) return notFound('RFQ tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('rfq_item').delete().eq('rfq_id', id)

    const now = new Date().toISOString()
    const items = body.items.map((item: { barang_id: string; jumlah: number; satuan?: string; harga_target?: number; keterangan?: string }) => ({
      rfq_id: id,
      barang_id: item.barang_id,
      jumlah: item.jumlah,
      satuan: item.satuan ?? null,
      harga_target: item.harga_target ?? null,
      keterangan: item.keterangan ?? null,
      created_at: now,
      updated_at: now,
    }))

    const { error: itemsError } = await supabaseAdmin.from('rfq_item').insert(items)
    if (itemsError) return internalError(itemsError)
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params

  await supabaseAdmin.from('rfq_item').delete().eq('rfq_id', id)

  const { error } = await supabaseAdmin.from('rfq').delete().eq('id', id)
  if (error) return internalError(error)

  return NextResponse.json({ message: 'RFQ berhasil dihapus' })
}
