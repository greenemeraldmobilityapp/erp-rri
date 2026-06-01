import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { internalError } from '@/lib/api/errors'
import { z } from 'zod'

const BodySchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      packing_number: z.number().int().nullable(),
    })
  ),
})

export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error
  const { id } = await params

  const parsed = BodySchema.safeParse(await _request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', detail: parsed.error.format() }, { status: 400 })
  }

  const { items } = parsed.data

  // Validate: no packing_number exceeds 13 items
  const countMap = new Map<number | null, number>()
  for (const item of items) {
    const key = item.packing_number
    countMap.set(key, (countMap.get(key) ?? 0) + 1)
  }
  for (const [pack, count] of countMap) {
    if (pack != null && count > 13) {
      return NextResponse.json(
        { error: `Packing ${pack} melebihi batas maksimal 13 items (saat ini ${count} items)` },
        { status: 400 }
      )
    }
  }

  // Update each item's packing_number
  for (const item of items) {
    const { error } = await supabaseAdmin
      .from('delivery_order_item')
      .update({ packing_number: item.packing_number })
      .eq('id', item.id)
      .eq('delivery_order_id', id)
    if (error) return internalError(error)
  }

  return NextResponse.json({ success: true })
}
