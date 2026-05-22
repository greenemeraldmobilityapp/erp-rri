import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateDocumentNumber } from '@/lib/utils/document-number'

const itemSchema = z.object({
  quotation_item_id: z.string().min(1),
  harga_satuan_baru: z.coerce.number().nonnegative(),
  diskon_baru: z.coerce.number().nonnegative().optional(),
  alasan: z.string().optional(),
})

const schema = z.object({
  quotation_id: z.string().min(1, 'Quotation harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  keterangan: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { data, error } = await supabaseAdmin
    .from('negoiasi')
    .select('*, quotation!quotation_id(nomor)')
    .order('created_at', { ascending: false })

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

  const nomor = await generateDocumentNumber('NEG')
  const now = new Date().toISOString()

  const { data: neg, error: negError } = await supabaseAdmin
    .from('negoiasi')
    .insert({ nomor, quotation_id: parsed.data.quotation_id, tanggal: parsed.data.tanggal, status: 'draft', keterangan: parsed.data.keterangan ?? null, created_at: now, updated_at: now })
    .select().single()

  if (negError) return internalError(negError)

  const items = parsed.data.items.map(item => ({
    negoiasi_id: neg.id,
    quotation_item_id: item.quotation_item_id,
    harga_satuan_baru: item.harga_satuan_baru,
    diskon_baru: item.diskon_baru ?? 0,
    alasan: item.alasan ?? null,
    created_at: now, updated_at: now,
  }))

  const { error: itemsError } = await supabaseAdmin.from('negoiasi_item').insert(items)
  if (itemsError) { await supabaseAdmin.from('negoiasi').delete().eq('id', neg.id); return internalError(itemsError) }

  return NextResponse.json({ data: { ...neg, items } }, { status: 201 })
}
