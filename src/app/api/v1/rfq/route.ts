import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateDocumentNumber } from '@/lib/utils/document-number'

const rfqItemSchema = z.object({
  barang_id: z.string().min(1),
  jumlah: z.coerce.number().int().positive(),
  satuan: z.string().optional(),
  harga_target: z.coerce.number().nonnegative().optional(),
  keterangan: z.string().optional(),
})

const schema = z.object({
  supplier_id: z.string().min(1, 'Supplier harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  keterangan: z.string().optional(),
  items: z.array(rfqItemSchema).min(1, 'Minimal 1 item'),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { data, error } = await supabaseAdmin
    .from('rfq')
    .select('*, supplier!supplier_id(id, nama, kode)')
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

  const nomor = await generateDocumentNumber('RFQ')
  const now = new Date().toISOString()

  const { data: rfq, error: rfqError } = await supabaseAdmin
    .from('rfq')
    .insert({
      nomor,
      supplier_id: parsed.data.supplier_id,
      tanggal: parsed.data.tanggal,
      keterangan: parsed.data.keterangan ?? null,
      status: 'draft',
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (rfqError) return internalError(rfqError)

  const items = parsed.data.items.map(item => ({
    rfq_id: rfq.id,
    barang_id: item.barang_id,
    jumlah: item.jumlah,
    satuan: item.satuan ?? null,
    harga_target: item.harga_target ?? null,
    keterangan: item.keterangan ?? null,
    created_at: now,
    updated_at: now,
  }))

  const { error: itemsError } = await supabaseAdmin.from('rfq_item').insert(items)

  if (itemsError) {
    await supabaseAdmin.from('rfq').delete().eq('id', rfq.id)
    return internalError(itemsError)
  }

  return NextResponse.json({ data: { ...rfq, items } }, { status: 201 })
}
