import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { analisaNegosiasi } from '@/lib/ai/negosiasi-assistant'

const schema = z.object({
  quotation_id: z.string().min(1),
  barang_id: z.string().min(1),
  harga_diminta: z.coerce.number().positive(),
})

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  try {
    const analisa = await analisaNegosiasi(parsed.data.quotation_id, parsed.data.harga_diminta, parsed.data.barang_id)
    return NextResponse.json({ data: analisa })
  } catch (err) {
    return internalError(err instanceof Error ? err.message : 'Gagal')
  }
}
