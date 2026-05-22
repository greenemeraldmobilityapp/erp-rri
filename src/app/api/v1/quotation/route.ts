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
  diskon: z.coerce.number().nonnegative().optional(),
  keterangan: z.string().optional(),
})

const schema = z.object({
  customer_id: z.string().min(1, 'Customer harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  ppn_rate: z.coerce.number().nonnegative().default(0.11),
  keterangan: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Minimal 1 item'),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { data, error } = await supabaseAdmin
    .from('quotation')
    .select('*, customer!customer_id(id, nama, kode)')
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

  const nomor = await generateDocumentNumber('QTN')
  const now = new Date().toISOString()

  const { data: qtn, error: qtnError } = await supabaseAdmin
    .from('quotation')
    .insert({
      nomor,
      customer_id: parsed.data.customer_id,
      tanggal: parsed.data.tanggal,
      status: 'draft',
      ppn_rate: parsed.data.ppn_rate,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (qtnError) return internalError(qtnError)

  const items = parsed.data.items.map(item => ({
    quotation_id: qtn.id,
    barang_id: item.barang_id,
    jumlah: item.jumlah,
    harga_satuan: item.harga_satuan,
    diskon: item.diskon ?? 0,
    ppn_per_item: (item.harga_satuan * item.jumlah * parsed.data.ppn_rate) / (item.diskon ? 1 : 1),
    keterangan: item.keterangan ?? null,
    created_at: now,
    updated_at: now,
  }))

  const { error: itemsError } = await supabaseAdmin.from('quotation_item').insert(items)

  if (itemsError) {
    await supabaseAdmin.from('quotation').delete().eq('id', qtn.id)
    return internalError(itemsError)
  }

  return NextResponse.json({ data: { ...qtn, items } }, { status: 201 })
}
