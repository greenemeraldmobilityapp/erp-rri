import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateDocumentNumber } from '@/lib/utils/document-number'

const itemSchema = z.object({
  invoice_item_id: z.string().min(1),
  harga: z.coerce.number().positive(),
  dpp: z.coerce.number().positive(),
  ppn: z.coerce.number().positive(),
  pph: z.coerce.number().optional(),
})

const schema = z.object({
  invoice_id: z.string().min(1, 'Invoice harus dipilih'),
  nomor_faktur: z.string().min(1, 'Nomor faktur harus diisi'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  dpp: z.coerce.number().positive(),
  ppn: z.coerce.number().positive(),
  pph: z.coerce.number().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('faktur_pajak').select('*, invoice!invoice_id(nomor)').order('created_at', { ascending: false })
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

  const nomor = await generateDocumentNumber('FP')
  const now = new Date().toISOString()

  const { data: fp, error: fpError } = await supabaseAdmin.from('faktur_pajak').insert({
    nomor, invoice_id: parsed.data.invoice_id, nomor_faktur: parsed.data.nomor_faktur,
    tanggal: parsed.data.tanggal, status: 'draft',
    dpp: parsed.data.dpp, ppn: parsed.data.ppn, pph: parsed.data.pph ?? null,
    created_at: now, updated_at: now,
  }).select().single()
  if (fpError) return internalError(fpError)

  const items = parsed.data.items.map(item => ({
    faktur_pajak_id: fp.id, invoice_item_id: item.invoice_item_id,
    harga: item.harga, dpp: item.dpp, ppn: item.ppn, pph: item.pph ?? null,
    created_at: now, updated_at: now,
  }))
  const { error: itemsError } = await supabaseAdmin.from('faktur_pajak_item').insert(items)
  if (itemsError) { await supabaseAdmin.from('faktur_pajak').delete().eq('id', fp.id); return internalError(itemsError) }

  return NextResponse.json({ data: { ...fp, items } }, { status: 201 })
}
