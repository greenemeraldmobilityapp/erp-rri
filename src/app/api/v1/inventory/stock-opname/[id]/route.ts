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
import { z } from 'zod'
import { verifyAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

const updateItemSchema = z.object({
  barangId: z.string().min(1),
  stokSistem: z.coerce.number().int().default(0),
  stokFisik: z.coerce.number().int().optional(),
  selisih: z.coerce.number().int().default(0),
  keterangan: z.string().optional(),
})

const updateSchema = z.object({
  petugas: z.string().min(1).optional(),
  status: z.string().optional(),
  keterangan: z.string().optional(),
  gudangId: z.string().optional(),
  items: z.array(updateItemSchema).optional(),
})

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
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const updates: Record<string, unknown> = {}
  if (parsed.data.petugas) updates.petugas = parsed.data.petugas
  if (parsed.data.status) updates.status = parsed.data.status
  if (parsed.data.keterangan !== undefined) updates.keterangan = parsed.data.keterangan
  if (parsed.data.gudangId) updates.gudang_id = parsed.data.gudangId

  const { data, error } = await supabaseAdmin.from('stock_opname').update(updates).eq('id', id).select().single()
  if (error) return internalError(error.message)
  if (!data) return notFound('Stock opname tidak ditemukan')

  if (parsed.data.items) {
    await supabaseAdmin.from('stock_opname_item').delete().eq('stock_opname_id', id)
    if (parsed.data.items.length) {
      const { error: itemError } = await supabaseAdmin.from('stock_opname_item').insert(
        parsed.data.items.map((item) => ({
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
