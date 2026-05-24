import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { notFound, internalError } from '@/lib/api/errors'
import { InvoicePDF } from '@/lib/pdf/invoice'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data: inv, error } = await supabaseAdmin.from('invoice').select('*, customer!customer_id(nama, kode)').eq('id', id).single()
  if (error) return internalError(error)
  if (!inv) return notFound('Invoice tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('invoice_item').select('*, barang!barang_id(nama, kode, satuan)').eq('invoice_id', id)
  if (!items) return internalError('Gagal memuat item')

  const pdfData = {
    nomor: inv.nomor,
    customer: inv.customer as { nama: string; kode: string },
    tanggal: new Date(inv.tanggal).toLocaleDateString('id-ID'),
    top: inv.top,
    ppn_rate: inv.ppn_rate,
    pph_rate: inv.pph_rate,
    items: items.map(i => ({
      nama: (i.barang as { nama: string })?.nama ?? '-',
      kode: (i.barang as { kode: string })?.kode ?? '-',
      satuan: (i.barang as { satuan: string })?.satuan ?? '',
      jumlah: i.jumlah,
      harga: i.harga,
      diskon: i.diskon ?? 0,
      ppn: i.ppn,
      pph: i.pph,
    })),
  }

  try {
    const blob = await pdf(InvoicePDF({ data: pdfData })).toBlob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="INVOICE-${inv.nomor}.pdf"`,
      },
    })
  } catch {
    return internalError('Gagal generate PDF')
  }
}
