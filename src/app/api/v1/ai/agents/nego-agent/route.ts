import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { analyzeNegosiasi, getNegotiationHistory } from '@/lib/ai/agents/NegoAgent'

const analyzeSchema = z.object({
  quotation_id: z.string().optional(),
  barang_id: z.string().min(1),
  harga_beli: z.coerce.number().positive(),
  harga_diminta: z.coerce.number().positive(),
  customer_id: z.string().optional(),
  customer_tier: z.enum(['A', 'B', 'C']).optional(),
  order_history: z.string().optional(),
  payment_terms: z.string().optional(),
  customer_payment_history: z.enum(['good', 'slow', 'defaulted']).optional(),
  customer_name: z.string().optional(),
  use_streaming: z.boolean().optional().default(true),
})

/**
 * @openapi
 * /api/v1/ai/agents/nego-agent:
 *   post:
 *     tags: [AI Agent]
 *     summary: Analisa negosiasi harga & margin
 *     description: Menganalisa harga beli vs harga diminta, menghitung margin, menentukan approval level, dan memberikan rekomendasi (ACCEPT/COUNTER/REJECT)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               barang_id:
 *                 type: string
 *                 example: BRG-001
 *               harga_beli:
 *                 type: number
 *                 example: 50000
 *               harga_diminta:
 *                 type: number
 *                 example: 75000
 *     responses:
 *       200:
 *         description: Hasil analisa negosiasi
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = analyzeSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  try {
    const result = await analyzeNegosiasi(
      {
        quotation_id: parsed.data.quotation_id,
        barang_id: parsed.data.barang_id,
        harga_beli: parsed.data.harga_beli,
        harga_diminta: parsed.data.harga_diminta,
        customer_id: parsed.data.customer_id,
        customer_tier: parsed.data.customer_tier,
        order_history: parsed.data.order_history,
        payment_terms: parsed.data.payment_terms,
        customer_payment_history: parsed.data.customer_payment_history,
        customer_name: parsed.data.customer_name,
      },
      auth.user.id,
      parsed.data.use_streaming
    )

    return NextResponse.json({ data: result })
  } catch (err) {
    return internalError(err instanceof Error ? err.message : 'Analisis negosiasi gagal')
  }
}

const historySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
})

/**
 * @openapi
 * /api/v1/ai/agents/nego-agent:
 *   get:
 *     tags: [AI Agent]
 *     summary: History negosiasi
 *     description: Mengambil riwayat analisa negosiasi untuk user yang terautentikasi
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Jumlah history yang diambil (max 100)
 *     responses:
 *       200:
 *         description: Array history negosiasi
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const parsed = historySchema.safeParse({
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
  })

  const limit = parsed.success ? parsed.data.limit : 50

  try {
    const history = await getNegotiationHistory(auth.user.id, limit)
    return NextResponse.json({ data: history })
  } catch (err) {
    return internalError(err instanceof Error ? err.message : 'Gagal mengambil history')
  }
}
