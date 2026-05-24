import { supabaseAdmin } from '@/lib/api/supabase-server'

export interface AnomalyResult {
  type: 'harga_jual_miring' | 'harga_beli_mahal' | 'margin_kecil' | 'duplikat_transaksi'
  severity: 'low' | 'medium' | 'high'
  entity_type: string
  entity_id: string
  nomor: string
  deskripsi: string
  nilai: number
  threshold: number
  selisih_persen: number
  tanggal: string
}

export async function detectAnomalies(
  days: number = 30,
): Promise<AnomalyResult[]> {
  const results: AnomalyResult[] = []
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data: barangList } = await supabaseAdmin
    .from('barang')
    .select('id, nama, kode')

  if (!barangList) return []

  for (const barang of barangList.slice(0, 50)) {
    const { data: items } = await supabaseAdmin
      .from('purchase_order_item')
      .select('id, harga_satuan, created_at')
      .eq('barang_id', barang.id)
      .gte('created_at', since.toISOString())

    if (!items || items.length < 3) continue

    const prices = items.map((i) => i.harga_satuan)
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    const variance = prices.reduce((sum, p) => sum + (p - avg) ** 2, 0) / prices.length
    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) continue

    for (const item of items) {
      const zScore = Math.abs(item.harga_satuan - avg) / stdDev
      if (zScore > 2.5) {
        const { data: po } = await supabaseAdmin
          .from('purchase_order_item')
          .select('purchase_order!inner(id, nomor, status)')
          .eq('id', item.id)
          .single()
        const poData = po as unknown as { purchase_order: { id: string; nomor: string; status: string }[] } | null
        const nomor = poData?.purchase_order?.[0]?.nomor ?? ''
        const isExpensive = item.harga_satuan > avg
        results.push({
          type: isExpensive ? 'harga_beli_mahal' : 'harga_jual_miring',
          severity: zScore > 3.5 ? 'high' : 'medium',
          entity_type: 'purchase_order_item',
          entity_id: item.id,
          nomor,
          deskripsi: `${barang.nama}: harga ${isExpensive ? 'terlalu mahal' : 'terlalu murah'} (Rp${item.harga_satuan.toLocaleString()} vs rata-rata Rp${Math.round(avg).toLocaleString()})`,
          nilai: item.harga_satuan,
          threshold: Math.round(avg),
          selisih_persen: Math.round(((item.harga_satuan - avg) / avg) * 100),
          tanggal: item.created_at,
        })
      }
    }
  }

  const { data: quotationItems } = await supabaseAdmin
    .from('quotation_item')
    .select('id, barang_id, harga_satuan, created_at')
    .gte('created_at', since.toISOString())
    .limit(1000)

  if (quotationItems) {
    const barangPrices = new Map<string, number[]>()
    for (const qi of quotationItems) {
      const existing = barangPrices.get(qi.barang_id) ?? []
      existing.push(qi.harga_satuan)
      barangPrices.set(qi.barang_id, existing)
    }

    for (const [barangId, prices] of barangPrices) {
      if (prices.length < 3) continue
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length
      const variance = prices.reduce((sum, p) => sum + (p - avg) ** 2, 0) / prices.length
      const stdDev = Math.sqrt(variance)
      if (stdDev === 0) continue

      const barang = barangList.find((b) => b.id === barangId)
      for (const qi of quotationItems.filter((i) => i.barang_id === barangId)) {
        const zScore = Math.abs(qi.harga_satuan - avg) / stdDev
        if (zScore > 3) {
          const { data: q } = await supabaseAdmin
            .from('quotation_item')
            .select('quotation!inner(id, nomor, status, customer_id)')
            .eq('id', qi.id)
            .single()
          const qData = q as unknown as { quotation: { id: string; nomor: string; status: string; customer_id: string }[] } | null
          const nomor = qData?.quotation?.[0]?.nomor ?? ''
          results.push({
            type: 'margin_kecil',
            severity: 'medium',
            entity_type: 'quotation_item',
            entity_id: qi.id,
            nomor,
            deskripsi: `${barang?.nama ?? barangId}: harga jual terlalu miring (Rp${qi.harga_satuan.toLocaleString()} vs rata-rata Rp${Math.round(avg).toLocaleString()})`,
            nilai: qi.harga_satuan,
            threshold: Math.round(avg),
            selisih_persen: Math.round(((qi.harga_satuan - avg) / avg) * 100),
            tanggal: qi.created_at,
          })
        }
      }
    }
  }

  return results
    .sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })
    .slice(0, 50)
}
