import { supabaseAdmin } from '@/lib/api/supabase-server'

export async function generateAutoKode(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('barang')
    .select('kode')
    .like('kode', 'BRG-RRI-%')
    .order('kode', { ascending: false })
    .limit(1)

  const last = (data?.[0]?.kode as string) ?? ''
  const lastNum = parseInt(last.replace('BRG-RRI-', ''), 10) || 0
  const nextNum = lastNum + 1
  return `BRG-RRI-${String(nextNum).padStart(5, '0')}`
}

export async function generateCustomerAutoKode(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('customer')
    .select('kode')
    .like('kode', 'CUST-%')
    .order('kode', { ascending: false })
    .limit(1)

  const last = (data?.[0]?.kode as string) ?? ''
  const lastNum = parseInt(last.replace('CUST-', ''), 10) || 0
  const nextNum = lastNum + 1
  return `CUST-${String(nextNum).padStart(5, '0')}`
}

export async function createBarangFromRfqItem(
  nama_barang: string,
  satuan: string | null,
  kategori_id: string | null,
  image_url: string | null,
  harga_jual_default?: number | null,
) {
  const kode = await generateAutoKode()
  const kategori = kategori_id || await getDefaultKategoriId()

  const { data, error } = await supabaseAdmin
    .from('barang')
    .insert({
      nama: nama_barang,
      kode,
      kategori_id: kategori,
      satuan: satuan || 'pcs',
      image_url,
      harga_jual_default: harga_jual_default ?? null,
      stok_minimum: 0,
      is_active: true,
    })
    .select('id, nama, kode')
    .single()

  if (error) throw new Error(`Gagal membuat barang ${nama_barang}: ${error.message}`)
  return data as { id: string; nama: string; kode: string }
}

export async function getDefaultKategoriId(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('kategori_barang')
    .select('id')
    .ilike('nama', 'lainnya')
    .limit(1)
    .single()

  if (data?.id) return data.id as string

  const { data: newCat, error } = await supabaseAdmin
    .from('kategori_barang')
    .insert({ nama: 'Lainnya' })
    .select('id')
    .single()

  if (error) throw new Error('Gagal membuat kategori default')
  return newCat!.id as string
}

interface UnmappedItem {
  id: string
  nama_barang: string | null
  satuan: string | null
  image_url: string | null
  jumlah: number
  harga_satuan: number | null
}

export async function getUnmappedRfqItems(customerPoId: string): Promise<UnmappedItem[]> {
  const { data: po } = await supabaseAdmin
    .from('customer_po')
    .select('quotation_id')
    .eq('id', customerPoId)
    .single()

  if (!po?.quotation_id) return []

  const { data: qtn } = await supabaseAdmin
    .from('quotation')
    .select('rfq_id')
    .eq('id', po.quotation_id)
    .single()

  if (!qtn?.rfq_id) return []

  const { data: items } = await supabaseAdmin
    .from('rfq_customer_item')
    .select('id, nama_barang, satuan, image_url, jumlah')
    .eq('rfq_customer_id', qtn.rfq_id)
    .is('barang_id', null)

  const { data: qtnItems } = await supabaseAdmin
    .from('quotation_item')
    .select('harga_satuan')
    .eq('quotation_id', po.quotation_id)
    .order('created_at', { ascending: true })

  return (items ?? []).map((rfqItem, idx) => ({
    ...rfqItem,
    harga_satuan: (qtnItems?.[idx] as { harga_satuan: number } | undefined)?.harga_satuan ?? null,
  })) as UnmappedItem[]
}
