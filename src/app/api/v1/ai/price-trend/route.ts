import { NextRequest, NextResponse } from 'next/server'
import { getPriceTrend } from '@/lib/ai/price-trend'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, unauthorized } from '@/lib/api/errors'
import { z } from 'zod'

const schema = z.object({
  barang_id: z.string().min(1, 'barang_id wajib diisi'),
  bulan: z.coerce.number().int().min(1).max(60).default(12),
})

/**
 * @openapi
 * /api/v1/ai/price-trend:
 *   get:
 *     tags: [AI Agent]
 *     summary: Price Trend Analysis
 *     description: Tren harga barang per bulan dari histori PO
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: barang_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID barang
 *       - in: query
 *         name: bulan
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Jumlah bulan ke belakang
 *     responses:
 *       200:
 *         description: Data tren harga
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
    barang_id: searchParams.get('barang_id'),
    bulan: searchParams.get('bulan'),
  })

  if (!parsed.success) {
    return badRequest(parsed.error.issues.map((e) => e.message).join(', '))
  }

  const result = await getPriceTrend(parsed.data.barang_id, parsed.data.bulan)
  if (!result) return notFound('Barang tidak ditemukan')
  return NextResponse.json({ data: result })
}
