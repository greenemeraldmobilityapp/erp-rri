import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateGlobalDocumentNumber, formatChildNumber } from '@/lib/utils/document-number'
import { generateInvoiceJournal } from '@/lib/auto-jurnal'

const itemSchema = z.object({
  barang_id: z.string().min(1),
  harga: z.coerce.number().positive(),
  jumlah: z.coerce.number().int().positive(),
  diskon: z.coerce.number().optional(),
  keterangan: z.string().optional(),
  nama_barang: z.string().optional(),
  kode_barang: z.string().optional(),
  satuan: z.string().optional(),
})

const schema = z.object({
  sales_order_id: z.string().min(1, 'Sales Order harus dipilih'),
  customer_id: z.string().min(1, 'Customer harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  top: z.string().min(1, 'TOP harus diisi'),
  grn_customer_nomor: z.string().optional(),
  nomor_tanda_terima: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

interface SoJoin { nomor: string; di?: { nomor: string; nomor_di_customer: string } | null; delivery_order?: { nomor: string }[] | null }
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('invoice')
    .select('*, sales_order!sales_order_id(nomor, di!fk_sales_order_di(nomor, nomor_di_customer), delivery_order!fk_delivery_order_sales_order(nomor)), customer!customer_id(nama)')
    .order('created_at', { ascending: false })
  if (error) return internalError(error)
  const enriched = (data ?? []).map((item: Record<string, unknown>) => {
    const so = item.sales_order as SoJoin | null
    const di = so?.di
    const doArr = so?.delivery_order
    return {
      ...item,
      di_ref: di?.nomor ?? null,
      di_cust_ref: di?.nomor_di_customer ?? null,
      do_ref: doArr?.[0]?.nomor ?? null,
    }
  })
  return NextResponse.json({ data: enriched })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  let nomor: string
  if (parsed.data.sales_order_id) {
    const { data: parent } = await supabaseAdmin
      .from('sales_order')
      .select('nomor')
      .eq('id', parsed.data.sales_order_id)
      .maybeSingle()
    if (parent?.nomor) {
      nomor = formatChildNumber(parent.nomor, 'INV')
    } else {
      nomor = await generateGlobalDocumentNumber('INV')
    }
  } else {
    nomor = await generateGlobalDocumentNumber('INV')
  }
  const now = new Date().toISOString()

  const { data: inv, error: invError } = await supabaseAdmin.from('invoice').insert({
    nomor, sales_order_id: parsed.data.sales_order_id, customer_id: parsed.data.customer_id,
    tanggal: parsed.data.tanggal, top: parsed.data.top,
    status: 'draft',
    grn_customer_nomor: parsed.data.grn_customer_nomor ?? null,
    nomor_tanda_terima: parsed.data.nomor_tanda_terima ?? null,
    created_at: now, updated_at: now,
  }).select().single()
  if (invError) return internalError(invError)

  const items = parsed.data.items.map((item, idx) => {
    return {
      invoice_id: inv.id, barang_id: item.barang_id, harga: item.harga,
      jumlah: item.jumlah, diskon: item.diskon ?? 0,
      nama_barang: item.nama_barang ?? null,
      kode_barang: item.kode_barang ?? null,
      satuan: item.satuan ?? null,
      keterangan: item.keterangan ?? null,
      urutan: idx + 1,
      created_at: now, updated_at: now,
    }
  })
  const { error: itemsError } = await supabaseAdmin.from('invoice_item').insert(items)
  if (itemsError) { await supabaseAdmin.from('invoice').delete().eq('id', inv.id); return internalError(itemsError) }

  const nomorKwt = formatChildNumber(nomor, 'KWT')
  await supabaseAdmin.from('kwitansi').insert({
    nomor: nomorKwt,
    invoice_id: inv.id,
    tanggal: now,
    status: 'draft',
    created_at: now,
    updated_at: now,
  })

  const jurnalResult = await generateInvoiceJournal(inv.id)

  return NextResponse.json({ data: { ...inv, items, jurnal: jurnalResult.success ? jurnalResult.jurnal : null } }, { status: 201 })
}
