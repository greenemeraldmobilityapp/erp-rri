import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { notFound, internalError } from '@/lib/api/errors'
import { KwitansiPDF } from '@/lib/pdf/kwitansi'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data: kwt, error } = await supabaseAdmin.from('kwitansi').select('*, invoice!invoice_id(nomor)').eq('id', id).single()
  if (error || !kwt) return notFound('Kwitansi tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('kwitansi_item').select('*, invoice_item!invoice_item_id(barang_id, harga)').eq('kwitansi_id', id)

  const invoiceId = kwt.invoice_id
  const { data: inv } = await supabaseAdmin.from('invoice').select('*, customer!customer_id(nama)').eq('id', invoiceId).single()

  const total = (items ?? []).reduce((sum, i) => sum + i.jumlah, 0)

  const pdfData = {
    nomor: kwt.nomor,
    invoice_nomor: (kwt.invoice as { nomor: string })?.nomor ?? '-',
    customer_nama: (inv?.customer as { nama: string })?.nama ?? '-',
    tanggal: new Date(kwt.tanggal).toLocaleDateString('id-ID'),
    keterangan: kwt.keterangan,
    total,
    items: (items ?? []).map(i => ({
      invoice_nomor: (kwt.invoice as { nomor: string })?.nomor ?? '-',
      jumlah: i.jumlah,
    })),
  }

  try {
    const blob = await pdf(KwitansiPDF({ data: pdfData })).toBlob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="KWITANSI-${kwt.nomor}.pdf"`,
      },
    })
  } catch (err) {
    return internalError('Gagal generate PDF')
  }
}
