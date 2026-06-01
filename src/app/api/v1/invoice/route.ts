import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateDocumentNumber } from '@/lib/utils/document-number'
import { generateInvoiceJournal } from '@/lib/auto-jurnal'
import { getConfigNumber } from '@/lib/utils/config'

const itemSchema = z.object({
  barang_id: z.string().min(1),
  harga: z.coerce.number().positive(),
  jumlah: z.coerce.number().int().positive(),
  diskon: z.coerce.number().optional(),
  ppn: z.coerce.number().optional(),
  pph: z.coerce.number().optional(),
  keterangan: z.string().optional(),
})

const schema = z.object({
  sales_order_id: z.string().min(1, 'Sales Order harus dipilih'),
  customer_id: z.string().min(1, 'Customer harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  top: z.string().min(1, 'TOP harus diisi'),
  ppn_rate: z.coerce.number().optional(),
  pph_rate: z.coerce.number().optional(),
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

  const ppnRate = parsed.data.ppn_rate ?? await getConfigNumber('ppn_rate', 0.11)
  const nomor = await generateDocumentNumber('INV')
  const now = new Date().toISOString()

  const { data: inv, error: invError } = await supabaseAdmin.from('invoice').insert({
    nomor, sales_order_id: parsed.data.sales_order_id, customer_id: parsed.data.customer_id,
    tanggal: parsed.data.tanggal, top: parsed.data.top, ppn_rate: ppnRate,
    pph_rate: parsed.data.pph_rate ?? null, status: 'draft',
    created_at: now, updated_at: now,
  }).select().single()
  if (invError) return internalError(invError)

  const items = parsed.data.items.map(item => {
    const subtotal = item.harga * item.jumlah - (item.diskon ?? 0)
    return {
      invoice_id: inv.id, barang_id: item.barang_id, harga: item.harga,
      jumlah: item.jumlah, diskon: item.diskon ?? 0,
      ppn: item.ppn ?? subtotal * ppnRate,
      pph: item.pph ?? (parsed.data.pph_rate ? subtotal * parsed.data.pph_rate : null),
      keterangan: item.keterangan ?? null,
      created_at: now, updated_at: now,
    }
  })
  const { error: itemsError } = await supabaseAdmin.from('invoice_item').insert(items)
  if (itemsError) { await supabaseAdmin.from('invoice').delete().eq('id', inv.id); return internalError(itemsError) }

  const jurnalResult = await generateInvoiceJournal(inv.id)

  return NextResponse.json({ data: { ...inv, items, jurnal: jurnalResult.success ? jurnalResult.jurnal : null } }, { status: 201 })
}
