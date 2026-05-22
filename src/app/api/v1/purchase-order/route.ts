import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateDocumentNumber } from '@/lib/utils/document-number'

const itemSchema = z.object({
  barang_id: z.string().min(1), jumlah: z.coerce.number().int().positive(),
  harga_satuan: z.coerce.number().nonnegative(), link_produk: z.string().optional(),
  nama_toko: z.string().optional(), marketplace: z.string().optional(), no_resi: z.string().optional(),
})
const schema = z.object({
  supplier_id: z.string().min(1), purchase_request_id: z.string().optional(),
  tanggal: z.string().min(1), terms_of_payment: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('purchase_order').select('*, supplier!supplier_id(nama, kode)').order('created_at', { ascending: false })
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

  const nomor = await generateDocumentNumber('PO')
  const now = new Date().toISOString()

  const { data: po, error: poError } = await supabaseAdmin.from('purchase_order').insert({
    nomor, supplier_id: parsed.data.supplier_id, purchase_request_id: parsed.data.purchase_request_id ?? null,
    tanggal: parsed.data.tanggal, status: 'draft', terms_of_payment: parsed.data.terms_of_payment ?? null,
    created_at: now, updated_at: now,
  }).select().single()
  if (poError) return internalError(poError)

  const items = parsed.data.items.map(i => ({
    purchase_order_id: po.id, barang_id: i.barang_id, jumlah: i.jumlah, harga_satuan: i.harga_satuan,
    link_produk: i.link_produk ?? null, nama_toko: i.nama_toko ?? null, marketplace: i.marketplace ?? null,
    no_resi: i.no_resi ?? null, created_at: now, updated_at: now,
  }))
  const { error: ie } = await supabaseAdmin.from('purchase_order_item').insert(items)
  if (ie) { await supabaseAdmin.from('purchase_order').delete().eq('id', po.id); return internalError(ie) }

  return NextResponse.json({ data: { ...po, items } }, { status: 201 })
}
