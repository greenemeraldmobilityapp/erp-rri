import { supabaseAdmin } from '@/lib/api/supabase-server'

export type InvoiceCategory = 'normal' | 'urgent' | 'overdue' | 'disputed'

export interface InvoiceClassification {
  invoice_id: string
  category: InvoiceCategory
  priority_score: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  payment_probability: number
  reason: string
  recommendations: string[]
  created_at: string
}

export async function classifyInvoice(invoiceId: string): Promise<InvoiceClassification> {
  const { data: invoice } = await supabaseAdmin
    .from('invoice')
    .select('*, customer!customer_id(id, nama, kode, telepon)')
    .eq('id', invoiceId)
    .single()

  if (!invoice) {
    throw new Error('Invoice tidak ditemukan')
  }

  const { data: paymentHistory } = await supabaseAdmin
    .from('invoice')
    .select('status, tanggal')
    .eq('customer_id', (invoice as { customer_id: string }).customer_id)
    .order('tanggal', { ascending: false })
    .limit(10)

  const overdueDays = calculateOverdueDays(invoice.tanggal, invoice.top)
  const customerPaymentScore = calculatePaymentScore(paymentHistory ?? [])

  let category: InvoiceCategory
  let priorityScore: number
  let riskLevel: InvoiceClassification['risk_level']
  let paymentProbability: number
  let reason: string
  const recommendations: string[] = []

  if (invoice.status === 'draft') {
    category = 'normal'
    priorityScore = 1
    riskLevel = 'LOW'
    paymentProbability = 0.95
    reason = 'Invoice draft - belum dikirim'
  } else if (invoice.status === 'paid') {
    category = 'normal'
    priorityScore = 0
    riskLevel = 'LOW'
    paymentProbability = 1.0
    reason = 'Invoice sudah lunas'
  } else if (invoice.status === 'disputed') {
    category = 'disputed'
    priorityScore = 10
    riskLevel = 'CRITICAL'
    paymentProbability = 0.3
    reason = 'Invoice dalam sengketa'
    recommendations.push('Segera escalate ke owner')
    recommendations.push('Dokumentasikan kronologi dispute')
  } else if (overdueDays > 60) {
    category = 'overdue'
    priorityScore = 10
    riskLevel = 'CRITICAL'
    paymentProbability = 0.2
    reason = `Overdue ${overdueDays} hari - sangat kritis`
    recommendations.push('Immediate human intervention required')
    recommendations.push('Consider legal action jika >90 hari')
    recommendations.push('Hold all future shipments')
  } else if (overdueDays > 30) {
    category = 'overdue'
    priorityScore = 8
    riskLevel = 'HIGH'
    paymentProbability = 0.4
    reason = `Overdue ${overdueDays} hari`
    recommendations.push('Direct phone call to customer')
    recommendations.push('Send formal reminder letter')
    recommendations.push('Escalate to collection agency if no response')
  } else if (overdueDays > 0) {
    category = 'urgent'
    priorityScore = 6
    riskLevel = 'MEDIUM'
    paymentProbability = 0.6
    reason = `Overdue ${overdueDays} hari - perlu follow-up`
    recommendations.push('Send automated reminder')
    recommendations.push('Review customer payment terms')
  } else {
    category = 'normal'
    priorityScore = 1
    riskLevel = 'LOW'
    paymentProbability = 0.95
    reason = 'Invoice aktif, belum jatuh tempo'
  }

  if (customerPaymentScore < 0.5 && category !== 'disputed') {
    riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : riskLevel === 'MEDIUM' ? 'HIGH' : riskLevel
    recommendations.push('Customer punya history pembayaran lambat')
    paymentProbability *= 0.7
  }

  return {
    invoice_id: invoiceId,
    category,
    priority_score: priorityScore,
    risk_level: riskLevel,
    payment_probability: Math.round(paymentProbability * 100) / 100,
    reason,
    recommendations,
    created_at: new Date().toISOString(),
  }
}

function calculateOverdueDays(invoiceDate: string, top: string): number {
  const invoiceDateObj = new Date(invoiceDate)
  const topMatch = top.match(/\d+/)
  const topDays = topMatch ? parseInt(topMatch[0]) : 30
  const dueDate = new Date(invoiceDateObj)
  dueDate.setDate(dueDate.getDate() + topDays)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  const diff = today.getTime() - dueDate.getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

function calculatePaymentScore(
  history: Array<{ status: string; tanggal: string }>
): number {
  if (history.length === 0) return 0.5

  let score = 0
  let count = 0

  for (const inv of history) {
    if (inv.status === 'paid') {
      score += 1
      count++
    } else if (inv.status === 'overdue') {
      score += 0.3
      count++
    } else {
      count++
    }
  }

  return count > 0 ? score / count : 0.5
}

export async function batchClassifyInvoices(
  statusFilter?: Array<'sent' | 'overdue'>
): Promise<InvoiceClassification[]> {
  let query = supabaseAdmin
    .from('invoice')
    .select('id, status, tanggal, top, customer_id, total')

  if (statusFilter) {
    query = query.in('status', statusFilter)
  } else {
    query = query.in('status', ['sent', 'overdue'])
  }

  const { data: invoices } = await query

  const results: InvoiceClassification[] = []

  for (const invoice of invoices ?? []) {
    try {
      const classification = await classifyInvoice(invoice.id)
      results.push(classification)
    } catch (err) {
      console.error(`Failed to classify invoice ${invoice.id}:`, err)
    }
  }

  return results.sort((a, b) => b.priority_score - a.priority_score)
}