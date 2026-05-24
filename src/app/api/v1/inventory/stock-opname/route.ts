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
import { verifyAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { badRequest, internalError } from '@/lib/api/errors'

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
  if (!body.nomor || !body.petugas) return badRequest('Nomor dan petugas wajib diisi')

  const { data, error } = await supabaseAdmin.from('stock_opname').insert({
    nomor: body.nomor,
    gudang_id: body.gudangId ?? null,
    petugas: body.petugas,
    status: 'draft',
    keterangan: body.keterangan ?? null,
  }).select().single()
  if (error) return internalError(error.message)

  if (body.items?.length) {
    const { error: itemError } = await supabaseAdmin.from('stock_opname_item').insert(
      body.items.map((item: { barangId: string; stokSistem: number; keterangan?: string }) => ({
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
