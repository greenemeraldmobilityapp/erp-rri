/**
 * @openapi
 * /api/v1/retur-penjualan/{id}:
 *   get:
 *     tags: [Retur]
 *     summary: Detail retur penjualan
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
 *         description: Retur penjualan detail
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   put:
 *     tags: [Retur]
 *     summary: Update retur penjualan
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Retur penjualan updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     tags: [Retur]
 *     summary: Hapus retur penjualan
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Retur penjualan deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: retur, error } = await supabaseAdmin.from('retur_penjualan').select('*, customer!customer_id(nama, kode)').eq('id', id).single()
  if (error) return internalError(error)
  if (!retur) return notFound('Retur tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('retur_penjualan_item').select('*, barang!barang_id(nama, kode)').eq('retur_penjualan_id', id)
  return NextResponse.json({ data: { ...retur, items: items ?? [] } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const upd: Record<string, unknown> = {}
  if (body.status) upd.status = body.status; if (body.keterangan !== undefined) upd.keterangan = body.keterangan
  upd.updated_at = new Date().toISOString()
  const { data, error } = await supabaseAdmin.from('retur_penjualan').update(upd).eq('id', id).select().single()
  if (error) return internalError(error); if (!data) return notFound('Retur tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('retur_penjualan_item').delete().eq('retur_penjualan_id', id)
    const now = new Date().toISOString()
    const items = body.items.map((i: { barang_id: string; jumlah: number; keterangan?: string }) => ({
      retur_penjualan_id: id, barang_id: i.barang_id, jumlah: i.jumlah, keterangan: i.keterangan ?? null, created_at: now, updated_at: now,
    }))
    const { error: ie } = await supabaseAdmin.from('retur_penjualan_item').insert(items)
    if (ie) return internalError(ie)
  }
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('retur_penjualan_item').delete().eq('retur_penjualan_id', id)
  const { error } = await supabaseAdmin.from('retur_penjualan').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
