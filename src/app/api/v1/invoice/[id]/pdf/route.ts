import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { notFound, internalError } from '@/lib/api/errors'
import { InvoicePDF } from '@/lib/pdf/invoice'

const COMPANY_KEYS = [
  'company_nama', 'company_bidang_usaha', 'company_alamat',
  'company_no_hp', 'company_email', 'company_logo_url',
  'penandatangan_nama', 'penandatangan_jabatan', 'penandatangan_no_hp',
  'company_bank_name', 'company_rekening_nama', 'company_rekening_nomor',
] as const

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const itemsCountParam = request.nextUrl.searchParams.get('itemsCount')

  const { data: inv, error } = await supabaseAdmin
    .from('invoice')
    .select('*, sales_order!sales_order_id(nomor, customer_po_id, di_id, di!fk_sales_order_di(nomor, nomor_di_customer, customer_pic(nama, jabatan, jenis_kelamin)), customer_po!customer_po_id(nomor, nomor_po_customer, customer_pic!pic_customer_id(nama, jabatan, jenis_kelamin))), customer!customer_id(nama, alamat)')
    .eq('id', id)
    .single()
  if (error) return internalError(error)
  if (!inv) return notFound('Invoice tidak ditemukan')

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

  const { data: items } = await supabaseAdmin
    .from('invoice_item')
    .select('*, barang!barang_id(nama, kode, satuan)')
    .eq('invoice_id', id)
    .order('urutan')
  if (!items) return internalError('Gagal memuat item')

  const displayItems = (() => {
    if (!itemsCountParam) return items
    const n = parseInt(itemsCountParam, 10)
    if (isNaN(n) || n < 1) return items
    return items.slice(0, n)
  })()

  const grandTotal = displayItems.reduce((s, i) => s + (i.harga * i.jumlah - (i.diskon ?? 0)), 0)

  const so = inv.sales_order as {
    nomor: string
    customer_po_id?: string
    di_id?: string
    di: { nomor: string; nomor_di_customer: string | null; customer_pic: { nama: string; jabatan: string; jenis_kelamin: string | null } | null } | null
    customer_po: { nomor: string; nomor_po_customer: string | null; customer_pic: { nama: string; jabatan: string; jenis_kelamin: string | null } | null } | null
  } | null
  const customer = inv.customer as { nama: string; alamat: string } | null

  const picNama = so?.di?.customer_pic?.nama ?? so?.customer_po?.customer_pic?.nama ?? null
  const picJenisKelamin = so?.di?.customer_pic?.jenis_kelamin ?? so?.customer_po?.customer_pic?.jenis_kelamin ?? null

  const sourceIsCPO = !!so?.customer_po_id
  const customerRef = sourceIsCPO
    ? so?.customer_po?.nomor_po_customer ?? null
    : so?.di?.nomor_di_customer ?? null
  const refLabel = sourceIsCPO ? 'No. Ref. PO' : 'No. Ref. DI'

  const pdfData = {
    nomor: inv.nomor,
    keteranganInvoice: inv.keterangan_invoice ?? null,
    customerNama: customer?.nama ?? '-',
    customerAlamat: customer?.alamat ?? null,
    picNama,
    picJenisKelamin,
    tanggal: 'Jepara, ' + new Date(inv.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    customerRef,
    refLabel,
    grandTotal,
    items: displayItems.map(i => ({
      nama: (i as { nama_barang: string }).nama_barang ?? (i.barang as { nama: string })?.nama ?? '-',
      kode: (i as { kode_barang: string }).kode_barang ?? (i.barang as { kode: string })?.kode ?? '-',
      satuan: (i as { satuan: string }).satuan ?? (i.barang as { satuan: string })?.satuan ?? '',
      jumlah: i.jumlah,
      hargaSatuan: i.harga,
      diskon: i.diskon ?? 0,
      urutan: (i as { urutan: number }).urutan,
    })),
    company: {
      company_nama: company.company_nama ?? null,
      company_bidang_usaha: company.company_bidang_usaha ?? null,
      company_alamat: company.company_alamat ?? null,
      company_no_hp: company.company_no_hp ?? null,
      company_email: company.company_email ?? null,
      company_logo_url: company.company_logo_url ?? null,
      penandatangan_nama: company.penandatangan_nama ?? null,
      penandatangan_jabatan: company.penandatangan_jabatan ?? null,
      penandatangan_no_hp: company.penandatangan_no_hp ?? null,
      company_bank_name: company.company_bank_name ?? null,
      company_rekening_nama: company.company_rekening_nama ?? null,
      company_rekening_nomor: company.company_rekening_nomor ?? null,
    },
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(InvoicePDF({ data: pdfData }) as any).toBlob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(blob.size),
        'Content-Disposition': `inline; filename="INVOICE-${inv.nomor}.pdf"`,
      },
    })
  } catch (e) {
    console.error('PDF generation error:', e)
    const msg = e instanceof Error ? e.message : 'Gagal generate PDF'
    return NextResponse.json({ error: msg, code: 'PDF_GENERATION_ERROR' }, { status: 500 })
  }
}
