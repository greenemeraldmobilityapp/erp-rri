import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateDocumentNumber } from '@/lib/utils/document-number'

const itemSchema = z.object({
  barang_id: z.string().min(1),
  jumlah: z.coerce.number().int().positive(),
  keterangan: z.string().optional(),
})

const schema = z.object({
  sales_order_id: z.string().min(1, 'Sales Order harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  keterangan: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('delivery_order').select('*, sales_order!sales_order_id(nomor)').order('created_at', { ascending: false })
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

  const nomor = await generateDocumentNumber('SJ')
  const now = new Date().toISOString()

  const { data: sj, error: sjError } = await supabaseAdmin.from('delivery_order').insert({
    nomor, sales_order_id: parsed.data.sales_order_id, tanggal: parsed.data.tanggal,
    status: 'draft', keterangan: parsed.data.keterangan ?? null, created_at: now, updated_at: now,
  }).select().single()
  if (sjError) return internalError(sjError)

  const items = parsed.data.items.map(item => ({
    delivery_order_id: sj.id, barang_id: item.barang_id, jumlah: item.jumlah,
    keterangan: item.keterangan ?? null, created_at: now, updated_at: now,
  }))
  const { error: itemsError } = await supabaseAdmin.from('delivery_order_item').insert(items)
  if (itemsError) { await supabaseAdmin.from('delivery_order').delete().eq('id', sj.id); return internalError(itemsError) }

  return NextResponse.json({ data: { ...sj, items } }, { status: 201 })
}
