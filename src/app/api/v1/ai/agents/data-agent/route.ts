import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { runDataAgent, handleAutomationTrigger, type DataAgentTask } from '@/lib/ai/agents/DataAgent'
import { processChatQuery, processChatQueryStreaming } from '@/lib/ai/agents/DataAgent/chat/chatRouter'

const taskSchema = z.object({
  type: z.enum(['PRICE_RECOMMENDATION', 'REPORT_SUMMARY', 'INVOICE_CLASSIFY', 'INVOICE_BATCH_CLASSIFY', 'AUTO_INVOICE_DRAFT', 'SMART_REMINDER', 'BULK_REMINDERS', 'PR_ROUTING', 'GRN_CHECK', 'CONTRACT_ALERTS', 'CHAT']),
  barang_id: z.string().optional(),
  customer_tier: z.enum(['A', 'B', 'C']).optional(),
  order_volume: z.coerce.number().optional(),
  payment_terms: z.string().optional(),
  report_type: z.string().optional(),
  filters: z.object({ start_date: z.string().optional(), end_date: z.string().optional() }).optional(),
  invoice_id: z.string().optional(),
  status_filter: z.array(z.string()).optional(),
  quotation_id: z.string().optional(),
  customer_id: z.string().optional(),
  delivery_order_id: z.string().optional(),
  tanggal: z.string().optional(),
  top: z.string().optional(),
  reminder_type: z.enum(['auto', 'urgent', 'final']).optional(),
  overdue_days_threshold: z.coerce.number().optional(),
  items: z.array(z.object({ barang_id: z.string(), jumlah: z.number() })).optional(),
  purchase_request_id: z.string().optional(),
  grn_id: z.string().optional(),
  days_threshold: z.coerce.number().optional(),
  query: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  stream: z.boolean().optional().default(false),
})

const triggerSchema = z.object({
  trigger_type: z.enum(['INVOICE_CREATED', 'INVOICE_OVERDUE', 'QUOTATION_CREATED', 'PR_SUBMITTED', 'GRN_CREATED', 'CONTRACT_NEARING_EXPIRY', 'AR_OVERDUE_30', 'MANUAL_TRIGGER']),
  payload: z.record(z.string(), z.unknown()),
})

/**
 * @openapi
 * /api/v1/ai/agents/data-agent:
 *   post:
 *     tags: [AI Agent]
 *     summary: Eksekusi task DataAgent (chat, trigger, atau task)
 *     description: |
 *       Tiga mode operasi:
 *       1. CHAT — NL-to-SQL query database ERP pakai bahasa Indonesia
 *       2. TRIGGER — Automation trigger (INVOICE_CREATED, PR_SUBMITTED, dll)
 *       3. TASK — Task spesifik (PRICE_RECOMMENDATION, REPORT_SUMMARY, dll)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [CHAT, PRICE_RECOMMENDATION, REPORT_SUMMARY, INVOICE_CLASSIFY, SMART_REMINDER, PR_ROUTING, GRN_CHECK, CONTRACT_ALERTS]
 *               query:
 *                 type: string
 *                 description: Pertanyaan untuk mode CHAT (NL-to-SQL)
 *               trigger_type:
 *                 type: string
 *                 enum: [INVOICE_CREATED, QUOTATION_CREATED, PR_SUBMITTED, GRN_CREATED, CONTRACT_NEARING_EXPIRY, AR_OVERDUE_30]
 *     responses:
 *       200:
 *         description: Hasil eksekusi DataAgent
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

  const isTrigger = body.trigger_type !== undefined

  if (isTrigger) {
    const parsed = triggerSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    try {
      const result = await handleAutomationTrigger(
        parsed.data.trigger_type,
        parsed.data.payload,
        auth.user.id
      )
      if (!result) {
        return NextResponse.json({ data: null, message: 'No action triggered' })
      }
      return NextResponse.json({ data: result })
    } catch (err) {
      return internalError(err instanceof Error ? err.message : 'Trigger gagal')
    }
  }

  const parsed = taskSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  try {
    if (parsed.data.type === 'CHAT' && parsed.data.query) {
      if (parsed.data.stream) {
        const headers = new Headers({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        })

        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          async start(controller) {
            let isDone = false
            let hasError = false

            await processChatQueryStreaming(
              { query: parsed.data.query!, userId: auth.user.id },
              (chunk) => {
                controller.enqueue(encoder.encode(`data: ${chunk}\n\n`))
              },
              (response) => {
                isDone = true
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', data: response })}\n\n`))
                controller.close()
              },
              (error) => {
                hasError = true
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', data: error })}\n\n`))
                controller.close()
              }
            )
            if (!isDone && !hasError) {
              controller.close()
            }
          },
        })

        return new NextResponse(stream, { headers })
      }

      const result = await processChatQuery({
        query: parsed.data.query,
        userId: auth.user.id,
      })
      return NextResponse.json({ data: result })
    }

    const task: DataAgentTask = parsed.data as DataAgentTask
    const result = await runDataAgent(task, auth.user.id)
    return NextResponse.json({ data: result })
  } catch (err) {
    return internalError(err instanceof Error ? err.message : 'DataAgent gagal')
  }
}
