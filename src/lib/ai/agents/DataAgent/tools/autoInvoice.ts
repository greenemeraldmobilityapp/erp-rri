import { supabaseAdmin } from '@/lib/api/supabase-server'

export interface AutoInvoiceInput {
  quotation_id: string
  delivery_order_id?: string
  customer_id: string
  tanggal: string
  top: string
  notes?: string
}

export interface AutoInvoiceResult {
  success: boolean
  invoice_id?: string
  draft_data: {
    quotation_id: string
    customer_id: string
    nomor?: string
    tanggal: string
    top: string
    items: Array<{
      barang_id: string
      nama: string
      jumlah: number
      harga: number
      diskon: number
      subtotal: number
    }>
    subtotal: number
    ppn: number
    pph: number
    grand_total: number
  }
  warnings: string[]
  created_at: string
}

export async function generateInvoiceFromQuotation(
  input: AutoInvoiceInput
): Promise<AutoInvoiceResult> {
  const { data: quotation } = await supabaseAdmin
    .from('quotation')
    .select('*')
    .eq('id', input.quotation_id)
    .single()

  if (!quotation) {
    throw new Error('Quotation tidak ditemukan')
  }

  const { data: qItems } = await supabaseAdmin
    .from('quotation_item')
    .select('*, barang!barang_id(id, nama, kode)')
    .eq('quotation_id', input.quotation_id)

  const { data: customer } = await supabaseAdmin
    .from('customer')
    .select('nama, kode')
    .eq('id', input.customer_id)
    .single()

  const deliveredQty: Record<string, number> = {}
  if (input.delivery_order_id) {
    const { data: doItems } = await supabaseAdmin
      .from('delivery_order_item')
      .select('barang_id, jumlah_diterima')
      .eq('delivery_order_id', input.delivery_order_id)

    for (const item of doItems ?? []) {
      deliveredQty[item.barang_id] = (deliveredQty[item.barang_id] ?? 0) + (item.jumlah_diterima ?? 0)
    }
  }

  const items = (qItems ?? []).map((qi: {
    barang_id: string
    barang?: { id: string; nama: string; kode: string }
    jumlah: number
    harga_satuan: number
    diskon?: number
  }) => {
    const delivered = deliveredQty[qi.barang_id] ?? qi.jumlah
    const subtotal = delivered * qi.harga_satuan * (1 - (qi.diskon ?? 0) / 100)
    return {
      barang_id: qi.barang_id,
      nama: qi.barang?.nama ?? 'Unknown',
      jumlah: delivered,
      harga: qi.harga_satuan,
      diskon: qi.diskon ?? 0,
      subtotal,
    }
  })

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0)
  const ppnRate = (quotation as { ppn_rate?: number }).ppn_rate ?? 0.11
  const ppn = subtotal * ppnRate
  const grandTotal = subtotal + ppn

  const warnings: string[] = []
  for (const qi of qItems ?? []) {
    const delivered = deliveredQty[qi.barang_id] ?? qi.jumlah
    if (delivered < (qi as { jumlah: number }).jumlah) {
      warnings.push(`Item ${(qi.barang as { nama: string })?.nama}: delivered ${delivered} of ${(qi as { jumlah: number }).jumlah}`)
    }
  }

  const result: AutoInvoiceResult = {
    success: true,
    draft_data: {
      quotation_id: input.quotation_id,
      customer_id: input.customer_id,
      tanggal: input.tanggal,
      top: input.top,
      items,
      subtotal,
      ppn,
      pph: 0,
      grand_total: grandTotal,
    },
    warnings,
    created_at: new Date().toISOString(),
  }

  try {
    const { data: created, error } = await supabaseAdmin
      .from('invoice')
      .insert({
        quotation_id: input.quotation_id,
        customer_id: input.customer_id,
        tanggal: input.tanggal,
        top: input.top,
        status: 'draft',
        ppn_rate: ppnRate,
        notes: input.notes,
      })
      .select()
      .single()

    if (!error && created) {
      result.invoice_id = created.id
    }
  } catch {
    // invoice creation is optional - draft data is returned anyway
  }

  return result
}