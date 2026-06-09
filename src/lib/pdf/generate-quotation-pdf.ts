import { pdf, DocumentProps } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { QuotationPDF } from '@/lib/pdf/quotation'
import sharp from 'sharp'

const COMPANY_KEYS = [
  'company_nama', 'company_bidang_usaha', 'company_alamat',
  'company_no_hp', 'company_email', 'company_logo_url',
  'penandatangan_nama', 'penandatangan_jabatan', 'penandatangan_no_hp',
  'tanda_tangan_url', 'stempel_url', 'tanda_tangan_stempel_url',
] as const

async function resolveImageUrl(url: string | null): Promise<string | null> {
  if (!url) return null
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const contentType = response.headers.get('content-type') || ''
    const buffer = Buffer.from(await response.arrayBuffer())
    if (contentType === 'image/webp' || buffer.toString('hex', 0, 4) === '52494646') {
      const jpeg = await sharp(buffer).jpeg({ quality: 85 }).toBuffer()
      return `data:image/jpeg;base64,${jpeg.toString('base64')}`
    }
    return url
  } catch {
    return null
  }
}

export async function generateQuotationPdfBlob(id: string): Promise<Blob | null> {
  const { data: qtn, error } = await supabaseAdmin
    .from('quotation')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !qtn) return null

  let customer = null
  if (qtn.customer_id) {
    const { data: c } = await supabaseAdmin
      .from('customer')
      .select('nama, kode')
      .eq('id', qtn.customer_id)
      .single()
    customer = c
  }

  const { data: items } = await supabaseAdmin
    .from('quotation_item')
    .select('*')
    .eq('quotation_id', id)
  if (!items) return null

  const barangIds = [...new Set(items?.filter(i => i.barang_id).map(i => i.barang_id) ?? [])]
  let barangMap = new Map<string, { nama: string; kode: string; satuan: string; spesifikasi: string | null; image_url: string | null }>()
  if (barangIds.length > 0) {
    const { data: barangList } = await supabaseAdmin
      .from('barang')
      .select('id, nama, kode, satuan, spesifikasi, image_url')
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
  let picCustomerJenisKelamin: string | null = null
  if (qtn.pic_customer_id) {
    const { data: pic } = await supabaseAdmin
      .from('customer_pic')
      .select('nama, no_hp, jenis_kelamin')
      .eq('id', qtn.pic_customer_id)
      .single()
    if (pic) {
      picCustomerNama = pic.nama
      picCustomerNoHp = pic.no_hp
      picCustomerJenisKelamin = pic.jenis_kelamin
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
    revisi: qtn.revisi ?? 0,
    referensi: qtn.referensi ?? null,
    lampiran: qtn.lampiran ?? null,
    perihal: qtn.perihal ?? null,
    pic_customer_nama: picCustomerNama,
    pic_customer_no_hp: picCustomerNoHp,
    pic_jenis_kelamin: picCustomerJenisKelamin,
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
    items: await Promise.all(items.map(async (i, idx) => {
      const barang = i.barang_id ? barangMap.get(i.barang_id) : null
      const rfqName = idx < rfqItemNames.length ? rfqItemNames[idx] : null
      const imageUrl = i.image_url ?? barang?.image_url ?? null
      return {
        nama: barang?.nama ?? i.nama_barang ?? rfqName ?? '-',
        kode: barang?.kode ?? '-',
        specification: i.specification ?? barang?.spesifikasi ?? null,
        justification: i.justification ?? null,
        image_url: await resolveImageUrl(imageUrl),
        satuan: i.satuan ?? barang?.satuan ?? null,
        jumlah: i.jumlah,
        hargaSatuan: i.harga_satuan,
        diskon: i.diskon ?? 0,
      }
    })),
    company,
  }

  try {
    return await pdf(QuotationPDF({ data: pdfData }) as React.ReactElement<DocumentProps>).toBlob()
  } catch {
    return null
  }
}
