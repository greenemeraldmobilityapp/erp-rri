import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { handleAutomationTrigger } from '@/lib/ai/agents/DataAgent'

interface TriggerResult {
  trigger: string
  entity_count: number
  results: Array<{ entity_id: string; status: string; error?: string }>
}

export async function GET(request: Request) {
  const cronToken = process.env.CRON_SECRET_TOKEN
  if (cronToken) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const results: TriggerResult[] = []

  // 1. CONTRACT_NEARING_EXPIRY — kontrak expired dalam 30 hari
  {
    const { data: contracts, error } = await supabaseAdmin
      .from('kontrak')
      .select('id, nama, customer_id, tanggal_selesai')
      .eq('is_active', true)
      .gte('tanggal_selesai', new Date().toISOString())
      .lte('tanggal_selesai', new Date(Date.now() + 30 * 86400000).toISOString())

    if (error) {
      results.push({ trigger: 'CONTRACT_NEARING_EXPIRY', entity_count: 0, results: [{ entity_id: 'error', status: 'failed', error: error.message }] })
    } else {
      const triggerResults: TriggerResult['results'] = []
      for (const contract of (contracts ?? [])) {
        try {
          await handleAutomationTrigger('CONTRACT_NEARING_EXPIRY', { contract_id: contract.id, contract_name: contract.nama }, 'system')
          triggerResults.push({ entity_id: contract.id, status: 'triggered' })
        } catch (err) {
          triggerResults.push({ entity_id: contract.id, status: 'failed', error: err instanceof Error ? err.message : 'unknown' })
        }
      }
      results.push({ trigger: 'CONTRACT_NEARING_EXPIRY', entity_count: contracts?.length ?? 0, results: triggerResults })
    }
  }

  // 2. AR_OVERDUE_30 — invoice overdue > 30 hari
  {
    const { data: overdueInvoices, error } = await supabaseAdmin
      .from('invoice')
      .select('id, nomor, customer_id, tanggal')
      .not('status', 'eq', 'paid')
      .lt('tanggal', new Date(Date.now() - 30 * 86400000).toISOString())

    if (error) {
      results.push({ trigger: 'AR_OVERDUE_30', entity_count: 0, results: [{ entity_id: 'error', status: 'failed', error: error.message }] })
    } else {
      const triggerResults: TriggerResult['results'] = []
      for (const inv of (overdueInvoices ?? [])) {
        try {
          await handleAutomationTrigger('AR_OVERDUE_30', { invoice_id: inv.id, invoice_nomor: inv.nomor, customer_id: inv.customer_id }, 'system')
          triggerResults.push({ entity_id: inv.id, status: 'triggered' })
        } catch (err) {
          triggerResults.push({ entity_id: inv.id, status: 'failed', error: err instanceof Error ? err.message : 'unknown' })
        }
      }
      results.push({ trigger: 'AR_OVERDUE_30', entity_count: overdueInvoices?.length ?? 0, results: triggerResults })
    }
  }

  return NextResponse.json({
    run_at: new Date().toISOString(),
    trigger_results: results,
  })
}
