import { supabaseAdmin } from '@/lib/api/supabase-server'

export interface PRRouterInput {
  purchase_request_id?: string
  items: Array<{
    barang_id: string
    jumlah: number
    keterangan?: string
  }>
}

export interface SupplierRecommendation {
  supplier_id: string
  supplier_nama: string
  supplier_kode: string
  rating: number
  on_time_rate: number
  last_delivery: string | null
  recommended_items: Array<{
    barang_id: string
    harga_satuan: number | null
    last_po_price: number | null
    is_contract_price: boolean
  }>
  total_estimated: number
  delivery_days: number
  notes: string
}

export interface PRRouterResult {
  request_id?: string
  recommendations: SupplierRecommendation[]
  best_supplier_id: string
  best_supplier_nama: string
  reason: string
  routing_confidence: number
  warnings: string[]
}

export async function routePurchaseRequest(
  input: PRRouterInput
): Promise<PRRouterResult> {
  const allSupplierRatings: Array<{
    supplier_id: string
    supplier_nama: string
    supplier_kode: string
    rating: number
    on_time_rate: number
    last_delivery: string | null
  }> = []

  const { data: suppliers } = await supabaseAdmin
    .from('supplier')
    .select('id, nama, kode')
    .eq('is_active', true)

  for (const sup of suppliers ?? []) {
    const { data: poHistory } = await supabaseAdmin
      .from('purchase_order')
      .select('id, status, delivered_at, created_at')
      .eq('supplier_id', sup.id)
      .in('status', ['completed', 'received'])
      .order('created_at', { ascending: false })
      .limit(10)

    const completedOrders = (poHistory ?? []).filter(
      (po: { status: string; delivered_at?: string; created_at: string }) => po.status === 'completed'
    )

    const onTimeDeliveries = completedOrders.filter((po: { delivered_at?: string; created_at: string }) => {
      if (!po.delivered_at) return false
      const created = new Date(po.created_at)
      const delivered = new Date(po.delivered_at)
      const leadTime = Math.ceil((delivered.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      return leadTime <= 14
    })

    const onTimeRate = completedOrders.length > 0 ? onTimeDeliveries.length / completedOrders.length : 0.5

    const rating = 3 + onTimeRate * 2

    allSupplierRatings.push({
      supplier_id: sup.id,
      supplier_nama: sup.nama,
      supplier_kode: sup.kode,
      rating: Math.round(rating * 10) / 10,
      on_time_rate: Math.round(onTimeRate * 100),
      last_delivery: poHistory?.[0]?.delivered_at ?? null,
    })
  }

  const supplierRecs: SupplierRecommendation[] = []

  for (const supplier of allSupplierRatings) {
    const recommendedItems: SupplierRecommendation['recommended_items'] = []
    let totalEstimated = 0

    for (const item of input.items) {
      const { data: barang } = await supabaseAdmin
        .from('barang')
        .select('nama, harga_beli_default')
        .eq('id', item.barang_id)
        .single()

      const { data: kontrakItem } = await supabaseAdmin
        .from('kontrak_item')
        .select('harga, kontrak(supplier_id)')
        .eq('barang_id', item.barang_id)
        .eq('kontrak.supplier_id', supplier.supplier_id)
        .eq('kontrak.is_active', true)
        .single()

      const { data: lastPo } = await supabaseAdmin
        .from('purchase_order_item')
        .select('harga_satuan')
        .eq('barang_id', item.barang_id)
        .eq('purchase_order(supplier_id, status)', { supplier_id: supplier.supplier_id, status: 'completed' })
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const harga = kontrakItem
        ? (kontrakItem as { harga: number }).harga
        : lastPo?.harga_satuan ?? barang?.harga_beli_default ?? 0

      recommendedItems.push({
        barang_id: item.barang_id,
        harga_satuan: harga,
        last_po_price: lastPo?.harga_satuan ?? null,
        is_contract_price: !!kontrakItem,
      })

      totalEstimated += harga * item.jumlah
    }

    supplierRecs.push({
      ...supplier,
      recommended_items: recommendedItems,
      total_estimated: totalEstimated,
      delivery_days: supplier.on_time_rate > 0.7 ? 7 : supplier.on_time_rate > 0.5 ? 10 : 14,
      notes: supplier.on_time_rate > 0.7
        ? 'Recommended - on-time delivery track record baik'
        : supplier.on_time_rate > 0.5
        ? 'Acceptable -偶尔 delay'
        : 'Consider backup - sering delay',
    })
  }

  supplierRecs.sort((a, b) => {
    const scoreA = a.rating * 0.4 + (100 - a.delivery_days) * 0.3 + (1 / (a.total_estimated + 1)) * 0.3
    const scoreB = b.rating * 0.4 + (100 - b.delivery_days) * 0.3 + (1 / (b.total_estimated + 1)) * 0.3
    return scoreB - scoreA
  })

  const best = supplierRecs[0]
  const warnings: string[] = []
  if (supplierRecs.length === 0) {
    warnings.push('Tidak ada data supplier - manual routing diperlukan')
  }
  if (best && best.rating < 4) {
    warnings.push('Supplier dengan rating terbaik masih di bawah standar - monitor closely')
  }

  return {
    request_id: input.purchase_request_id,
    recommendations: supplierRecs,
    best_supplier_id: best?.supplier_id ?? '',
    best_supplier_nama: best?.supplier_nama ?? 'N/A',
    reason: `Supplier dengan rating ${best?.rating} dan delivery ${best?.delivery_days} hari`,
    routing_confidence: best ? Math.round(best.rating / 5 * 100) / 100 : 0,
    warnings,
  }
}