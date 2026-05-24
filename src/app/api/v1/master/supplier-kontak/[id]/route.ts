/**
 * @openapi
 * /api/v1/master/supplier-kontak/{id}:
 *   get:
 *     tags: [Master]
 *     summary: Detail kontak supplier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kontak supplier detail
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   put:
 *     tags: [Master]
 *     summary: Update kontak supplier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama:
 *                 type: string
 *               jabatan:
 *                 type: string
 *               no_hp:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kontak supplier updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     tags: [Master]
 *     summary: Hapus kontak supplier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kontak supplier deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

const updateSchema = z.object({
  nama: z.string().min(1, 'Nama kontak harus diisi').optional(),
  jabatan: z.string().optional(),
  no_hp: z.string().optional(),
  email: z.string().optional(),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('supplier_kontak').select('*, supplier!supplier_id(nama, kode)').eq('id', id).single()
  if (error) return internalError(error)
  if (!data) return notFound('Kontak tidak ditemukan')
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
  const { data, error } = await supabaseAdmin.from('supplier_kontak').update({
    ...parsed.data,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select('*, supplier!supplier_id(nama, kode)').single()
  if (error) return internalError(error)
  if (!data) return notFound('Kontak tidak ditemukan')
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const { error } = await supabaseAdmin.from('supplier_kontak').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
