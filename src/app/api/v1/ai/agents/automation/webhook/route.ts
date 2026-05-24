import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { badRequest, internalError, unauthorized } from '@/lib/api/errors'
import { handleAutomationTrigger, runDataAgent } from '@/lib/ai/agents/DataAgent'

const triggerMap: Record<string, string> = {
  invoice: 'INVOICE_CREATED',
  quotation: 'QUOTATION_CREATED',
  purchase_request: 'PR_SUBMITTED',
  grn: 'GRN_CREATED',
}

const webhookSchema = z.object({
  type: z.enum(['INSERT', 'UPDATE', 'DELETE']),
  table: z.string(),
  schema: z.string().default('public'),
  record: z.record(z.string(), z.unknown()).nullable().default(null),
  old_record: z.record(z.string(), z.unknown()).nullable().default(null),
})

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.AI_WEBHOOK_SECRET
  if (webhookSecret) {
    const authHeader = request.headers.get('x-webhook-secret')
    if (authHeader !== webhookSecret) {
      return unauthorized('Invalid webhook secret')
    }
  }

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = webhookSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const { type, table, record } = parsed.data

  if (type !== 'INSERT' || !record) {
    return NextResponse.json({ message: 'Ignored', reason: 'Only INSERT triggers are processed', table, type })
  }

  const triggerType = triggerMap[table]
  if (!triggerType) {
    return NextResponse.json({ message: 'Ignored', reason: `No trigger configured for table: ${table}`, table })
  }

  if (table === 'invoice') {
    try {
      const result = await handleAutomationTrigger('INVOICE_CREATED', {
        invoice_id: record.id,
        invoice_nomor: record.nomor,
        customer_id: record.customer_id,
      }, 'system')
      return NextResponse.json({ data: result })
    } catch (err) {
      return internalError(err instanceof Error ? err.message : 'Trigger failed')
    }
  }

  if (table === 'quotation') {
    try {
      const result = await runDataAgent({ type: 'PRICE_RECOMMENDATION', barang_id: '', customer_tier: 'B', order_volume: 0, payment_terms: '' }, 'system')
      return NextResponse.json({ data: result })
    } catch (err) {
      return internalError(err)
    }
  }

  if (table === 'purchase_request') {
    try {
      const items = (record.items as Array<{ barang_id: string; jumlah: number }>) ?? []
      const result = await handleAutomationTrigger('PR_SUBMITTED', {
        items,
        purchase_request_id: record.id,
      }, 'system')
      return NextResponse.json({ data: result })
    } catch (err) {
      return internalError(err)
    }
  }

  if (table === 'grn') {
    try {
      const result = await handleAutomationTrigger('GRN_CREATED', {
        grn_id: record.id,
      }, 'system')
      return NextResponse.json({ data: result })
    } catch (err) {
      return internalError(err)
    }
  }

  return NextResponse.json({ message: 'No matching handler', table, triggerType })
}
