import { supabaseAdmin } from '@/lib/api/supabase-server'
import { generateDocumentNumber } from '@/lib/utils/document-number'

export async function generateSOFromPO(customerPoId: string) {
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

  const nomor = await generateDocumentNumber('SO')
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

export async function generateDOFromSO(salesOrderId: string) {
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

  const nomor = await generateDocumentNumber('SJ')
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

  const doItems = items.map(i => ({
    delivery_order_id: sj.id,
    barang_id: i.barang_id,
    jumlah: i.jumlah,
    keterangan: i.keterangan ?? null,
    created_at: now,
    updated_at: now,
  }))

  const { error: itemsError } = await supabaseAdmin.from('delivery_order_item').insert(doItems)
  if (itemsError) {
    await supabaseAdmin.from('delivery_order').delete().eq('id', sj.id)
    return { success: false, error: itemsError.message }
  }

  return { success: true, data: { id: sj.id, nomor: sj.nomor, type: 'DO' } }
}
