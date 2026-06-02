import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { notFound, internalError } from '@/lib/api/errors'
import { KwitansiPDF } from '@/lib/pdf/kwitansi'
import { terbilang } from '@/lib/utils/terbilang'

const COMPANY_KEYS = [
  'company_nama',
  'penandatangan_nama', 'penandatangan_jabatan',
] as const

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data: kwt, error } = await supabaseAdmin.from('kwitansi')
    .select('*, invoice!invoice_id(nomor, sales_order_id)')
    .eq('id', id).single()
  if (error) return internalError(error)
  if (!kwt) return notFound('Kwitansi tidak ditemukan')

  const invoiceId = kwt.invoice_id
  const { data: inv } = await supabaseAdmin.from('invoice')
    .select(`*,
      customer!customer_id(nama),
      sales_order!sales_order_id(
        nomor,
        di!fk_sales_order_di(nomor),
        customer_po!fk_sales_order_customer_po(nomor)
      )`)
    .eq('id', invoiceId).single()

  const { data: kwtItems } = await supabaseAdmin
    .from('kwitansi_item')
    .select('invoice_item_id')
    .eq('kwitansi_id', id)

  const invItemIds = (kwtItems ?? []).map(i => i.invoice_item_id)
  let total = 0
  if (invItemIds.length > 0) {
    const { data: invItems } = await supabaseAdmin
      .from('invoice_item')
      .select('harga, jumlah, diskon')
      .in('id', invItemIds)
    total = (invItems ?? []).reduce((sum, i) => sum + (i.harga * i.jumlah - (i.diskon ?? 0)), 0)
  }

  const { data: settingsRows } = await supabaseAdmin
    .from('site_settings')
    .select('key, value')
    .in('key', COMPANY_KEYS as unknown as string[])
  const company: Record<string, string> = {}
  if (settingsRows) {
    for (const row of settingsRows) {
      company[row.key] = row.value
    }
  }

  const so = inv?.sales_order as {
    nomor: string
    di?: { nomor: string } | null
    customer_po?: { nomor: string } | null
  } | null

  const refType = so?.di ? 'DI' as const : so?.customer_po ? 'PO' as const : null
  const refNomor = so?.di?.nomor ?? so?.customer_po?.nomor ?? null

  const pdfData = {
    nomor: kwt.nomor,
    customerNama: (inv?.customer as { nama: string })?.nama ?? '-',
    tanggal: 'Jepara, ' + new Date(kwt.tanggal).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    }),
    terbilangStr: terbilang(total),
    total,
    keterangan: kwt.keterangan,
    invoiceNomor: (kwt.invoice as { nomor: string })?.nomor ?? '-',
    refType,
    refNomor,
    companyNama: company.company_nama ?? 'PT. RIZQI RIDHO ILAHI',
    penandatanganNama: company.penandatangan_nama ?? 'Mohamad Marzuqi',
    penandatanganJabatan: company.penandatangan_jabatan ?? 'Direktur',
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(KwitansiPDF({ data: pdfData }) as any).toBlob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${kwt.nomor}.pdf"`,
      },
    })
  } catch {
    return internalError('Gagal generate PDF')
  }
}
