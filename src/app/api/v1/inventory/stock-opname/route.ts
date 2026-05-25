/**
 * @openapi
 * /api/v1/inventory/stock-opname:
 *   get:
 *     tags: [Inventory]
 *     summary: Daftar stock opname
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar stock opname
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Inventory]
 *     summary: Buat stock opname baru
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Stock opname created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { badRequest, internalError } from '@/lib/api/errors'

const stockOpnameItemSchema = z.object({
  barangId: z.string().min(1),
  stokSistem: z.coerce.number().int().default(0),
  keterangan: z.string().optional(),
})

const createSchema = z.object({
  nomor: z.string().min(1, 'Nomor wajib diisi'),
  petugas: z.string().min(1, 'Petugas wajib diisi'),
  gudangId: z.string().optional(),
  keterangan: z.string().optional(),
  items: z.array(stockOpnameItemSchema).optional(),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  let query = supabaseAdmin.from('stock_opname').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return internalError(error.message)
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const { data, error } = await supabaseAdmin.from('stock_opname').insert({
    nomor: parsed.data.nomor,
    gudang_id: parsed.data.gudangId ?? null,
    petugas: parsed.data.petugas,
    status: 'draft',
    keterangan: parsed.data.keterangan ?? null,
  }).select().single()
  if (error) return internalError(error.message)

  if (parsed.data.items?.length) {
    const { error: itemError } = await supabaseAdmin.from('stock_opname_item').insert(
      parsed.data.items.map((item) => ({
        stock_opname_id: data.id,
        barang_id: item.barangId,
        stok_sistem: item.stokSistem ?? 0,
        stok_fisik: null,
        selisih: 0,
        keterangan: item.keterangan ?? null,
      }))
    )
    if (itemError) return internalError(itemError.message)
  }

  return NextResponse.json({ data })
}
