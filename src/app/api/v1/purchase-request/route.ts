import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateDocumentNumber } from '@/lib/utils/document-number'

const itemSchema = z.object({ barang_id: z.string().min(1), jumlah: z.coerce.number().int().positive(), keterangan: z.string().optional() })
const schema = z.object({ sales_order_id: z.string().optional(), tanggal: z.string().min(1), keterangan: z.string().optional(), items: z.array(itemSchema).min(1) })

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('purchase_request').select('*, sales_order!sales_order_id(nomor)').order('created_at', { ascending: false })
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

  const nomor = await generateDocumentNumber('PR')
  const now = new Date().toISOString()

  const { data: pr, error: prError } = await supabaseAdmin.from('purchase_request').insert({
    nomor, sales_order_id: parsed.data.sales_order_id ?? null, tanggal: parsed.data.tanggal,
    status: 'draft', keterangan: parsed.data.keterangan ?? null, created_at: now, updated_at: now,
  }).select().single()
  if (prError) return internalError(prError)

  const items = parsed.data.items.map(i => ({
    purchase_request_id: pr.id, barang_id: i.barang_id, jumlah: i.jumlah,
    keterangan: i.keterangan ?? null, created_at: now, updated_at: now,
  }))
  const { error: itemsError } = await supabaseAdmin.from('purchase_request_item').insert(items)
  if (itemsError) { await supabaseAdmin.from('purchase_request').delete().eq('id', pr.id); return internalError(itemsError) }

  return NextResponse.json({ data: { ...pr, items } }, { status: 201 })
}
