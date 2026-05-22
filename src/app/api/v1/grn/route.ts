import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateDocumentNumber } from '@/lib/utils/document-number'

const itemSchema = z.object({ barang_id: z.string().min(1), jumlah: z.coerce.number().int().positive(), keterangan: z.string().optional() })
const schema = z.object({ purchase_receiving_id: z.string().optional(), di_id: z.string().optional(), tanggal: z.string().min(1), keterangan: z.string().optional(), items: z.array(itemSchema).min(1) })

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('grn').select('*, purchase_receiving!purchase_receiving_id(nomor)').order('created_at', { ascending: false })
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

  const nomor = await generateDocumentNumber('GRN')
  const now = new Date().toISOString()

  const { data: grn, error: grnError } = await supabaseAdmin.from('grn').insert({
    nomor, purchase_receiving_id: parsed.data.purchase_receiving_id ?? null, di_id: parsed.data.di_id ?? null,
    tanggal: parsed.data.tanggal, status: 'draft', keterangan: parsed.data.keterangan ?? null, created_at: now, updated_at: now,
  }).select().single()
  if (grnError) return internalError(grnError)

  const items = parsed.data.items.map(i => ({
    grn_id: grn.id, barang_id: i.barang_id, jumlah: i.jumlah, keterangan: i.keterangan ?? null, created_at: now, updated_at: now,
  }))
  const { error: ie } = await supabaseAdmin.from('grn_item').insert(items)
  if (ie) { await supabaseAdmin.from('grn').delete().eq('id', grn.id); return internalError(ie) }

  return NextResponse.json({ data: { ...grn, items } }, { status: 201 })
}
