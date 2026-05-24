/**
 * @openapi
 * /api/v1/laporan/arus-kas/pdf:
 *   get:
 *     tags: [Laporan]
 *     summary: Cetak PDF laporan arus kas
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: PDF laporan arus kas
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { internalError } from '@/lib/api/errors'
import { LaporanArusKasPDF } from '@/lib/pdf/laporan-arus-kas'

function makeDateRange(tahun: string | null, bulan: string | null) {
  const y = tahun ? parseInt(tahun) : new Date().getFullYear()
  if (bulan) {
    const m = parseInt(bulan)
    return { since: new Date(y, m - 1, 1).toISOString(), until: new Date(y, m, 0, 23, 59, 59).toISOString() }
  }
  return { since: new Date(y, 0, 1).toISOString(), until: new Date(y, 11, 31, 23, 59, 59).toISOString() }
}

function buildMonthlyBuckets(period: { since: string; until: string }) {
  const from = new Date(period.since)
  const to = new Date(period.until)
  const buckets: Array<{ label: string; since: string; until: string }> = []
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1)
  while (cursor <= to) {
    const m = cursor.getMonth() + 1
    const y = cursor.getFullYear()
    buckets.push({ label: `${String(m).padStart(2, '0')}/${y}`, since: new Date(y, m - 1, 1).toISOString(), until: new Date(y, m, 0, 23, 59, 59).toISOString() })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return buckets
}

function calcRevenue(invoices: Array<{ invoice_item?: Array<{ harga: number; jumlah: number; diskon: number | null; ppn: number | null; pph: number | null }> }>) {
  let total = 0
  for (const inv of invoices) {
    for (const it of inv.invoice_item ?? []) total += it.harga * it.jumlah - (it.diskon ?? 0) + (it.ppn ?? 0) - (it.pph ?? 0)
  }
  return total
}

function calcExpense(items: Array<{ harga_satuan: number; jumlah: number }>) {
  return items.reduce((s, i) => s + i.harga_satuan * i.jumlah, 0)
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const tahun = searchParams.get('tahun')
  const bulan = searchParams.get('bulan')

  const period = makeDateRange(tahun, bulan)

  const [curInvoices, curPoItems] = await Promise.all([
    supabaseAdmin.from('invoice').select('*, invoice_item!invoice_id(harga, jumlah, diskon, ppn, pph)').in('status', ['paid', 'sent']).gte('tanggal', period.since).lte('tanggal', period.until),
    supabaseAdmin.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status)').in('purchase_order.status', ['sent', 'received']).gte('purchase_order.tanggal', period.since).lte('purchase_order.tanggal', period.until),
  ])

  const totalRevenue = calcRevenue(curInvoices.data ?? [])
  const totalExpense = calcExpense(curPoItems.data ?? [])
  const netCashflow = totalRevenue - totalExpense

  const bulanName = bulan ? new Date(parseInt(tahun ?? '0'), parseInt(bulan) - 1, 1).toLocaleDateString('id-ID', { month: 'long' }) : null

  const buckets = buildMonthlyBuckets(period)
  const monthly = await Promise.all(buckets.map(async b => {
    const [r, e] = await Promise.all([
      supabaseAdmin.from('invoice').select('*, invoice_item!invoice_id(harga, jumlah, diskon, ppn, pph)').in('status', ['paid', 'sent']).gte('tanggal', b.since).lte('tanggal', b.until),
      supabaseAdmin.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status)').in('purchase_order.status', ['sent', 'received']).gte('purchase_order.tanggal', b.since).lte('purchase_order.tanggal', b.until),
    ])
    return { bulan: b.label, pemasukan: calcRevenue(r.data ?? []), pengeluaran: calcExpense(e.data ?? []) }
  }))

  const pdfData = {
    tahun: tahun ?? String(new Date().getFullYear()),
    bulan: bulanName,
    pemasukan: totalRevenue,
    pengeluaran: totalExpense,
    bersih: netCashflow,
    monthly,
  }

  try {
    const blob = await pdf(LaporanArusKasPDF({ data: pdfData })).toBlob()
    const disposition = searchParams.get('download') === '1'
      ? `attachment; filename="ARUS-KAS-${tahun ?? new Date().getFullYear()}${bulan ? '-' + bulan : ''}.pdf"`
      : `inline; filename="ARUS-KAS-${tahun ?? new Date().getFullYear()}${bulan ? '-' + bulan : ''}.pdf"`
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
      },
    })
  } catch {
    return internalError('Gagal generate PDF')
  }
}