/**
 * @openapi
 * /api/v1/master/customer-top/{id}:
 *   get:
 *     tags: [Master]
 *     summary: Detail customer TOP
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer TOP detail
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   put:
 *     tags: [Master]
 *     summary: Update customer TOP
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
 *               top:
 *                 type: string
 *                 enum: [Net 14, Net 20, Net 30, Net 60, Net 90, Cash, Custom]
 *     responses:
 *       200:
 *         description: Customer TOP updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     tags: [Master]
 *     summary: Hapus customer TOP
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer TOP deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

const updateSchema = z.object({
  top: z.enum(['Net 14', 'Net 20', 'Net 30', 'Net 60', 'Net 90', 'Cash', 'Custom']),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request); if (auth.error) return auth.error
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('customer_top').select('*').eq('id', id).single()
  if (error) return internalError(error)
  if (!data) return notFound('Customer TOP tidak ditemukan')
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
  const { data, error } = await supabaseAdmin.from('customer_top').update({ top: parsed.data.top, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) return internalError(error)
  if (!data) return notFound('Customer TOP tidak ditemukan')
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const { error } = await supabaseAdmin.from('customer_top').delete().eq('id', id)
  if (error) return internalError(error)
  return new NextResponse(null, { status: 204 })
}
