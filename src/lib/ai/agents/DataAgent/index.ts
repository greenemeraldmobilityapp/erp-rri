import { createNvidiaClient, AI_MODELS, MODEL_CONFIGS } from '@/lib/ai/client'
import { StreamingAccumulator } from '@/lib/ai/streaming'
import { buildDataPrompt, buildReportSummaryPrompt, buildClassificationPrompt } from './prompts'
import { getPriceRecommendation } from './tools/priceRecommender'
import { summarizeReport } from './tools/reportSummarizer'
import { classifyInvoice, batchClassifyInvoices } from './tools/dataClassifier'
import { generateInvoiceFromQuotation } from './tools/autoInvoice'
import { generateSmartReminder, generateBulkReminders } from './tools/smartReminder'
import { routePurchaseRequest } from './tools/prRouter'
import { checkGRN } from './tools/grnChecker'
import { checkContractAlerts, getContractAlertSummary } from './tools/contractAlert'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { TriggerType } from '@/lib/ai/agents/types'

export type DataAgentTask =
  | { type: 'PRICE_RECOMMENDATION'; barang_id: string; customer_tier: 'A' | 'B' | 'C'; order_volume: number; payment_terms: string }
  | { type: 'REPORT_SUMMARY'; report_type: string; filters?: { start_date?: string; end_date?: string } }
  | { type: 'INVOICE_CLASSIFY'; invoice_id: string }
  | { type: 'INVOICE_BATCH_CLASSIFY'; status_filter?: Array<'sent' | 'overdue'> }
  | { type: 'AUTO_INVOICE_DRAFT'; quotation_id: string; customer_id: string; delivery_order_id?: string; tanggal: string; top: string }
  | { type: 'SMART_REMINDER'; invoice_id: string; reminder_type?: 'auto' | 'urgent' | 'final' }
  | { type: 'BULK_REMINDERS'; overdue_days_threshold?: number }
  | { type: 'PR_ROUTING'; items: Array<{ barang_id: string; jumlah: number }>; purchase_request_id?: string }
  | { type: 'GRN_CHECK'; grn_id: string }
  | { type: 'CONTRACT_ALERTS'; days_threshold?: number }
  | { type: 'CHAT'; query: string; context?: Record<string, unknown> }

export interface DataAgentResult {
  task_type: string
  result: unknown
  tokens_used?: number
  latency_ms?: number
  created_at: string
}

export async function runDataAgent(
  task: DataAgentTask,
  userId: string
): Promise<DataAgentResult> {
  const startTime = Date.now()
  const client = createNvidiaClient()

  let result: unknown

  switch (task.type) {
    case 'PRICE_RECOMMENDATION': {
      result = await getPriceRecommendation(
        task.barang_id,
        task.customer_tier,
        task.order_volume,
        task.payment_terms
      )
      break
    }

    case 'REPORT_SUMMARY': {
      const reportData = await summarizeReport(task.report_type, task.filters)
      result = reportData
      break
    }

    case 'INVOICE_CLASSIFY': {
      result = await classifyInvoice(task.invoice_id)
      break
    }

    case 'INVOICE_BATCH_CLASSIFY': {
      result = await batchClassifyInvoices(task.status_filter)
      break
    }

    case 'AUTO_INVOICE_DRAFT': {
      result = await generateInvoiceFromQuotation({
        quotation_id: task.quotation_id,
        customer_id: task.customer_id,
        delivery_order_id: task.delivery_order_id,
        tanggal: task.tanggal,
        top: task.top,
      })
      break
    }

    case 'SMART_REMINDER': {
      result = await generateSmartReminder({
        invoice_id: task.invoice_id,
        reminder_type: task.reminder_type,
      })
      break
    }

    case 'BULK_REMINDERS': {
      result = await generateBulkReminders(task.overdue_days_threshold)
      break
    }

    case 'PR_ROUTING': {
      result = await routePurchaseRequest({
        purchase_request_id: task.purchase_request_id,
        items: task.items,
      })
      break
    }

    case 'GRN_CHECK': {
      result = await checkGRN({ grn_id: task.grn_id })
      break
    }

    case 'CONTRACT_ALERTS': {
      result = await checkContractAlerts(task.days_threshold)
      break
    }

    case 'CHAT': {
      const prompt = buildDataPrompt(task.query, task.context ?? {})
      const response = await client.chat.completions.create({
        model: AI_MODELS.DATA_AGENT,
        messages: prompt as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
        temperature: 1,
        max_tokens: 8192,
        stream: false,
      })
      const content = response.choices[0]?.message?.content ?? ''
      try {
        result = JSON.parse(content)
      } catch {
        result = { answer: content }
      }
      break
    }

    default:
      throw new Error(`Unknown task type`)
  }

  const latencyMs = Date.now() - startTime

  try {
    await supabaseAdmin.from('ai_data_history').insert({
      task_type: task.type,
      user_id: userId,
      prompt: JSON.stringify(task),
      response: result,
      latency_ms: latencyMs,
    })
  } catch (err) {
    console.error('Failed to save data agent history:', err)
  }

  return {
    task_type: task.type,
    result,
    latency_ms: latencyMs,
    created_at: new Date().toISOString(),
  }
}

export async function handleAutomationTrigger(
  triggerType: TriggerType,
  payload: Record<string, unknown>,
  userId: string
): Promise<DataAgentResult | null> {
  switch (triggerType) {
    case 'INVOICE_CREATED': {
      const invoiceId = payload.invoice_id as string
      const classify = await runDataAgent(
        { type: 'INVOICE_CLASSIFY', invoice_id: invoiceId },
        userId
      )
      return classify
    }

    case 'QUOTATION_CREATED': {
      return null
    }

    case 'PR_SUBMITTED': {
      const items = payload.items as Array<{ barang_id: string; jumlah: number }>
      const prId = payload.purchase_request_id as string | undefined
      return await runDataAgent(
        { type: 'PR_ROUTING', items, purchase_request_id: prId },
        userId
      )
    }

    case 'GRN_CREATED': {
      const grnId = payload.grn_id as string
      return await runDataAgent({ type: 'GRN_CHECK', grn_id: grnId }, userId)
    }

    case 'CONTRACT_NEARING_EXPIRY': {
      return await runDataAgent({ type: 'CONTRACT_ALERTS', days_threshold: 30 }, userId)
    }

    case 'AR_OVERDUE_30': {
      return await runDataAgent({ type: 'BULK_REMINDERS', overdue_days_threshold: 30 }, userId)
    }

    default:
      return null
  }
}