import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { notFound, internalError } from '@/lib/api/errors'
import { QuotationPDF } from '@/lib/pdf/quotation'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data: qtn, error } = await supabaseAdmin
    .from('quotation')
    .select('*, customer!customer_id(nama, kode)')
    .eq('id', id)
    .single()
  if (error) return internalError(error)
  if (!qtn) return notFound('Quotation tidak ditemukan')
  const { data: items } = await supabaseAdmin
    .from('quotation_item')
    .select('*, barang!barang_id(nama, kode, satuan)')
    .eq('quotation_id', id)
  if (!items) return internalError('Gagal memuat item')

  const pdfData = {
    nomor: qtn.nomor,
    customer: qtn.customer as { nama: string; kode: string },
    tanggal: new Date(qtn.tanggal).toLocaleDateString('id-ID'),
    ppn_rate: qtn.ppn_rate,
    items: items.map(i => ({
      nama: (i.barang as { nama: string })?.nama ?? '-',
      kode: (i.barang as { kode: string })?.kode ?? '-',
      satuan: (i.barang as { satuan: string })?.satuan ?? '',
      jumlah: i.jumlah,
      hargaSatuan: i.harga_satuan,
      diskon: i.diskon ?? 0,
    })),
  }

  try {
    const blob = await pdf(QuotationPDF({ data: pdfData })).toBlob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="SPH-${qtn.nomor}.pdf"`,
      },
    })
  } catch {
    return internalError('Gagal generate PDF')
  }
}
