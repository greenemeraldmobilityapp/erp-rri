import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateDocumentNumber } from '@/lib/utils/document-number'

const itemSchema = z.object({
  akun_id: z.string().min(1, 'Akun harus dipilih'),
  debit: z.coerce.number().min(0),
  credit: z.coerce.number().min(0),
  keterangan: z.string().optional(),
})

const schema = z.object({
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  keterangan: z.string().optional(),
  items: z.array(itemSchema).min(2, 'Minimal 2 item (debit & credit)'),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('jurnal').select('*').order('created_at', { ascending: false })
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

  const nomor = await generateDocumentNumber('JRN')
  const now = new Date().toISOString()

  const { data: jurnal, error: jError } = await supabaseAdmin.from('jurnal').insert({
    nomor, tanggal: parsed.data.tanggal, status: 'draft',
    keterangan: parsed.data.keterangan ?? null,
    created_at: now, updated_at: now,
  }).select().single()
  if (jError) return internalError(jError)

  const items = parsed.data.items.map(item => ({
    jurnal_id: jurnal.id, akun_id: item.akun_id,
    debit: item.debit, credit: item.credit,
    keterangan: item.keterangan ?? null,
    created_at: now, updated_at: now,
  }))
  const { error: itemsError } = await supabaseAdmin.from('jurnal_item').insert(items)
  if (itemsError) { await supabaseAdmin.from('jurnal').delete().eq('id', jurnal.id); return internalError(itemsError) }

  return NextResponse.json({ data: { ...jurnal, items } }, { status: 201 })
}
