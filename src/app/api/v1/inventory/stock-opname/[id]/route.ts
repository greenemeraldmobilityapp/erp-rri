/**
 * @openapi
 * /api/v1/inventory/stock-opname/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Detail stock opname
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock opname detail
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   put:
 *     tags: [Inventory]
 *     summary: Update stock opname
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Stock opname updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     tags: [Inventory]
 *     summary: Hapus stock opname
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Stock opname deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { notFound, internalError } from '@/lib/api/errors'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data, error } = await supabaseAdmin.from('stock_opname').select('*, stock_opname_item(*)').eq('id', id).single()
  if (error) return internalError(error)
  if (!data) return notFound('Stock opname tidak ditemukan')
  return NextResponse.json({ data })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}
  if (body.petugas) updates.petugas = body.petugas
  if (body.status) updates.status = body.status
  if (body.keterangan !== undefined) updates.keterangan = body.keterangan
  if (body.gudangId) updates.gudang_id = body.gudangId

  const { data, error } = await supabaseAdmin.from('stock_opname').update(updates).eq('id', id).select().single()
  if (error) return internalError(error.message)
  if (!data) return notFound('Stock opname tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('stock_opname_item').delete().eq('stock_opname_id', id)
    if (body.items.length) {
      const { error: itemError } = await supabaseAdmin.from('stock_opname_item').insert(
        body.items.map((item: { barangId: string; stokFisik?: number; stokSistem?: number; selisih?: number; keterangan?: string }) => ({
          stock_opname_id: id,
          barang_id: item.barangId,
          stok_sistem: item.stokSistem ?? 0,
          stok_fisik: item.stokFisik ?? null,
          selisih: item.selisih ?? 0,
          keterangan: item.keterangan ?? null,
        }))
      )
      if (itemError) return internalError(itemError.message)
    }
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params

  await supabaseAdmin.from('stock_opname_item').delete().eq('stock_opname_id', id)
  const { error } = await supabaseAdmin.from('stock_opname').delete().eq('id', id)
  if (error) return internalError(error.message)
  return NextResponse.json({ success: true })
}
