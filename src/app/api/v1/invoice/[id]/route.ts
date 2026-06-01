import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'
import { generateInvoiceJournal } from '@/lib/auto-jurnal'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request); if (auth.error) return auth.error
  const { id } = await params
  const { data: inv, error } = await supabaseAdmin.from('invoice').select('*, sales_order!sales_order_id(nomor, di!fk_sales_order_di(nomor, nomor_di_customer, kontrak_id)), customer!customer_id(nama, kode)').eq('id', id).single()
  if (error) return internalError(error)
  if (!inv) return notFound('Invoice tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('invoice_item').select('*, barang!barang_id(nama, kode, satuan)').eq('invoice_id', id)

  let kontrak_nomor: string | null = null
  if (inv.sales_order?.di?.kontrak_id) {
    const { data: kontrak } = await supabaseAdmin.from('kontrak').select('nomor_kontrak').eq('id', inv.sales_order.di.kontrak_id).single()
    if (kontrak) kontrak_nomor = kontrak.nomor_kontrak
  }

  let do_nomor: string | null = null
  const { data: dos } = await supabaseAdmin.from('delivery_order').select('nomor').eq('sales_order_id', inv.sales_order_id)
  if (dos && dos.length > 0) do_nomor = dos[0].nomor

  let pic_nama: string | null = null
  let pic_jabatan: string | null = null
  const { data: pic } = await supabaseAdmin.from('customer_pic').select('nama, jabatan').eq('customer_id', inv.customer_id).eq('is_active', true).limit(1).maybeSingle()
  if (pic) {
    pic_nama = pic.nama
    pic_jabatan = pic.jabatan
  }

  return NextResponse.json({ data: { ...inv, items: items ?? [], kontrak_nomor, do_nomor, pic_nama, pic_jabatan } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const upd: Record<string, unknown> = {}
  if (body.status) upd.status = body.status
  if (body.nomor_grn !== undefined) upd.nomor_grn = body.nomor_grn
  if (body.top) upd.top = body.top
  if (body.ppn_rate !== undefined) upd.ppn_rate = body.ppn_rate
  if (body.pph_rate !== undefined) upd.pph_rate = body.pph_rate
  upd.updated_at = new Date().toISOString()

  const { data: oldInv } = await supabaseAdmin.from('invoice').select('status').eq('id', id).single()

  const { data, error } = await supabaseAdmin.from('invoice').update(upd).eq('id', id).select().single()
  if (error) return internalError(error)
  if (!data) return notFound('Invoice tidak ditemukan')

  if (data.status === 'sent' && oldInv?.status !== 'sent') {
    await generateInvoiceJournal(id)
  }

  if (body.items) {
    await supabaseAdmin.from('invoice_item').delete().eq('invoice_id', id)
    const now = new Date().toISOString()
    const items = body.items.map((item: { barang_id: string; harga: number; jumlah: number; diskon?: number; ppn?: number; pph?: number; keterangan?: string }) => ({
      invoice_id: id, barang_id: item.barang_id, harga: item.harga, jumlah: item.jumlah,
      diskon: item.diskon ?? 0, ppn: item.ppn ?? null, pph: item.pph ?? null,
      keterangan: item.keterangan ?? null, created_at: now, updated_at: now,
    }))
    const { error: itemsError } = await supabaseAdmin.from('invoice_item').insert(items)
    if (itemsError) return internalError(itemsError)
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('invoice_item').delete().eq('invoice_id', id)
  const { error } = await supabaseAdmin.from('invoice').delete().eq('id', id)
  if (error) return internalError(error)
  return new NextResponse(null, { status: 204 })
}
