import { supabaseAdmin } from '@/lib/api/supabase-server'

export interface ReportSummary {
  report_type: string
  executive_summary: string[]
  key_metrics: Record<string, number | string>
  action_items: string[]
  generated_at: string
}

export async function summarizeReport(
  reportType: string,
  filters?: {
    start_date?: string
    end_date?: string
    customer_id?: string
  }
): Promise<ReportSummary> {
  let data: Record<string, unknown> = {}
  let summary: ReportSummary

  switch (reportType) {
    case 'ar-aging': {
      const { data: invoices } = await supabaseAdmin
        .from('invoice')
        .select('*, customer!customer_id(nama, kode)')
        .in('status', ['sent', 'overdue'])

      const overdueInvoices = (invoices ?? []).filter(
        (i: { status: string }) => i.status === 'overdue'
      )
      const totalAR = invoices?.reduce(
        (sum: number, i: { total: number }) => sum + (i.total ?? 0),
        0
      ) ?? 0
      const totalOverdue = overdueInvoices.reduce(
        (sum: number, i: { total: number }) => sum + (i.total ?? 0),
        0
      )

      data = {
        total_invoices: invoices?.length ?? 0,
        overdue_count: overdueInvoices.length,
        total_ar: totalAR,
        total_overdue: totalOverdue,
      }

      summary = {
        report_type: 'ar-aging',
        executive_summary: [
          `${invoices?.length ?? 0} invoice aktif, ${overdueInvoices.length} overdue`,
          `Total AR: Rp ${totalAR.toLocaleString('id-ID')}`,
          `Overdue: Rp ${totalOverdue.toLocaleString('id-ID')}`,
          overdueInvoices.length > 5
            ? 'WARNING: High overdue count - escalate collection effort'
            : 'Overdue dalam batas acceptable',
          totalOverdue / totalAR > 0.3
            ? 'CRITICAL: >30% AR overdue - cashflow at risk'
            : 'Cashflow position healthy',
        ],
        key_metrics: {
          total_ar: totalAR,
          total_overdue: totalOverdue,
          overdue_percentage: totalAR > 0 ? (totalOverdue / totalAR) * 100 : 0,
          avg_days_overdue: 0,
        },
        action_items: [
          overdueInvoices.length > 0 ? 'Send payment reminders to overdue customers' : 'Continue monitoring',
          overdueInvoices.length > 10 ? 'Escalate to owner for direct calls' : 'Manager follow-up sufficient',
          totalOverdue / totalAR > 0.3 ? 'Immediate collection meeting required' : 'Normal collection process',
        ],
        generated_at: new Date().toISOString(),
      }
      break
    }

    case 'neraca': {
      const { data: assets } = await supabaseAdmin
        .from('jurnal')
        .select('*, coa!coa_id(kode, nama)')
        .like('coa.kode', '1%')

      data = { asset_count: assets?.length ?? 0 }
      summary = {
        report_type: 'neraca',
        executive_summary: [
          'Neraca report analysis',
          'Asset data retrieved',
          'Balance sheet summary available',
        ],
        key_metrics: {},
        action_items: [],
        generated_at: new Date().toISOString(),
      }
      break
    }

    case 'laba-rugi': {
      const { data: revenues } = await supabaseAdmin
        .from('invoice')
        .select('total')
        .eq('status', 'paid')

      const { data: costs } = await supabaseAdmin
        .from('purchase_order')
        .select('total')
        .eq('status', 'completed')

      const totalRevenue = revenues?.reduce((s: number, i: { total: number }) => s + (i.total ?? 0), 0) ?? 0
      const totalCost = costs?.reduce((s: number, i: { total: number }) => s + (i.total ?? 0), 0) ?? 0
      const profit = totalRevenue - totalCost

      summary = {
        report_type: 'laba-rugi',
        executive_summary: [
          `Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}`,
          `Total Cost: Rp ${totalCost.toLocaleString('id-ID')}`,
          `Net Profit: Rp ${profit.toLocaleString('id-ID')}`,
          profit > 0 ? 'Margin positif - profitable operations' : 'NEGATIVE - cost exceeds revenue',
          profit / totalRevenue > 0.15 ? 'Healthy margin >15%' : 'Margin below target',
        ],
        key_metrics: {
          revenue: totalRevenue,
          cost: totalCost,
          profit,
          margin: totalRevenue > 0 ? profit / totalRevenue : 0,
        },
        action_items: [
          profit < 0 ? 'URGENT: Review cost structure' : 'Continue monitoring',
          profit / totalRevenue < 0.15 ? 'Review pricing strategy' : 'Pricing acceptable',
        ],
        generated_at: new Date().toISOString(),
      }
      break
    }

    default: {
      summary = {
        report_type: reportType,
        executive_summary: ['Report type not implemented'],
        key_metrics: {},
        action_items: ['Contact admin to enable this report type'],
        generated_at: new Date().toISOString(),
      }
    }
  }

  return summary
}