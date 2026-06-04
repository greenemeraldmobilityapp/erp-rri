import { supabaseAdmin } from '@/lib/api/supabase-server'
import { formatChildNumber } from '@/lib/utils/document-number'

export async function generateSOFromPO(customerPoId: string) {
  const existing = await supabaseAdmin
    .from('sales_order')
    .select('id, nomor')
    .eq('customer_po_id', customerPoId)
    .maybeSingle()
  if (existing.data) return { success: true, data: { id: existing.data.id, nomor: existing.data.nomor, type: 'SO' } }

  const { data: po, error } = await supabaseAdmin
    .from('customer_po')
    .select('*')
    .eq('id', customerPoId)
    .single()
  if (error || !po) return { success: false, error: 'Customer PO not found' }

  const { data: items } = await supabaseAdmin
    .from('customer_po_item')
    .select('*')
    .eq('customer_po_id', customerPoId)
  if (!items?.length) return { success: false, error: 'No items in PO' }

  const nomor = formatChildNumber(po.nomor, 'SO')
  const now = new Date().toISOString()

  const { data: so, error: soError } = await supabaseAdmin.from('sales_order').insert({
    nomor,
    customer_po_id: customerPoId,
    tanggal: po.tanggal,
    status: 'draft',
    waktu_pengiriman: po.waktu_pengiriman ?? null,
    created_at: now,
    updated_at: now,
  }).select().single()
  if (soError) return { success: false, error: soError.message }

  const soItems = items.map(i => ({
    sales_order_id: so.id,
    barang_id: i.barang_id,
    jumlah: i.jumlah,
    harga_satuan: i.harga_satuan,
    keterangan: i.keterangan ?? null,
    created_at: now,
    updated_at: now,
  }))

  const { error: itemsError } = await supabaseAdmin.from('sales_order_item').insert(soItems)
  if (itemsError) {
    await supabaseAdmin.from('sales_order').delete().eq('id', so.id)
    return { success: false, error: itemsError.message }
  }

  return { success: true, data: { id: so.id, nomor: so.nomor, type: 'SO' } }
}

export async function generateSOFromDI(diId: string) {
  const existing = await supabaseAdmin
    .from('sales_order')
    .select('id, nomor')
    .eq('di_id', diId)
    .maybeSingle()
  if (existing.data) return { success: true, data: { id: existing.data.id, nomor: existing.data.nomor, type: 'SO' } }

  const { data: diDoc, error } = await supabaseAdmin
    .from('di')
    .select('*')
    .eq('id', diId)
    .single()
  if (error || !diDoc) return { success: false, error: 'DI not found' }

  const { data: diItems } = await supabaseAdmin
    .from('di_item')
    .select('*')
    .eq('di_id', diId)
  if (!diItems?.length) return { success: false, error: 'No items in DI' }

  const { data: kontrakItems } = diDoc.kontrak_id
    ? await supabaseAdmin
        .from('kontrak_item')
        .select('barang_id, harga_satuan')
        .eq('kontrak_id', diDoc.kontrak_id)
    : { data: null }

  const hargaMap = new Map<string, number>()
  if (kontrakItems) {
    for (const ki of kontrakItems) {
      hargaMap.set(ki.barang_id, ki.harga_satuan)
    }
  }

  const nomor = formatChildNumber(diDoc.nomor, 'SO')
  const now = new Date().toISOString()

  const { data: so, error: soError } = await supabaseAdmin.from('sales_order').insert({
    nomor,
    di_id: diId,
    tanggal: diDoc.tanggal,
    status: 'draft',
    waktu_pengiriman: diDoc.waktu_pengiriman ?? null,
    created_at: now,
    updated_at: now,
  }).select().single()
  if (soError) return { success: false, error: soError.message }

  const soItems = diItems.map(i => ({
    sales_order_id: so.id,
    barang_id: i.barang_id,
    jumlah: i.jumlah,
    harga_satuan: i.harga_satuan > 0 ? i.harga_satuan : (hargaMap.get(i.barang_id) ?? 0),
    nama_barang: i.nama_barang ?? null,
    kode_barang: i.kode_barang ?? null,
    satuan: i.satuan ?? null,
    keterangan: i.keterangan ?? null,
    created_at: now,
    updated_at: now,
  }))

  const { error: itemsError } = await supabaseAdmin.from('sales_order_item').insert(soItems)
  if (itemsError) {
    await supabaseAdmin.from('sales_order').delete().eq('id', so.id)
    return { success: false, error: itemsError.message }
  }

  return { success: true, data: { id: so.id, nomor: so.nomor, type: 'SO' } }
}

export async function generateDOFromSO(salesOrderId: string) {
  const existing = await supabaseAdmin
    .from('delivery_order')
    .select('id, nomor')
    .eq('sales_order_id', salesOrderId)
    .maybeSingle()
  if (existing.data) return { success: true, data: { id: existing.data.id, nomor: existing.data.nomor, type: 'DO' } }

  const { data: so, error } = await supabaseAdmin
    .from('sales_order')
    .select('*')
    .eq('id', salesOrderId)
    .single()
  if (error || !so) return { success: false, error: 'Sales Order not found' }

  const { data: items } = await supabaseAdmin
    .from('sales_order_item')
    .select('*')
    .eq('sales_order_id', salesOrderId)
  if (!items?.length) return { success: false, error: 'No items in SO' }

  const nomor = formatChildNumber(so.nomor, 'SJ')
  const now = new Date().toISOString()

  const { data: sj, error: sjError } = await supabaseAdmin.from('delivery_order').insert({
    nomor,
    sales_order_id: salesOrderId,
    tanggal: so.tanggal,
    status: 'draft',
    waktu_pengiriman: so.waktu_pengiriman ?? null,
    created_at: now,
    updated_at: now,
  }).select().single()
  if (sjError) return { success: false, error: sjError.message }

  const barangIds = items.map(i => i.barang_id)
  const { data: barangs } = await supabaseAdmin.from('barang').select('id, nama, kode, satuan').in('id', barangIds)
  const barangMap = new Map(barangs?.map(b => [b.id, b]) ?? [])

  const doItems = items.map((i, idx) => {
    const b = barangMap.get(i.barang_id)
    return {
      delivery_order_id: sj.id,
      barang_id: i.barang_id,
      jumlah: i.jumlah,
      nama_barang: i.nama_barang ?? b?.nama ?? null,
      kode_barang: i.kode_barang ?? b?.kode ?? null,
      satuan: i.satuan ?? b?.satuan ?? null,
      keterangan: i.keterangan ?? null,
      urutan: idx + 1,
      created_at: now,
      updated_at: now,
    }
  })

  const { error: itemsError } = await supabaseAdmin.from('delivery_order_item').insert(doItems)
  if (itemsError) {
    await supabaseAdmin.from('delivery_order').delete().eq('id', sj.id)
    return { success: false, error: itemsError.message }
  }

  return { success: true, data: { id: sj.id, nomor: sj.nomor, type: 'DO' } }
}
