import { supabaseAdmin } from '@/lib/api/supabase-server'

export interface PriceTrendPoint {
  bulan: string
  harga_rata: number
  harga_min: number
  harga_max: number
  jumlah_transaksi: number
}

export interface PriceTrendResult {
  barang_id: string
  nama: string
  kode: string
  satuan: string | null
  trends: PriceTrendPoint[]
  stats: {
    rata_rata: number
    minimum: number
    maksimum: number
    perubahan: number
    rekomendasi_beli: string
  }
}

export async function getPriceTrend(
  barangId: string,
  bulan: number = 12,
): Promise<PriceTrendResult | null> {
  const { data: barang } = await supabaseAdmin
    .from('barang')
    .select('id, nama, kode, satuan')
    .eq('id', barangId)
    .single()

  if (!barang) return null

  const since = new Date()
  since.setMonth(since.getMonth() - bulan)

  const { data: items } = await supabaseAdmin
    .from('purchase_order_item')
    .select('harga_satuan, created_at')
    .eq('barang_id', barangId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  if (!items || items.length === 0) {
    return {
      barang_id: barang.id,
      nama: barang.nama,
      kode: barang.kode,
      satuan: barang.satuan,
      trends: [],
      stats: { rata_rata: 0, minimum: 0, maksimum: 0, perubahan: 0, rekomendasi_beli: 'Belum ada data transaksi' },
    }
  }

  const monthMap = new Map<string, { prices: number[] }>()
  for (const item of items) {
    const key = item.created_at.slice(0, 7)
    const entry = monthMap.get(key) ?? { prices: [] }
    entry.prices.push(item.harga_satuan)
    monthMap.set(key, entry)
  }

  const trends: PriceTrendPoint[] = Array.from(monthMap.entries())
    .map(([bulan, data]) => ({
      bulan,
      harga_rata: Math.round((data.prices.reduce((a, b) => a + b, 0) / data.prices.length) * 100) / 100,
      harga_min: Math.min(...data.prices),
      harga_max: Math.max(...data.prices),
      jumlah_transaksi: data.prices.length,
    }))

  const allPrices = items.map((i) => i.harga_satuan)
  const avg = allPrices.reduce((a, b) => a + b, 0) / allPrices.length
  const min = Math.min(...allPrices)
  const max = Math.max(...allPrices)

  let perubahan = 0
  if (trends.length >= 2) {
    const first = trends[0].harga_rata
    const last = trends[trends.length - 1].harga_rata
    perubahan = first > 0 ? Math.round(((last - first) / first) * 10000) / 100 : 0
  }

  let rekomendasi_beli = 'Sekarang — harga stabil'
  if (perubahan < -10) rekomendasi_beli = 'Sekarang — harga sedang turun'
  else if (perubahan > 10) rekomendasi_beli = 'Tunggu — harga sedang naik'
  else if (perubahan < -5) rekomendasi_beli = 'Sekarang — harga cenderung turun'

  return {
    barang_id: barang.id,
    nama: barang.nama,
    kode: barang.kode,
    satuan: barang.satuan,
    trends,
    stats: { rata_rata: Math.round(avg * 100) / 100, minimum: min, maksimum: max, perubahan, rekomendasi_beli },
  }
}
