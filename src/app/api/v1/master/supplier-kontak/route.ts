/**
 * @openapi
 * /api/v1/master/supplier-kontak:
 *   get:
 *     tags: [Master]
 *     summary: Daftar kontak supplier
 *     parameters:
 *       - in: query
 *         name: supplier_id
 *         schema:
 *           type: string
 *         description: Filter by supplier ID
 *     responses:
 *       200:
 *         description: Daftar kontak supplier
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Master]
 *     summary: Tambah kontak supplier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supplier_id, nama]
 *             properties:
 *               supplier_id:
 *                 type: string
 *               nama:
 *                 type: string
 *               jabatan:
 *                 type: string
 *               no_hp:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Kontak supplier created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'

const createSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier harus dipilih'),
  nama: z.string().min(1, 'Nama kontak harus diisi'),
  jabatan: z.string().optional(),
  no_hp: z.string().optional(),
  email: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const supplierId = searchParams.get('supplier_id')

  let query = supabaseAdmin.from('supplier_kontak').select('*, supplier!supplier_id(nama, kode)').order('created_at', { ascending: false })
  if (supplierId) query = query.eq('supplier_id', supplierId)
  const { data, error } = await query
  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const id = crypto.randomUUID()
  const { data, error } = await supabaseAdmin.from('supplier_kontak').insert({
    id,
    supplier_id: parsed.data.supplier_id,
    nama: parsed.data.nama,
    jabatan: parsed.data.jabatan ?? null,
    no_hp: parsed.data.no_hp ?? null,
    email: parsed.data.email ?? null,
  }).select('*, supplier!supplier_id(nama, kode)').single()
  if (error) return internalError(error)
  return NextResponse.json({ data }, { status: 201 })
}
