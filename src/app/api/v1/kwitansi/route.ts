import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateDocumentNumber } from '@/lib/utils/document-number'

const itemSchema = z.object({
  invoice_item_id: z.string().min(1),
  jumlah: z.coerce.number().positive(),
})

const schema = z.object({
  invoice_id: z.string().min(1, 'Invoice harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  keterangan: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { searchParams } = new URL(request.url)
  const invoiceId = searchParams.get('invoice_id')
  let query = supabaseAdmin.from('kwitansi').select('*, invoice!invoice_id(nomor)')
  if (invoiceId) query = query.eq('invoice_id', invoiceId)
  query = query.order('created_at', { ascending: false })
  const { data, error } = await query
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

  const nomor = await generateDocumentNumber('KWT')
  const now = new Date().toISOString()

  const { data: kwt, error: kwtError } = await supabaseAdmin.from('kwitansi').insert({
    nomor, invoice_id: parsed.data.invoice_id, tanggal: parsed.data.tanggal,
    status: 'draft', keterangan: parsed.data.keterangan ?? null,
    created_at: now, updated_at: now,
  }).select().single()
  if (kwtError) return internalError(kwtError)

  const items = parsed.data.items.map(item => ({
    kwitansi_id: kwt.id, invoice_item_id: item.invoice_item_id, jumlah: item.jumlah,
    created_at: now, updated_at: now,
  }))
  const { error: itemsError } = await supabaseAdmin.from('kwitansi_item').insert(items)
  if (itemsError) { await supabaseAdmin.from('kwitansi').delete().eq('id', kwt.id); return internalError(itemsError) }

  return NextResponse.json({ data: { ...kwt, items } }, { status: 201 })
}
