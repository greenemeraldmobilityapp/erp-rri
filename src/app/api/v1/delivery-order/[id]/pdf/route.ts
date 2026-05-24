import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { notFound, internalError } from '@/lib/api/errors'
import { DeliveryOrderPDF } from '@/lib/pdf/delivery-order'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data: sj, error } = await supabaseAdmin
    .from('delivery_order')
    .select('*, sales_order!sales_order_id(nomor, customer_po_id)')
    .eq('id', id)
    .single()
  if (error) return internalError(error)
  if (!sj) return notFound('Delivery Order tidak ditemukan')
  const so = sj.sales_order as { nomor: string; customer_po_id: string } | null
  let customerNama = '-'
  if (so?.customer_po_id) {
    const { data: po } = await supabaseAdmin
      .from('customer_po')
      .select('customer!customer_id(nama)')
      .eq('id', so.customer_po_id)
      .single()
    customerNama = (po as { customer: { nama: string } } | null)?.customer?.nama ?? '-'
  }

  const { data: items } = await supabaseAdmin
    .from('delivery_order_item')
    .select('*, barang!barang_id(nama, kode, satuan)')
    .eq('delivery_order_id', id)
  if (!items) return internalError('Gagal memuat item')

  const pdfData = {
    nomor: sj.nomor,
    customer: customerNama,
    soNomor: so?.nomor ?? '-',
    tanggal: new Date(sj.tanggal).toLocaleDateString('id-ID'),
    keterangan: sj.keterangan ?? '',
    items: items.map(i => ({
      nama: (i.barang as { nama: string })?.nama ?? '-',
      kode: (i.barang as { kode: string })?.kode ?? '-',
      satuan: (i.barang as { satuan: string })?.satuan ?? '',
      jumlah: i.jumlah,
    })),
  }

  try {
    const blob = await pdf(DeliveryOrderPDF({ data: pdfData })).toBlob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="SJ-${sj.nomor}.pdf"`,
      },
    })
  } catch {
    return internalError('Gagal generate PDF')
  }
}
