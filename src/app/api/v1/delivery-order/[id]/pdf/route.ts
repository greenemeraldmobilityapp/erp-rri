import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { notFound, internalError } from '@/lib/api/errors'
import { DeliveryOrderPDF } from '@/lib/pdf/delivery-order'

const COMPANY_KEYS = [
  'company_nama', 'company_bidang_usaha', 'company_alamat',
  'company_no_hp', 'company_email', 'company_logo_url',
  'penandatangan_nama', 'penandatangan_jabatan', 'penandatangan_no_hp',
  'tanda_tangan_url', 'stempel_url', 'tanda_tangan_stempel_url',
] as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data: sj, error } = await supabaseAdmin
    .from('delivery_order')
    .select('*, sales_order!sales_order_id(nomor, customer_po_id, di_id), kendaraan!kendaraan_id(nama, no_polisi)')
    .eq('id', id)
    .single()
  if (error) return internalError(error)
  if (!sj) return notFound('Delivery Order tidak ditemukan')
  const so = sj.sales_order as { nomor: string; customer_po_id: string | null; di_id: string | null } | null

  // Fetch company settings
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

  // Resolve customer name and reference number
  let customerNama = '-'
  let ref: string | null = null

  if (so?.customer_po_id) {
    const { data: po } = await supabaseAdmin
      .from('customer_po')
      .select('customer!customer_id(nama), nomor_po_customer')
      .eq('id', so.customer_po_id)
      .single()
    const poData = po as { customer: { nama: string } | null; nomor_po_customer: string | null } | null
    if (poData) {
      customerNama = poData.customer?.nama ?? '-'
      ref = poData.nomor_po_customer
    }
  } else if (so?.di_id) {
    const { data: diRow } = await supabaseAdmin
      .from('di')
      .select('customer!customer_id(nama), nomor')
      .eq('id', so.di_id)
      .single()
    const diData = diRow as { customer: { nama: string } | null; nomor: string } | null
    if (diData) {
      customerNama = diData.customer?.nama ?? '-'
      ref = diData.nomor
    }
  }

  // Fetch items, sorted by urutan
  const { data: items } = await supabaseAdmin
    .from('delivery_order_item')
    .select('*, barang!barang_id(nama, kode, satuan)')
    .eq('delivery_order_id', id)
    .order('urutan')
  if (!items) return internalError('Gagal memuat item')

  const kendaraan = sj.kendaraan as { nama: string; no_polisi: string } | null

  const pdfData = {
    nomor: sj.nomor,
    ref,
    customerNama,
    tanggal: sj.tanggal,
    keterangan: sj.keterangan ?? null,
    items: items.map(i => ({
      nama: (i.barang as { nama: string })?.nama ?? '-',
      kode: (i.barang as { kode: string })?.kode ?? '-',
      satuan: (i.barang as { satuan: string })?.satuan ?? '',
      jumlah: i.jumlah,
      keterangan: i.keterangan ?? null,
      urutan: (i as { urutan: number }).urutan,
    })),
    kendaraanNama: kendaraan?.nama ?? null,
    kendaraanNoPolisi: kendaraan?.no_polisi ?? null,
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
      tanda_tangan_url: company.tanda_tangan_url ?? null,
      stempel_url: company.stempel_url ?? null,
      tanda_tangan_stempel_url: company.tanda_tangan_stempel_url ?? null,
    },
    sourcePath: (so?.customer_po_id ? 'customer_po' : so?.di_id ? 'di' : null) as 'customer_po' | 'di' | null,
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(DeliveryOrderPDF({ data: pdfData }) as any).toBlob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${sj.nomor}.pdf"`,
      },
    })
  } catch {
    return internalError('Gagal generate PDF')
  }
}
