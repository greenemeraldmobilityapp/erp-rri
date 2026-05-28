import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateDocumentNumber } from '@/lib/utils/document-number'

const itemSchema = z.object({
  barang_id: z.string().min(1),
  jumlah: z.coerce.number().int().positive(),
  harga_satuan: z.coerce.number().nonnegative(),
  keterangan: z.string().optional(),
})

const schema = z.object({
  customer_id: z.string().min(1),
  quotation_id: z.string().optional(),
  tanggal: z.string().min(1),
  nomor_po_customer: z.string().optional(),
  terms_of_payment: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('customer_po').select('*, customer!customer_id(nama, kode)').order('created_at', { ascending: false })
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

  const nomor = await generateDocumentNumber('CPO')
  const now = new Date().toISOString()

  const { data: po, error: poError } = await supabaseAdmin.from('customer_po').insert({
    nomor, customer_id: parsed.data.customer_id, quotation_id: parsed.data.quotation_id ?? null,
    tanggal: parsed.data.tanggal, status: 'draft', nomor_po_customer: parsed.data.nomor_po_customer ?? null,
    terms_of_payment: parsed.data.terms_of_payment ?? null, created_at: now, updated_at: now,
  }).select().single()
  if (poError) return internalError(poError)

  const items = parsed.data.items.map(item => ({
    customer_po_id: po.id, barang_id: item.barang_id, jumlah: item.jumlah,
    harga_satuan: item.harga_satuan, keterangan: item.keterangan ?? null, created_at: now, updated_at: now,
  }))
  const { error: itemsError } = await supabaseAdmin.from('customer_po_item').insert(items)
  if (itemsError) { await supabaseAdmin.from('customer_po').delete().eq('id', po.id); return internalError(itemsError) }

  return NextResponse.json({ data: { ...po, items } }, { status: 201 })
}
