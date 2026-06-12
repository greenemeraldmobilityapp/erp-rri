import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request); if (auth.error) return auth.error
  const { id } = await params
  const kwtQuery = supabaseAdmin.from('kwitansi').select('*, invoice!invoice_id(nomor, tanggal, top, status, customer!customer_id(nama, kode), sales_order!sales_order_id(nomor, di!fk_sales_order_di(nomor, nomor_di_customer, kontrak_id, customer_pic(nama, jabatan)), customer_po!customer_po_id(nomor, nomor_po_customer, customer_pic!pic_customer_id(nama, jabatan))))')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: kwtRow, error } = await (kwtQuery as any).eq('id', id).single()
  const kwt = kwtRow as { id: string; status: string; invoice_id: string; invoice?: { status: string } } & Record<string, unknown>
  if (error) return internalError(error)
  if (!kwt) return notFound('Kwitansi tidak ditemukan')

  if (kwt.status === 'draft' && (kwt as Record<string, unknown>).invoice && ((kwt as Record<string, unknown>).invoice as Record<string, unknown>).status === 'paid') {
    const now = new Date().toISOString()
    const { error: autoErr } = await supabaseAdmin.from('kwitansi').update({ status: 'completed', updated_at: now }).eq('id', id)
    if (!autoErr) kwt.status = 'completed'
  }

  const { data: items } = await supabaseAdmin.from('kwitansi_item').select('*, invoice_item!invoice_item_id(barang_id, harga, barang!barang_id(nama, kode, satuan))').eq('kwitansi_id', id)

  type SalesOrderWithPIC = {
    nomor: string
    di?: {
      nomor?: string
      nomor_di_customer?: string
      kontrak_id?: string
      customer_pic?: { nama: string; jabatan: string }
    } | null
    customer_po?: {
      nomor?: string
      nomor_po_customer?: string
      customer_pic?: { nama: string; jabatan: string }
    } | null
  }

  type KwitansiWithInvoice = {
    invoice?: { sales_order?: SalesOrderWithPIC | null } | null
  }

  const salesOrder = (kwt as KwitansiWithInvoice).invoice?.sales_order
  let kontrak_nomor: string | null = null
  if (salesOrder?.di?.kontrak_id) {
    const { data: kontrak } = await supabaseAdmin.from('kontrak').select('nomor_kontrak').eq('id', salesOrder.di.kontrak_id).single()
    if (kontrak) kontrak_nomor = kontrak.nomor_kontrak
  }
  const pic_nama = salesOrder?.di?.customer_pic?.nama ?? salesOrder?.customer_po?.customer_pic?.nama ?? null
  const pic_jabatan = salesOrder?.di?.customer_pic?.jabatan ?? salesOrder?.customer_po?.customer_pic?.jabatan ?? null
  const cpo_ref = salesOrder?.customer_po?.nomor ?? null
  const cpo_cust_ref = salesOrder?.customer_po?.nomor_po_customer ?? null

  return NextResponse.json({ data: { ...kwt, items: items ?? [], kontrak_nomor, pic_nama, pic_jabatan, cpo_ref, cpo_cust_ref } })
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

  const { data, error } = await supabaseAdmin.from('kwitansi').update(upd).eq('id', id).select().single()
  if (error) return internalError(error)
  if (!data) return notFound('Kwitansi tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('kwitansi_item').delete().eq('kwitansi_id', id)
    const now = new Date().toISOString()
    const items = body.items.map((item: { invoice_item_id: string; jumlah: number }) => ({
      kwitansi_id: id, invoice_item_id: item.invoice_item_id, jumlah: item.jumlah,
      created_at: now, updated_at: now,
    }))
    const { error: itemsError } = await supabaseAdmin.from('kwitansi_item').insert(items)
    if (itemsError) return internalError(itemsError)
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('kwitansi_item').delete().eq('kwitansi_id', id)
  const { error } = await supabaseAdmin.from('kwitansi').delete().eq('id', id)
  if (error) return internalError(error)
  return new NextResponse(null, { status: 204 })
}
