/**
 * @openapi
 * /api/v1/laporan/laba-rugi/pdf:
 *   get:
 *     tags: [Laporan]
 *     summary: Cetak PDF laporan laba rugi
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: PDF laporan laba rugi
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { internalError } from '@/lib/api/errors'
import { LaporanLabaRugiPDF } from '@/lib/pdf/laporan-laba-rugi'

function makeDateRange(tahun: string | null, bulan: string | null) {
  const y = tahun ? parseInt(tahun) : new Date().getFullYear()
  if (bulan) {
    const m = parseInt(bulan)
    return { since: new Date(y, m - 1, 1).toISOString(), until: new Date(y, m, 0, 23, 59, 59).toISOString() }
  }
  return { since: new Date(y, 0, 1).toISOString(), until: new Date(y, 11, 31, 23, 59, 59).toISOString() }
}

function prevPeriod(tahun: string | null, bulan: string | null) {
  const y = tahun ? parseInt(tahun) : new Date().getFullYear()
  if (bulan) {
    const m = parseInt(bulan)
    if (m === 1) return { since: new Date(y - 1, 11, 1).toISOString(), until: new Date(y - 1, 11, 31, 23, 59, 59).toISOString() }
    return { since: new Date(y, m - 2, 1).toISOString(), until: new Date(y, m - 1, 0, 23, 59, 59).toISOString() }
  }
  return { since: new Date(y - 1, 0, 1).toISOString(), until: new Date(y - 1, 11, 31, 23, 59, 59).toISOString() }
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

async function fetchInvoiceItems(since: string, until: string, statuses: string[] = ['paid', 'sent']) {
  const { data: invIds } = await supabaseAdmin.from('invoice').select('id').in('status', statuses).gte('tanggal', since).lte('tanggal', until)
  const ids = (invIds ?? []).map(inv => inv.id)
  if (!ids.length) return []
  const { data: items } = await supabaseAdmin.from('invoice_item').select('invoice_id, harga, jumlah, diskon, ppn, pph').in('invoice_id', ids)
  return items ?? []
}

function calcRev(items: Array<{ harga: number; jumlah: number; diskon?: number | null; ppn?: number | null; pph?: number | null }>): number {
  return items.reduce((s, it) => s + it.harga * it.jumlah - (it.diskon ?? 0) + (it.ppn ?? 0) - (it.pph ?? 0), 0)
}

function calcCogs(items: Array<{ purchase_order: { status: string } | null; harga_satuan: number; jumlah: number }>): number {
  return items.filter(i => i.purchase_order?.status !== 'draft').reduce((s, i) => s + i.harga_satuan * i.jumlah, 0)
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const tahun = searchParams.get('tahun')
  const bulan = searchParams.get('bulan')

  const period = makeDateRange(tahun, bulan)
  const prev = prevPeriod(tahun, bulan)

  const [invItems, { data: poItems }, prevInvItems, { data: prevPoItems }] = await Promise.all([
    fetchInvoiceItems(period.since, period.until),
    supabaseAdmin.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status, tanggal)').gte('purchase_order.tanggal', period.since).lte('purchase_order.tanggal', period.until),
    fetchInvoiceItems(prev.since, prev.until),
    supabaseAdmin.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status, tanggal)').gte('purchase_order.tanggal', prev.since).lte('purchase_order.tanggal', prev.until),
  ])

  const totalRevenue = calcRev(invItems)
  const totalCOGS = calcCogs(poItems ?? [])
  const grossProfit = totalRevenue - totalCOGS

  const prevRevenue = calcRev(prevInvItems)
  const prevCOGS = calcCogs(prevPoItems ?? [])
  const prevProfit = prevRevenue - prevCOGS

  const bulanName = bulan ? new Date(parseInt(tahun ?? '0'), parseInt(bulan) - 1, 1).toLocaleDateString('id-ID', { month: 'long' }) : null

  const buckets = buildMonthlyBuckets(period)
  const monthly = await Promise.all(buckets.map(async b => {
    const [r, c] = await Promise.all([
      fetchInvoiceItems(b.since, b.until),
      supabaseAdmin.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status)').gte('purchase_order.tanggal', b.since).lte('purchase_order.tanggal', b.until),
    ])
    return { bulan: b.label, pendapatan: calcRev(r), hpp: calcCogs(c.data ?? []) }
  }))

  const pdfData = {
    tahun: tahun ?? String(new Date().getFullYear()),
    bulan: bulanName,
    pendapatan: totalRevenue,
    hpp: totalCOGS,
    labaRugi: grossProfit,
    prevPendapatan: prevRevenue,
    prevHpp: prevCOGS,
    prevLabaRugi: prevProfit,
    monthly,
  }

  try {
    const blob = await pdf(LaporanLabaRugiPDF({ data: pdfData })).toBlob()
    const disposition = searchParams.get('download') === '1'
      ? `attachment; filename="LR-${tahun ?? new Date().getFullYear()}${bulan ? '-' + bulan : ''}.pdf"`
      : `inline; filename="LR-${tahun ?? new Date().getFullYear()}${bulan ? '-' + bulan : ''}.pdf"`
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(blob.size),
        'Content-Disposition': disposition,
      },
    })
  } catch {
    return internalError('Gagal generate PDF')
  }
}