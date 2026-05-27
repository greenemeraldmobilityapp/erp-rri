import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request); if (auth.error) return auth.error
  const { id } = await params

  const { data: rfq, error: rfqError } = await supabaseAdmin
    .from('rfq_customer')
    .select('*, customer!customer_id(id, nama, kode)')
    .eq('id', id)
    .single()

  if (rfqError) return internalError(rfqError)
  if (!rfq) return notFound('RFQ Customer tidak ditemukan')

  const { data: items, error: itemsError } = await supabaseAdmin
    .from('rfq_customer_item')
    .select('*')
    .eq('rfq_customer_id', id)
    .order('created_at', { ascending: true })

  if (itemsError) return internalError(itemsError)

  const barangIds = [...new Set(items?.map(i => i.barang_id).filter(Boolean) ?? [])]
  let barangMap = new Map<string, { id: string; nama: string; kode: string; satuan: string }>()
  if (barangIds.length > 0) {
    const { data: barangList } = await supabaseAdmin
      .from('barang')
      .select('id, nama, kode, satuan')
      .in('id', barangIds)
    barangMap = new Map(barangList?.map(b => [b.id, b]) ?? [])
  }
  const itemsWithBarang = (items ?? []).map(item => ({
    ...item,
    barang: item.barang_id ? (barangMap.get(item.barang_id) ?? null) : null,
  }))

  let picCustomer = null
  if (rfq.pic_customer_id) {
    const { data: pic } = await supabaseAdmin
      .from('customer_pic')
      .select('id, nama, jabatan')
      .eq('id', rfq.pic_customer_id)
      .single()
    picCustomer = pic
  }

  return NextResponse.json({ data: { ...rfq, items: itemsWithBarang, pic_customer: picCustomer } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const updateData: Record<string, unknown> = {}
  if (body.customer_id !== undefined) updateData.customer_id = body.customer_id
  if (body.tanggal !== undefined) updateData.tanggal = body.tanggal
  if (body.nomor_rfq_customer !== undefined) updateData.nomor_rfq_customer = body.nomor_rfq_customer ?? null
  if (body.pic_customer_id !== undefined) updateData.pic_customer_id = body.pic_customer_id ?? null
  if (body.perihal !== undefined) updateData.perihal = body.perihal
  if (body.status !== undefined) updateData.status = body.status
  if (body.keterangan !== undefined) updateData.keterangan = body.keterangan ?? null
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('rfq_customer')
    .update(updateData)
    .eq('id', id)
    .select('*, customer!customer_id(id, nama, kode)')
    .single()

  if (error) return internalError(error)
  if (!data) return notFound('RFQ Customer tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('rfq_customer_item').delete().eq('rfq_customer_id', id)

    const now = new Date().toISOString()
    const items = body.items.map((item: { barang_id?: string; nama_barang?: string; jumlah: number; satuan?: string; image_url?: string; keterangan?: string }) => ({
      rfq_customer_id: id,
      barang_id: item.barang_id ?? null,
      nama_barang: item.nama_barang ?? null,
      jumlah: item.jumlah,
      satuan: item.satuan ?? null,
      image_url: item.image_url ?? null,
      keterangan: item.keterangan ?? null,
      created_at: now,
      updated_at: now,
    }))

    const { error: itemsError } = await supabaseAdmin.from('rfq_customer_item').insert(items)
    if (itemsError) return internalError(itemsError)
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params

  await supabaseAdmin.from('rfq_customer_item').delete().eq('rfq_customer_id', id)
  await supabaseAdmin.from('rfq_customer_document').delete().eq('rfq_customer_id', id)
  await supabaseAdmin.from('rfq_customer_pic').delete().eq('rfq_customer_id', id)

  const { error } = await supabaseAdmin.from('rfq_customer').delete().eq('id', id)
  if (error) return internalError(error)

  return NextResponse.json({ message: 'RFQ Customer berhasil dihapus' })
}
