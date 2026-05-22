import { supabaseAdmin } from '@/lib/api/supabase-server'

export interface AnalisaNegosiasi {
  harga_diminta: number
  harga_terendah_disetujui: number
  margin_projected: number
  rekomendasi: string
  level_wewenang: 'sales' | 'manager' | 'owner'
}

export async function analisaNegosiasi(
  quotationId: string,
  hargaDiminta: number,
  barangId: string
): Promise<AnalisaNegosiasi | null> {
  const { data: quotation } = await supabaseAdmin.from('quotation').select('*').eq('id', quotationId).single()
  if (!quotation) return null

  const { data: qItems } = await supabaseAdmin.from('quotation_item')
    .select('*, barang!barang_id(harga_beli_default)')
    .eq('quotation_id', quotationId)
    .eq('barang_id', barangId)
    .single()

  if (!qItems) return null

  const hargaJualAwal = qItems.harga_satuan
  const barangData = qItems.barang as unknown as { harga_beli_default: number | null } | null
  const hargaBeli = barangData?.harga_beli_default ?? 0
  const marginDiminta = hargaBeli > 0 ? (hargaDiminta - hargaBeli) / hargaBeli : 0

  // Decision logic
  let rekomendasi: string
  let levelWewenang: 'sales' | 'manager' | 'owner'

  if (marginDiminta >= 0.15) {
    rekomendasi = 'Harga dapat diterima, margin > 15%'
    levelWewenang = 'sales'
  } else if (marginDiminta >= 0.10) {
    rekomendasi = 'Margin 10-15%, bisa diterima dengan diskusi tim'
    levelWewenang = 'sales'
  } else if (marginDiminta >= 0.05) {
    rekomendasi = 'Margin tipis (5-10%), perlu approval Manager'
    levelWewenang = 'manager'
  } else if (marginDiminta > 0) {
    rekomendasi = 'Margin < 5%, perlu approval Owner'
    levelWewenang = 'owner'
  } else {
    rekomendasi = 'Harga di bawah modal! Tidak disarankan.'
    levelWewenang = 'owner'
  }

  const hargaTerendahDisetujui = hargaBeli * 1.05 // minimum 5% margin

  return {
    harga_diminta: hargaDiminta,
    harga_terendah_disetujui: hargaTerendahDisetujui,
    margin_projected: marginDiminta,
    rekomendasi,
    level_wewenang: levelWewenang,
  }
}
