import { supabaseAdmin } from '@/lib/api/supabase-server'

export interface PriceRecommendation {
  barang_id: string
  harga_beli_terendah: number
  harga_beli_rata: number
  harga_rekomendasi: number
  margin: number
  margin_breakdown: {
    base_margin: number
    volume_adjust: number
    customer_tier_adjust: number
    payment_terms_adjust: number
  }
  customer_tier: 'A' | 'B' | 'C'
  order_volume: number
  payment_terms: string
  sumber_harga: string
  confidence: number
  warnings: string[]
}

const BASE_MARGIN = 0.15

const TIER_ADJUSTMENTS = {
  A: -0.02, // loyal customer gets discount
  B: 0,
  C: 0.03,  // risky customer premium
}

const VOLUME_ADJUSTMENTS: Array<{ min: number; adjust: number }> = [
  { min: 500, adjust: -0.03 },
  { min: 200, adjust: -0.02 },
  { min: 100, adjust: -0.01 },
  { min: 50, adjust: -0.005 },
]

const PAYMENT_TERM_ADJUSTMENTS: Record<string, number> = {
  cash: -0.01,
  cod: -0.005,
  'net 30': 0,
  '30 hari': 0.005,
  'net 60': 0.01,
  '60 hari': 0.01,
  'net 90': 0.015,
  '90 hari': 0.015,
}

export async function getPriceRecommendation(
  barangId: string,
  customerTier: 'A' | 'B' | 'C',
  orderVolume: number,
  paymentTerms: string
): Promise<PriceRecommendation> {
  const { data: barang } = await supabaseAdmin
    .from('barang')
    .select('*')
    .eq('id', barangId)
    .single()

  if (!barang) {
    throw new Error('Barang tidak ditemukan')
  }

  const { data: poItems } = await supabaseAdmin
    .from('purchase_order_item')
    .select('*, purchase_order!purchase_order_id(status)')
    .eq('barang_id', barangId)

  const activeItems = (poItems ?? []).filter(
    (i: { purchase_order?: { status: string } }) => i.purchase_order?.status !== 'draft'
  )
  const hargaBeliList = activeItems
    .map((i: { harga_satuan: number | null }) => i.harga_satuan)
    .filter((v: number | null): v is number => v !== null)

  const hargaBeliTerendah =
    hargaBeliList.length > 0 ? Math.min(...hargaBeliList) : barang.harga_beli_default ?? 0
  const hargaBeliRata =
    hargaBeliList.length > 0
      ? hargaBeliList.reduce((a: number, b: number) => a + b, 0) / hargaBeliList.length
      : barang.harga_beli_default ?? 0

  const { data: kontrakItems } = await supabaseAdmin
    .from('kontrak_item')
    .select('*, kontrak!kontrak_id(is_active)')
    .eq('barang_id', barangId)
    .eq('kontrak.is_active', true)

  let sumberHarga = 'PO Terendah'
  let hargaBeli = hargaBeliTerendah

  if (kontrakItems && kontrakItems.length > 0) {
    hargaBeli = (kontrakItems[0] as { harga: number }).harga
    sumberHarga = 'Kontrak'
  }

  if (hargaBeli === 0) {
    hargaBeli = barang.harga_beli_default ?? 0
    sumberHarga = 'Default'
  }

  const marginBreakdown = {
    base_margin: BASE_MARGIN,
    volume_adjust: 0,
    customer_tier_adjust: TIER_ADJUSTMENTS[customerTier],
    payment_terms_adjust: PAYMENT_TERM_ADJUSTMENTS[paymentTerms.toLowerCase()] ?? 0,
  }

  for (const va of VOLUME_ADJUSTMENTS) {
    if (orderVolume >= va.min) {
      marginBreakdown.volume_adjust = va.adjust
      break
    }
  }

  const finalMargin =
    BASE_MARGIN +
    marginBreakdown.volume_adjust +
    marginBreakdown.customer_tier_adjust +
    marginBreakdown.payment_terms_adjust

  const hargaRekomendasi = Math.round(hargaBeli * (1 + finalMargin) / 1000) * 1000
  const warnings: string[] = []

  if (finalMargin < 0.05) {
    warnings.push('Margin akhir sangat tipis - perlu approval khusus')
  }

  if (hargaBeliList.length === 0) {
    warnings.push('Tidak ada data PO - menggunakan default price')
  }

  return {
    barang_id: barangId,
    harga_beli_terendah: hargaBeliTerendah,
    harga_beli_rata: hargaBeliRata,
    harga_rekomendasi: hargaRekomendasi,
    margin: finalMargin,
    margin_breakdown: marginBreakdown,
    customer_tier: customerTier,
    order_volume: orderVolume,
    payment_terms: paymentTerms,
    sumber_harga: sumberHarga,
    confidence: hargaBeliList.length > 0 ? 0.9 : 0.6,
    warnings,
  }
}