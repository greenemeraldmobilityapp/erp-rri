/**
 * @openapi
 * /api/v1/master/customer-top:
 *   get:
 *     tags: [Master]
 *     summary: Daftar customer TOP
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *     responses:
 *       200:
 *         description: Daftar customer TOP
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Master]
 *     summary: Tambah customer TOP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer_id:
 *                 type: string
 *               top:
 *                 type: string
 *                 enum: [Net 30, Net 60, Cash, Custom]
 *     responses:
 *       201:
 *         description: Customer TOP created
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
  customer_id: z.string().min(1, 'Customer harus dipilih'),
  top: z.enum(['Net 30', 'Net 60', 'Cash', 'Custom']),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customer_id')

  let query = supabaseAdmin.from('customer_top').select('*').order('created_at', { ascending: false })
  if (customerId) query = query.eq('customer_id', customerId)
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
  const { data, error } = await supabaseAdmin.from('customer_top').insert({ id, customer_id: parsed.data.customer_id, top: parsed.data.top }).select('*').single()
  if (error) return internalError(error)
  return NextResponse.json({ data }, { status: 201 })
}
