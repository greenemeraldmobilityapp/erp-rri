import { NextRequest, NextResponse } from 'next/server'
import { rekomendasiSupplier } from '@/lib/ai/rekomendasi-supplier'
import { verifyAuth } from '@/lib/api/auth'
import { unauthorized } from '@/lib/api/errors'

/**
 * @openapi
 * /api/v1/ai/rekomendasi-supplier:
 *   get:
 *     tags: [AI Agent]
 *     summary: Prediktif Rekomendasi Supplier
 *     description: Ranking supplier terbaik berdasarkan histori PO, harga, dan frekuensi
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: barang_id
 *         schema:
 *           type: string
 *         description: Filter supplier yang pernah supply barang tertentu
 *       - in: query
 *         name: min_po
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Minimum jumlah PO
 *     responses:
 *       200:
 *         description: Daftar supplier ranking
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
  const barangId = searchParams.get('barang_id') ?? undefined
  const minPo = parseInt(searchParams.get('min_po') ?? '1', 10)

  const result = await rekomendasiSupplier(barangId, minPo)
  return NextResponse.json({ data: result })
}
