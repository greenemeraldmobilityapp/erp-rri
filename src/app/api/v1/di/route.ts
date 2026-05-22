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
  customer_id: z.string().min(1),
  kontrak_id: z.string().optional(),
  tanggal: z.string().min(1),
  keterangan: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('di').select('*, customer!customer_id(nama, kode)').order('created_at', { ascending: false })
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

  const nomor = await generateDocumentNumber('DI')
  const now = new Date().toISOString()

  const { data: di, error: diError } = await supabaseAdmin.from('di').insert({
    nomor, customer_id: parsed.data.customer_id, kontrak_id: parsed.data.kontrak_id ?? null,
    tanggal: parsed.data.tanggal, status: 'draft', keterangan: parsed.data.keterangan ?? null,
    created_at: now, updated_at: now,
  }).select().single()
  if (diError) return internalError(diError)

  const items = parsed.data.items.map(item => ({
    di_id: di.id, barang_id: item.barang_id, jumlah: item.jumlah,
    keterangan: item.keterangan ?? null, created_at: now, updated_at: now,
  }))
  const { error: itemsError } = await supabaseAdmin.from('di_item').insert(items)
  if (itemsError) { await supabaseAdmin.from('di').delete().eq('id', di.id); return internalError(itemsError) }

  return NextResponse.json({ data: { ...di, items } }, { status: 201 })
}
