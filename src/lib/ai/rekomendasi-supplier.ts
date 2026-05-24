import { supabaseAdmin } from '@/lib/api/supabase-server'

export interface SupplierScore {
  supplier_id: string
  nama: string
  kode: string
  kontak: string | null
  terms_of_payment: string | null
  is_marketplace: boolean
  metrics: {
    total_po: number
    total_spent: number
    avg_harga_satuan: number
    last_order_date: string | null
    barang_dibeli: number
    price_rank: number
    score: number
  }
}

export async function rekomendasiSupplier(
  barangId?: string,
  minPo: number = 1,
): Promise<SupplierScore[]> {
  const { data: poItems } = await supabaseAdmin
    .from('purchase_order_item')
    .select(`
      id,
      jumlah,
      harga_satuan,
      barang_id,
      purchase_order!inner (
        id,
        supplier_id,
        tanggal,
        status
      )
    `)
    .eq('purchase_order.status', 'selesai')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (!poItems || poItems.length === 0) return []

  const supplierMap = new Map<string, {
    totalPo: number
    totalSpent: number
    prices: number[]
    lastOrder: string | null
    barangSet: Set<string>
  }>()

  for (const raw of poItems) {
    const item = raw as unknown as { id: string; jumlah: number; harga_satuan: number; barang_id: string; purchase_order: { id: string; supplier_id: string; tanggal: string; status: string }[] }
    const po = item.purchase_order?.[0]
    if (!po?.supplier_id) continue
    if (barangId && item.barang_id !== barangId) continue

    const s = supplierMap.get(po.supplier_id) ?? {
      totalPo: 0,
      totalSpent: 0,
      prices: [],
      lastOrder: null,
      barangSet: new Set<string>(),
    }
    s.totalPo++
    s.totalSpent += (item.harga_satuan ?? 0) * (item.jumlah ?? 1)
    s.prices.push(item.harga_satuan ?? 0)
    if (item.barang_id) s.barangSet.add(item.barang_id)
    if (po.tanggal && (!s.lastOrder || po.tanggal > s.lastOrder)) {
      s.lastOrder = po.tanggal
    }
    supplierMap.set(po.supplier_id, s)
  }

  const supplierIds = Array.from(supplierMap.keys())
  const { data: suppliers } = await supabaseAdmin
    .from('supplier')
    .select('id, nama, kode, kontak, terms_of_payment, is_marketplace, is_active')
    .in('id', supplierIds)
    .eq('is_active', true)

  if (!suppliers) return []

  const scores: SupplierScore[] = suppliers.map((sup) => {
    const m = supplierMap.get(sup.id)!
    const avgPrice = m.prices.length > 0
      ? m.prices.reduce((a, b) => a + b, 0) / m.prices.length
      : 0

    const freqScore = Math.min(m.totalPo / 20, 1) * 40
    const recencyScore = m.lastOrder
      ? Math.max(0, 1 - (Date.now() - new Date(m.lastOrder).getTime()) / (365 * 86400000)) * 20
      : 0
    const breadthScore = Math.min(m.barangSet.size / 10, 1) * 20
    const volumeScore = Math.min(m.totalSpent / 100_000_000, 1) * 20

    const score = Math.round(freqScore + recencyScore + breadthScore + volumeScore)

    return {
      supplier_id: sup.id,
      nama: sup.nama,
      kode: sup.kode,
      kontak: sup.kontak,
      terms_of_payment: sup.terms_of_payment,
      is_marketplace: sup.is_marketplace,
      metrics: {
        total_po: m.totalPo,
        total_spent: m.totalSpent,
        avg_harga_satuan: Math.round(avgPrice),
        last_order_date: m.lastOrder,
        barang_dibeli: m.barangSet.size,
        price_rank: 0,
        score,
      },
    }
  })

  const sorted = scores.sort((a, b) => b.metrics.score - a.metrics.score)
  sorted.forEach((s, i) => { s.metrics.price_rank = i + 1 })
  return sorted.filter((s) => s.metrics.total_po >= minPo)
}
