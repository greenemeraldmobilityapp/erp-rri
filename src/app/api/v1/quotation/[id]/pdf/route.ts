import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { notFound, internalError } from '@/lib/api/errors'
import { QuotationPDF } from '@/lib/pdf/quotation'

const COMPANY_KEYS = [
  'company_nama', 'company_bidang_usaha', 'company_alamat',
  'company_no_hp', 'company_email', 'company_logo_url',
  'penandatangan_nama', 'penandatangan_jabatan', 'penandatangan_no_hp',
  'tanda_tangan_url', 'stempel_url',
] as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data: qtn, error } = await supabaseAdmin
    .from('quotation')
    .select('*, customer!customer_id(nama, kode), rfq_customer!rfq_id(nomor)')
    .eq('id', id)
    .single()
  if (error) return internalError(error)
  if (!qtn) return notFound('Quotation tidak ditemukan')

  const { data: items } = await supabaseAdmin
    .from('quotation_item')
    .select('*, barang!barang_id(nama, kode, satuan)')
    .eq('quotation_id', id)
  if (!items) return internalError('Gagal memuat item')

  let picCustomerNama: string | null = null
  let picCustomerNoHp: string | null = null
  if (qtn.pic_customer_id) {
    const { data: pic } = await supabaseAdmin
      .from('pic_customer')
      .select('nama, no_hp')
      .eq('id', qtn.pic_customer_id)
      .single()
    if (pic) {
      picCustomerNama = pic.nama
      picCustomerNoHp = pic.no_hp
    }
  }

  const { data: settings } = await supabaseAdmin
    .from('site_settings')
    .select('*')
    .in('key', COMPANY_KEYS)

  const settingsMap = new Map((settings ?? []).map(r => [r.key, r.value]))

  const company = {
    company_nama: settingsMap.get('company_nama') ?? null,
    company_bidang_usaha: settingsMap.get('company_bidang_usaha') ?? null,
    company_alamat: settingsMap.get('company_alamat') ?? null,
    company_no_hp: settingsMap.get('company_no_hp') ?? null,
    company_email: settingsMap.get('company_email') ?? null,
    company_logo_url: settingsMap.get('company_logo_url') ?? null,
    penandatangan_nama: settingsMap.get('penandatangan_nama') ?? null,
    penandatangan_jabatan: settingsMap.get('penandatangan_jabatan') ?? null,
    penandatangan_no_hp: settingsMap.get('penandatangan_no_hp') ?? null,
    tanda_tangan_url: settingsMap.get('tanda_tangan_url') ?? null,
    stempel_url: settingsMap.get('stempel_url') ?? null,
  }

  const pdfData = {
    nomor: qtn.nomor,
    referensi: qtn.referensi ?? null,
    lampiran: qtn.lampiran ?? null,
    perihal: qtn.perihal ?? null,
    pic_customer_nama: picCustomerNama,
    pic_customer_no_hp: picCustomerNoHp,
    customer: (qtn.customer as { nama: string; kode: string }) ?? { nama: '-', kode: '-' },
    alamat: qtn.alamat ?? null,
    tanggal: new Date(qtn.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    masa_berlaku: qtn.masa_berlaku ?? null,
    tanggal_berlaku_sampai: qtn.tanggal_berlaku_sampai
      ? new Date(qtn.tanggal_berlaku_sampai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : null,
    ppn_rate: qtn.ppn_rate,
    ppn_enabled: qtn.ppn_enabled,
    total_harga: qtn.total_harga,
    keterangan: qtn.keterangan ?? null,
    items: items.map(i => ({
      nama: (i.barang as { nama: string })?.nama ?? '-',
      kode: (i.barang as { kode: string })?.kode ?? '-',
      specification: (i as { specification?: string | null }).specification ?? null,
      justification: (i as { justification?: string | null }).justification ?? null,
      image_url: (i as { image_url?: string | null }).image_url ?? null,
      satuan: (i as { satuan?: string | null }).satuan ?? null,
      jumlah: i.jumlah,
      hargaSatuan: i.harga_satuan,
      diskon: i.diskon ?? 0,
    })),
    company,
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
