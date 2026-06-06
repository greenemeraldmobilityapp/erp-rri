/**
 * @openapi
 * /api/v1/retur-penjualan:
 *   get:
 *     tags: [Retur]
 *     summary: Daftar retur penjualan
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar retur penjualan
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Retur]
 *     summary: Tambah retur penjualan baru
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Retur penjualan created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateGlobalDocumentNumber, formatChildNumber } from '@/lib/utils/document-number'
import { generateReturPenjualanJournal } from '@/lib/auto-jurnal'

const itemSchema = z.object({ barang_id: z.string().min(1), jumlah: z.coerce.number().int().positive(), nama_barang: z.string().optional(), kode_barang: z.string().optional(), satuan: z.string().optional(), keterangan: z.string().optional() })
const schema = z.object({ customer_id: z.string().min(1), delivery_order_id: z.string().optional(), tanggal: z.string().min(1), keterangan: z.string().optional(), items: z.array(itemSchema).min(1) })


export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('retur_penjualan').select('*, customer!customer_id(nama, kode), delivery_order!delivery_order_id(nomor)').order('created_at', { ascending: false })
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
  if (parsed.data.delivery_order_id) {
    const { data: parent } = await supabaseAdmin
      .from('delivery_order')
      .select('nomor')
      .eq('id', parsed.data.delivery_order_id)
      .maybeSingle()
    if (parent?.nomor) {
      nomor = formatChildNumber(parent.nomor, 'RTJ')
    } else {
      nomor = await generateGlobalDocumentNumber('RTJ')
    }
  } else {
    nomor = await generateGlobalDocumentNumber('RTJ')
  }
  const now = new Date().toISOString()

  const { data: retur, error: returError } = await supabaseAdmin.from('retur_penjualan').insert({
    nomor, customer_id: parsed.data.customer_id, delivery_order_id: parsed.data.delivery_order_id ?? null,
    tanggal: parsed.data.tanggal, status: 'draft', keterangan: parsed.data.keterangan ?? null, created_at: now, updated_at: now,
  }).select().single()
  if (returError) return internalError(returError)

  const barangIds = [...new Set(parsed.data.items.map(i => i.barang_id))]
  const { data: barangList } = await supabaseAdmin.from('barang').select('id, nama, kode, satuan').in('id', barangIds)
  const barangMap = new Map((barangList ?? []).map(b => [b.id, b]))

  const items = parsed.data.items.map(i => {
    const b = barangMap.get(i.barang_id)
    return {
      retur_penjualan_id: retur.id, barang_id: i.barang_id, jumlah: i.jumlah,
      nama_barang: i.nama_barang || (b?.nama ?? null),
      kode_barang: i.kode_barang || (b?.kode ?? null),
      satuan: i.satuan || (b?.satuan ?? null),
      keterangan: i.keterangan ?? null, created_at: now, updated_at: now,
    }
  })
  const { error: ie } = await supabaseAdmin.from('retur_penjualan_item').insert(items)
  if (ie) { await supabaseAdmin.from('retur_penjualan').delete().eq('id', retur.id); return internalError(ie) }

  await generateReturPenjualanJournal(retur.id)

  return NextResponse.json({ data: { ...retur, items } }, { status: 201 })
}
