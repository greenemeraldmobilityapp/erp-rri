import { supabaseAdmin } from '@/lib/api/supabase-server'

export interface AutoSuggestItem {
  barang_id: string
  nama: string
  kode: string
  satuan: string | null
  last_harga: number
  total_dibeli: number
  sumber: 'customer' | 'global'
}

export async function autoSuggestBarang(
  query: string,
  customerId?: string,
  limit: number = 10,
): Promise<AutoSuggestItem[]> {
  const results: AutoSuggestItem[] = []

  if (customerId) {
    const { data: quotaIds } = await supabaseAdmin
      .from('quotation')
      .select('id')
      .eq('customer_id', customerId)
      .not('status', 'eq', 'draft')
      .not('status', 'eq', 'lost')
      .limit(100)

    if (quotaIds && quotaIds.length > 0) {
      const ids = quotaIds.map((q) => q.id)
      const { data: customerItems } = await supabaseAdmin
        .from('quotation_item')
        .select(`
          barang_id,
          harga_satuan,
          created_at
        `)
        .in('quotation_id', ids)
        .order('created_at', { ascending: false })
        .limit(limit * 3)

      const seen = new Set<string>()
      for (const item of customerItems ?? []) {
        if (seen.has(item.barang_id)) continue
        seen.add(item.barang_id)
      }

      if (seen.size > 0) {
        const { data: barangData } = await supabaseAdmin
          .from('barang')
          .select('id, nama, kode, satuan')
          .in('id', Array.from(seen))
          .ilike('nama', `%${query}%`)
          .limit(limit)

        const barangMap = new Map((barangData ?? []).map((b) => [b.id, b]))
        for (const item of customerItems ?? []) {
          const b = barangMap.get(item.barang_id)
          if (!b) continue
          if (results.some((r) => r.barang_id === b.id)) continue
          results.push({
            barang_id: b.id,
            nama: b.nama,
            kode: b.kode,
            satuan: b.satuan ?? null,
            last_harga: item.harga_satuan ?? 0,
            total_dibeli: 1,
            sumber: 'customer',
          })
          if (results.length >= limit) break
        }
      }
    }
  }

  if (results.length < limit) {
    const { data: globalItems } = await supabaseAdmin
      .from('barang')
      .select('id, nama, kode, satuan')
      .ilike('nama', `%${query}%`)
      .limit(limit - results.length)

    for (const b of globalItems ?? []) {
      if (results.some((r) => r.barang_id === b.id)) continue
      results.push({
        barang_id: b.id,
        nama: b.nama,
        kode: b.kode,
        satuan: b.satuan ?? null,
        last_harga: 0,
        total_dibeli: 0,
        sumber: 'global',
      })
    }
  }

  return results
}
