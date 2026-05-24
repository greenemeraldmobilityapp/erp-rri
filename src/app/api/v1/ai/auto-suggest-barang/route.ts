import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { autoSuggestBarang } from '@/lib/ai/auto-suggest-barang'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, unauthorized } from '@/lib/api/errors'

const schema = z.object({
  query: z.string().min(1, 'Query wajib diisi'),
  customer_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

/**
 * @openapi
 * /api/v1/ai/auto-suggest-barang:
 *   get:
 *     tags: [AI Agent]
 *     summary: Auto-Suggest Barang
 *     description: Auto-suggest nama barang berdasarkan query + histori customer
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian barang
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *         description: Filter berdasarkan histori customer tertentu
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah maksimal hasil
 *     responses:
 *       200:
 *         description: Daftar barang
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.user) {
    const res = auth.error
    return res ?? unauthorized('Unauthorized')
  }

  const { searchParams } = new URL(request.url)
  const parsed = schema.safeParse({
    query: searchParams.get('query'),
    customer_id: searchParams.get('customer_id'),
    limit: searchParams.get('limit'),
  })

  if (!parsed.success) {
    return badRequest(parsed.error.issues.map((e) => e.message).join(', '))
  }

  const result = await autoSuggestBarang(parsed.data.query, parsed.data.customer_id, parsed.data.limit)
  return NextResponse.json({ data: result })
}
