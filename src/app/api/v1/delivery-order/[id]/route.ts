import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'
import { sendWhatsapp } from '@/lib/utils/whatsapp'
import { generateDocumentNumber } from '@/lib/utils/document-number'
import { getConfigNumber } from '@/lib/utils/config'
import { generateInvoiceJournal } from '@/lib/auto-jurnal'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request); if (auth.error) return auth.error
  const { id } = await params
  const { data: sj, error } = await supabaseAdmin.from('delivery_order').select('*, sales_order!sales_order_id(nomor), kendaraan!kendaraan_id(nama, no_polisi)').eq('id', id).single()
  if (error) return internalError(error)
  if (!sj) return notFound('Delivery Order tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('delivery_order_item').select('*, barang!barang_id(nama, kode, satuan, barcode)').eq('delivery_order_id', id).order('urutan')
  return NextResponse.json({ data: { ...sj, items: items ?? [] } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data: doDoc } = await supabaseAdmin
    .from('delivery_order')
    .select('id, nomor, status, sales_order_id, foto_barang_diterima_url, foto_surat_jalan_url, kendaraan_id, delivery_slip_nomor, delivery_slip_file_url')
    .eq('id', id)
    .single()
  if (!doDoc) return notFound('Delivery Order tidak ditemukan')

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  if (body.status === 'dikirim' || body.status === 'ditolak') {
    if (!doDoc.foto_barang_diterima_url) return badRequest('Foto barang diterima wajib diupload')
    if (!doDoc.foto_surat_jalan_url) return badRequest('Foto surat jalan wajib diupload')
    if (body.status === 'ditolak') {
      if (!body.alasan_penolakan) return badRequest('Alasan penolakan wajib diisi')
    }
  }

  const upd: Record<string, unknown> = {}
  if (body.status) upd.status = body.status
  if (body.tanggal) upd.tanggal = body.tanggal
  if (body.keterangan !== undefined) upd.keterangan = body.keterangan
  if (body.alasan_penolakan !== undefined) upd.alasan_penolakan = body.alasan_penolakan
  if (body.kendaraan_id !== undefined) upd.kendaraan_id = body.kendaraan_id || null
  if (body.delivery_slip_nomor !== undefined) upd.delivery_slip_nomor = body.delivery_slip_nomor
  if (body.delivery_slip_file_url !== undefined) upd.delivery_slip_file_url = body.delivery_slip_file_url
  upd.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin.from('delivery_order').update(upd).eq('id', id).select().single()
  if (error) return internalError(error)
  if (!data) return notFound('Delivery Order tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('delivery_order_item').delete().eq('delivery_order_id', id)
    const now = new Date().toISOString()
    const items = body.items.map((item: { barang_id: string; jumlah: number; keterangan?: string }, idx: number) => ({
      delivery_order_id: id, barang_id: item.barang_id, jumlah: item.jumlah,
      keterangan: item.keterangan ?? null, urutan: idx + 1, created_at: now, updated_at: now,
    }))
    const { error: itemsError } = await supabaseAdmin.from('delivery_order_item').insert(items)
    if (itemsError) return internalError(itemsError)
  }

  if (body.status === 'dikirim') {
    const { data: so } = await supabaseAdmin
      .from('sales_order')
      .select('customer_po_id, di_id')
      .eq('id', data.sales_order_id)
      .single()

    if (so) {
      let customerId: string | null = null
      let top = 'Net 30'
      if (so.customer_po_id) {
        const { data: po } = await supabaseAdmin
          .from('customer_po')
          .select('customer_id, terms_of_payment')
          .eq('id', so.customer_po_id)
          .single()
        customerId = po?.customer_id ?? null
        if (po?.terms_of_payment) top = po.terms_of_payment
      } else if (so.di_id) {
        const { data: di } = await supabaseAdmin
          .from('di')
          .select('customer_id')
          .eq('id', so.di_id)
          .single()
        customerId = di?.customer_id ?? null
      }

      if (customerId) {
        const { data: pics } = await supabaseAdmin
          .from('customer_pic')
          .select('no_hp, nama')
          .eq('customer_id', customerId)
          .eq('is_active', true)
          .limit(1)

        const pic = pics?.[0]
        if (pic?.no_hp) {
          const msg = `Halo *${pic.nama}*,\n\nDelivery Order *${data.nomor}* telah dikirim.\n\nSilakan cek status pengiriman di portal customer RRI.\n\nTerima kasih.`
          await sendWhatsapp(pic.no_hp, msg, auth.user?.id)
        }
      }

      // Auto-generate draft invoice
const ppnRate = await getConfigNumber('ppn_rate', 0.11)
        const nomorInv = await generateDocumentNumber('INV')
        const nomorTT = await generateDocumentNumber('TT')
        const now = new Date().toISOString()

      const { data: soItems } = await supabaseAdmin
        .from('sales_order_item')
        .select('barang_id, jumlah, harga_satuan, nama_barang, kode_barang, satuan')
        .eq('sales_order_id', data.sales_order_id)

      if (soItems && soItems.length > 0 && customerId) {
        const { data: inv, error: invErr } = await supabaseAdmin.from('invoice').insert({
          nomor: nomorInv,
          sales_order_id: data.sales_order_id,
          customer_id: customerId,
          tanggal: now,
          top,
          ppn_rate: ppnRate,
          status: 'draft',
          nomor_tanda_terima: nomorTT,
          created_at: now,
          updated_at: now,
        }).select().single()

        if (!invErr && inv) {
          const invItems = soItems.map((item: { barang_id: string; jumlah: number; harga_satuan: number; nama_barang?: string; kode_barang?: string; satuan?: string }) => {
            const subtotal = item.harga_satuan * item.jumlah
            return {
              invoice_id: inv.id,
              barang_id: item.barang_id,
              harga: item.harga_satuan,
              jumlah: item.jumlah,
              nama_barang: item.nama_barang ?? null,
              kode_barang: item.kode_barang ?? null,
              satuan: item.satuan ?? null,
              diskon: 0,
              ppn: subtotal * ppnRate,
              keterangan: null,
              created_at: now,
              updated_at: now,
            }
          })
          const { data: createdItems } = await supabaseAdmin.from('invoice_item').insert(invItems).select()
          await generateInvoiceJournal(inv.id)

          // Auto-link GRN to Invoice if GRN exists for this SO's DI
          if (so.di_id) {
            const { data: grnMatch } = await supabaseAdmin
              .from('grn')
              .select('id')
              .eq('di_id', so.di_id)
              .is('invoice_id', null)
              .maybeSingle()
            if (grnMatch) {
              await supabaseAdmin.from('grn').update({ invoice_id: inv.id, updated_at: now }).eq('id', grnMatch.id)
            }
          }

          // Auto-generate draft Kwitansi (barengan)
          if (createdItems && createdItems.length > 0) {
            const nomorKwt = await generateDocumentNumber('KWT')
            const { data: kwt, error: kwtErr } = await supabaseAdmin.from('kwitansi').insert({
              nomor: nomorKwt,
              invoice_id: inv.id,
              tanggal: now,
              status: 'draft',
              created_at: now,
              updated_at: now,
            }).select().single()
            if (!kwtErr && kwt) {
              const kwtItems = createdItems.map((ci: { id: string; jumlah: number }) => ({
                kwitansi_id: kwt.id,
                invoice_item_id: ci.id,
                jumlah: ci.jumlah,
                created_at: now,
                updated_at: now,
              }))
              await supabaseAdmin.from('kwitansi_item').insert(kwtItems)
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('delivery_order_item').delete().eq('delivery_order_id', id)
  const { error } = await supabaseAdmin.from('delivery_order').delete().eq('id', id)
  if (error) return internalError(error)
  return new NextResponse(null, { status: 204 })
}
