import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateDocumentNumber } from '@/lib/utils/document-number'

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
  ppn_rate: z.coerce.number().optional().default(0.11),
  pph_rate: z.coerce.number().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('invoice').select('*, sales_order!sales_order_id(nomor), customer!customer_id(nama)').order('created_at', { ascending: false })
  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const nomor = await generateDocumentNumber('INV')
  const now = new Date().toISOString()

  const { data: inv, error: invError } = await supabaseAdmin.from('invoice').insert({
    nomor, sales_order_id: parsed.data.sales_order_id, customer_id: parsed.data.customer_id,
    tanggal: parsed.data.tanggal, top: parsed.data.top, ppn_rate: parsed.data.ppn_rate,
    pph_rate: parsed.data.pph_rate ?? null, status: 'draft',
    created_at: now, updated_at: now,
  }).select().single()
  if (invError) return internalError(invError)

  const items = parsed.data.items.map(item => ({
    invoice_id: inv.id, barang_id: item.barang_id, harga: item.harga,
    jumlah: item.jumlah, diskon: item.diskon ?? 0, ppn: item.ppn ?? null,
    pph: item.pph ?? null, keterangan: item.keterangan ?? null,
    created_at: now, updated_at: now,
  }))
  const { error: itemsError } = await supabaseAdmin.from('invoice_item').insert(items)
  if (itemsError) { await supabaseAdmin.from('invoice').delete().eq('id', inv.id); return internalError(itemsError) }

  return NextResponse.json({ data: { ...inv, items } }, { status: 201 })
}
