import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateGlobalDocumentNumber } from '@/lib/utils/document-number'

const itemSchema = z.object({ barang_id: z.string().min(1), jumlah: z.coerce.number().int().positive(), nama_barang: z.string().optional(), kode_barang: z.string().optional(), satuan: z.string().optional(), urutan: z.number().int().optional(), keterangan: z.string().optional() })
const schema = z.object({ retur_penjualan_id: z.string().optional(), delivery_order_id: z.string().optional(), customer_id: z.string().optional(), gudang_id: z.string().optional(), tanggal: z.string().min(1), keterangan: z.string().optional(), items: z.array(itemSchema).min(1) })

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('grn_customer').select('*, customer!customer_id(nama, kode), gudang!gudang_id(nama), delivery_order!delivery_order_id(nomor)').order('created_at', { ascending: false })
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

  const nomor = await generateGlobalDocumentNumber('GRNC')
  const now = new Date().toISOString()

  const { data: grn, error: grnError } = await supabaseAdmin.from('grn_customer').insert({
    nomor, retur_penjualan_id: parsed.data.retur_penjualan_id ?? null, delivery_order_id: parsed.data.delivery_order_id ?? null,
    customer_id: parsed.data.customer_id ?? null,
    gudang_id: parsed.data.gudang_id ?? null, tanggal: parsed.data.tanggal, status: 'draft', keterangan: parsed.data.keterangan ?? null, created_at: now, updated_at: now,
  }).select().single()
  if (grnError) return internalError(grnError)

  const items = parsed.data.items.map((i, idx) => ({
    grn_customer_id: grn.id, barang_id: i.barang_id, jumlah: i.jumlah,
    nama_barang: i.nama_barang ?? null, kode_barang: i.kode_barang ?? null, satuan: i.satuan ?? null,
    urutan: i.urutan ?? idx + 1, keterangan: i.keterangan ?? null, created_at: now, updated_at: now,
  }))
  const { error: ie } = await supabaseAdmin.from('grn_customer_item').insert(items)
  if (ie) { await supabaseAdmin.from('grn_customer').delete().eq('id', grn.id); return internalError(ie) }

  return NextResponse.json({ data: { ...grn, items } }, { status: 201 })
}
