import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { getRekomendasiHarga } from '@/lib/ai/rekomendasi-harga'

const schema = z.object({ barang_id: z.string().min(1) })

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  try {
    const rekom = await getRekomendasiHarga(parsed.data.barang_id)
    return NextResponse.json({ data: rekom })
  } catch (err) {
    return internalError(err instanceof Error ? err.message : 'Gagal')
  }
}
