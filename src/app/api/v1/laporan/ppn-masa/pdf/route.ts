/**
 * @openapi
 * /api/v1/laporan/ppn-masa/pdf:
 *   get:
 *     tags: [Laporan]
 *     summary: Cetak PDF laporan PPN Masa
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: PDF laporan PPN Masa
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { internalError } from '@/lib/api/errors'
import { PpnMasaPDF } from '@/lib/pdf/ppn-masa'

function makeDateRange(tahun: string | null, bulan: string | null): { since: string; until: string } {
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
    buckets.push({
      label: `${String(m).padStart(2, '0')}/${y}`,
      since: new Date(y, m - 1, 1).toISOString(),
      until: new Date(y, m, 0, 23, 59, 59).toISOString(),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return buckets
}

async function fetchInvoiceItems(since: string, until: string, statuses: string[] = ['paid', 'sent', 'lunas']) {
  const { data: invIds } = await supabaseAdmin.from('invoice').select('id').in('status', statuses).gte('tanggal', since).lte('tanggal', until)
  const ids = (invIds ?? []).map(inv => inv.id)
  if (!ids.length) return []
  const { data: items } = await supabaseAdmin.from('invoice_item').select('invoice_id, harga, jumlah, ppn').in('invoice_id', ids)
  return items ?? []
}

function calcPpnKeluaran(items: Array<{ ppn?: number | null }>): number {
  return items.reduce((total, it) => total + (it.ppn ?? 0), 0)
}

function calcPpnMasukan(items: Array<Record<string, unknown>>): number {
  type PoRow = { purchase_order: { status: string } | null; harga_satuan: number; jumlah: number }
  const typed = items as unknown as PoRow[]
  return typed.filter(i => i.purchase_order?.status !== 'draft').reduce((s, i) => s + i.harga_satuan * i.jumlah * 0.11, 0)
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const tahun = searchParams.get('tahun')
  const bulan = searchParams.get('bulan')
  const period = makeDateRange(tahun, bulan)

  const [invItems, { data: poItems }] = await Promise.all([
    fetchInvoiceItems(period.since, period.until),
    supabaseAdmin.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status, tanggal)').gte('purchase_order.tanggal', period.since).lte('purchase_order.tanggal', period.until),
  ])

  const ppnKeluaran = calcPpnKeluaran(invItems)
  const ppnMasukan = calcPpnMasukan(poItems ?? [])
  const kurangBayar = ppnKeluaran - ppnMasukan

  const buckets = buildMonthlyBuckets(period)
  const chartData = await Promise.all(buckets.map(async b => {
    const [r, c] = await Promise.all([
      fetchInvoiceItems(b.since, b.until),
      supabaseAdmin.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status)').gte('purchase_order.tanggal', b.since).lte('purchase_order.tanggal', b.until),
    ])
    const keluaran = calcPpnKeluaran(r)
    const masukan = calcPpnMasukan(c.data ?? [])
    return { label: b.label, keluaran, masukan, net: keluaran - masukan }
  }))

  try {
    const blob = await pdf(PpnMasaPDF({
      data: { tahun, bulan, ppnKeluaran, ppnMasukan, kurangBayar, monthly: chartData }
    })).toBlob()

    const y = tahun ?? String(new Date().getFullYear())
    const m = bulan ? `-${bulan}` : ''
    const disposition = searchParams.get('download') === '1'
      ? `attachment; filename="PPN-MASA-${y}${m}.pdf"`
      : `inline; filename="PPN-MASA-${y}${m}.pdf"`

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
