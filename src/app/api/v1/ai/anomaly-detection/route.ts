import { NextRequest, NextResponse } from 'next/server'
import { detectAnomalies } from '@/lib/ai/anomaly-detection'
import { verifyAuth } from '@/lib/api/auth'
import { unauthorized } from '@/lib/api/errors'

/**
 * @openapi
 * /api/v1/ai/anomaly-detection:
 *   get:
 *     tags: [AI Agent]
 *     summary: Anomaly Detection Transaksi
 *     description: Deteksi harga jual terlalu miring, harga beli terlalu mahal, margin kecil
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Rentang hari yang diperiksa
 *     responses:
 *       200:
 *         description: Daftar anomaly
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
  const days = parseInt(searchParams.get('days') ?? '30', 10)

  const result = await detectAnomalies(days)
  return NextResponse.json({ data: result })
}
