import { supabaseAdmin } from '@/lib/api/supabase-server'

interface PoItemRow { purchase_order: { status: string } | null; harga_satuan: number | null }
interface KontrakItemRow { harga: number }

export interface RekomendasiHarga {
  barang_id: string
  barang_nama: string
  barang_kode: string
  harga_beli_terendah: number | null
  harga_beli_rata_rata: number | null
  harga_jual_rekomendasi: number | null
  margin: number
  sumber: string
}

export async function getRekomendasiHarga(barangId: string): Promise<RekomendasiHarga | null> {
  const { data: barang } = await supabaseAdmin.from('barang').select('*').eq('id', barangId).single()
  if (!barang) return null

  const { data: poItems } = await supabaseAdmin.from('purchase_order_item')
    .select('*, purchase_order!purchase_order_id(status)')
    .eq('barang_id', barangId)

  const typedItems = (poItems ?? []) as unknown as PoItemRow[]
  const activePoItems = typedItems.filter(i => i.purchase_order?.status !== 'draft')
  const hargaBeliList = activePoItems.map(i => i.harga_satuan).filter((v): v is number => v !== null)
  const hargaBeliTerendah = hargaBeliList.length > 0 ? Math.min(...hargaBeliList) : barang.harga_beli_default
  const hargaBeliRata = hargaBeliList.length > 0 ? hargaBeliList.reduce((a, b) => a + b, 0) / hargaBeliList.length : barang.harga_beli_default

  const { data: kontrakItems } = await supabaseAdmin.from('kontrak_item')
    .select('*, kontrak!kontrak_id(is_active)')
    .eq('barang_id', barangId)
    .eq('kontrak.is_active', true)

  let hargaKontrak: number | null = null
  if (kontrakItems && kontrakItems.length > 0) {
    const item = kontrakItems[0] as unknown as KontrakItemRow
    hargaKontrak = item.harga
  }

  const hargaBeli = hargaKontrak ?? hargaBeliTerendah
  const margin = 0.15
  const hargaJualRekomendasi = hargaBeli ? hargaBeli * (1 + margin) : barang.harga_jual_default

  const sumber = hargaKontrak ? 'Kontrak' : hargaBeliList.length > 0 ? 'PO Terendah' : 'Default'

  return {
    barang_id: barangId,
    barang_nama: barang.nama,
    barang_kode: barang.kode,
    harga_beli_terendah: hargaBeliTerendah,
    harga_beli_rata_rata: hargaBeliRata,
    harga_jual_rekomendasi: hargaJualRekomendasi,
    margin,
    sumber,
  }
}

export async function getRekomendasiForQuotation(customerId: string, items: Array<{ barang_id: string }>): Promise<RekomendasiHarga[]> {
  const results: RekomendasiHarga[] = []
  for (const item of items) {
    const rekom = await getRekomendasiHarga(item.barang_id)
    if (rekom) results.push(rekom)
  }
  return results
}
