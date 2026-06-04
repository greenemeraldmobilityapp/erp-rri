import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateGlobalDocumentNumber, formatChildNumber } from '@/lib/utils/document-number'

const itemSchema = z.object({
  barang_id: z.string().min(1),
  jumlah: z.coerce.number().int().positive(),
  harga_satuan: z.coerce.number().nonnegative(),
  keterangan: z.string().optional(),
})

const schema = z.object({
  customer_po_id: z.string().optional(),
  di_id: z.string().optional(),
  tanggal: z.string().min(1),
  items: z.array(itemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('sales_order').select('*, customer_po!customer_po_id(nomor)').order('created_at', { ascending: false })
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

  let nomor: string
  if (parsed.data.customer_po_id) {
    const { data: parent } = await supabaseAdmin
      .from('customer_po')
      .select('nomor')
      .eq('id', parsed.data.customer_po_id)
      .maybeSingle()
    if (parent?.nomor) {
      nomor = formatChildNumber(parent.nomor, 'SO')
    } else {
      nomor = await generateGlobalDocumentNumber('SO')
    }
  } else if (parsed.data.di_id) {
    const { data: parent } = await supabaseAdmin
      .from('di')
      .select('nomor')
      .eq('id', parsed.data.di_id)
      .maybeSingle()
    if (parent?.nomor) {
      nomor = formatChildNumber(parent.nomor, 'SO')
    } else {
      nomor = await generateGlobalDocumentNumber('SO')
    }
  } else {
    nomor = await generateGlobalDocumentNumber('SO')
  }
  const now = new Date().toISOString()

  const { data: so, error: soError } = await supabaseAdmin.from('sales_order').insert({
    nomor, customer_po_id: parsed.data.customer_po_id ?? null, di_id: parsed.data.di_id ?? null,
    tanggal: parsed.data.tanggal, status: 'draft', created_at: now, updated_at: now,
  }).select().single()
  if (soError) return internalError(soError)

  const items = parsed.data.items.map(item => ({
    sales_order_id: so.id, barang_id: item.barang_id, jumlah: item.jumlah,
    harga_satuan: item.harga_satuan, keterangan: item.keterangan ?? null, created_at: now, updated_at: now,
  }))
  const { error: itemsError } = await supabaseAdmin.from('sales_order_item').insert(items)
  if (itemsError) { await supabaseAdmin.from('sales_order').delete().eq('id', so.id); return internalError(itemsError) }

  return NextResponse.json({ data: { ...so, items } }, { status: 201 })
}
