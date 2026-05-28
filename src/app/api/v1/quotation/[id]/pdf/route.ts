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
  'tanda_tangan_url', 'stempel_url', 'tanda_tangan_stempel_url',
] as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data: qtn, error } = await supabaseAdmin
    .from('quotation')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return internalError(error)
  if (!qtn) return notFound('Quotation tidak ditemukan')

  let customer = null
  if (qtn.customer_id) {
    const { data: c } = await supabaseAdmin
      .from('customer')
      .select('nama, kode')
      .eq('id', qtn.customer_id)
      .single()
    customer = c
  }

  let rfqCustomer = null
  if (qtn.rfq_id) {
    const { data: r } = await supabaseAdmin
      .from('rfq_customer')
      .select('nomor')
      .eq('id', qtn.rfq_id)
      .single()
    if (r) rfqCustomer = r
  }

  const { data: items } = await supabaseAdmin
    .from('quotation_item')
    .select('*')
    .eq('quotation_id', id)
  if (!items) return internalError('Gagal memuat item')

  const barangIds = [...new Set(items?.filter(i => i.barang_id).map(i => i.barang_id) ?? [])]
  let barangMap = new Map<string, { nama: string; kode: string; satuan: string }>()
  if (barangIds.length > 0) {
    const { data: barangList } = await supabaseAdmin
      .from('barang')
      .select('id, nama, kode, satuan')
      .in('id', barangIds)
    barangMap = new Map(barangList?.map(b => [b.id, b]) ?? [])
  }

  let rfqItemNames: string[] = []
  if (qtn.rfq_id) {
    const { data: rfqItems } = await supabaseAdmin
      .from('rfq_customer_item')
      .select('nama_barang')
      .eq('rfq_customer_id', qtn.rfq_id)
    if (rfqItems) {
      rfqItemNames = rfqItems.map(r => r.nama_barang).filter(Boolean) as string[]
    }
  }

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
    tanda_tangan_stempel_url: settingsMap.get('tanda_tangan_stempel_url') ?? null,
  }

  const pdfData = {
    nomor: qtn.nomor,
    referensi: qtn.referensi ?? null,
    lampiran: qtn.lampiran ?? null,
    perihal: qtn.perihal ?? null,
    pic_customer_nama: picCustomerNama,
    pic_customer_no_hp: picCustomerNoHp,
    customer: customer ?? { nama: '-', kode: '-' },
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
    items: items.map((i, idx) => {
      const barang = i.barang_id ? barangMap.get(i.barang_id) : null
      const rfqName = idx < rfqItemNames.length ? rfqItemNames[idx] : null
      return {
      nama: barang?.nama ?? rfqName ?? '-',
      kode: barang?.kode ?? '-',
      specification: i.specification ?? null,
      justification: i.justification ?? null,
      image_url: i.image_url ?? null,
      satuan: i.satuan ?? null,
      jumlah: i.jumlah,
      hargaSatuan: i.harga_satuan,
      diskon: i.diskon ?? 0,
      }
    }),
    company,
  }

  try {
    const blob = await pdf(QuotationPDF({ data: pdfData }) as any).toBlob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="SPH-${qtn.nomor}.pdf"`,
      },
    })
  } catch (e) {
    console.error('PDF generation error:', e)
    console.error('PDF generation stack:', e instanceof Error ? e.stack : 'no stack')
    const msg = e instanceof Error ? e.message : 'Gagal generate PDF'
    return NextResponse.json({ error: msg, code: 'PDF_GENERATION_ERROR' }, { status: 500 })
  }
}
