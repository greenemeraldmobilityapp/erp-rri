/**
 * @openapi
 * /api/v1/master/gudang/{id}:
 *   get:
 *     tags: [Master]
 *     summary: Detail gudang
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
 *         description: Gudang detail
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   put:
 *     tags: [Master]
 *     summary: Update gudang
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Gudang updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     tags: [Master]
 *     summary: Hapus gudang
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Gudang deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

const updateSchema = z.object({
  nama: z.string().min(1, 'Nama gudang harus diisi').optional(),
  lokasi: z.string().optional(),
  keterangan: z.string().optional(),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('gudang').select('*').eq('id', id).single()
  if (error) return internalError(error)
  if (!data) return notFound('Gudang tidak ditemukan')
  return NextResponse.json({ data })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))
  const { data, error } = await supabaseAdmin.from('gudang').update(parsed.data).eq('id', id).select().single()
  if (error) return internalError(error)
  if (!data) return notFound()
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const { error } = await supabaseAdmin.from('gudang').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
