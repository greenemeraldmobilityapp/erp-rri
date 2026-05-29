import { supabase } from '@/lib/db/client'
import { PageHeader } from '@/components/page-header'
import { PeriodFilter } from '@/components/period-filter'
import { formatDateTime } from '@/lib/utils/date'
import { ExportPdfButton } from '@/components/export-pdf-button'
import { LabaRugiChart } from '@/components/laba-rugi-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function rupiah(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`
}

function makeDateRange(tahun: string | null, bulan: string | null): { since: string; until: string } {
  const y = tahun ? parseInt(tahun) : new Date().getFullYear()
  if (bulan) {
    const m = parseInt(bulan)
    const since = new Date(y, m - 1, 1).toISOString()
    const until = new Date(y, m, 0, 23, 59, 59).toISOString()
    return { since, until }
  }
  return { since: new Date(y, 0, 1).toISOString(), until: new Date(y, 11, 31, 23, 59, 59).toISOString() }
}

function prevPeriod(tahun: string | null, bulan: string | null): { since: string; until: string } {
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
    buckets.push({
      label: `${String(m).padStart(2, '0')}/${y}`,
      since: new Date(y, m - 1, 1).toISOString(),
      until: new Date(y, m, 0, 23, 59, 59).toISOString(),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return buckets
}

export default async function LabaRugiPage({ searchParams }: { searchParams: Promise<{ tahun?: string; bulan?: string }> }) {
  const sp = await searchParams
  const period = makeDateRange(sp.tahun ?? null, sp.bulan ?? null)
  const prev = prevPeriod(sp.tahun ?? null, sp.bulan ?? null)

  const [{ data: invoices }, { data: poItems }] = await Promise.all([
    supabase.from('invoice').select('*, invoice_item!invoice_id(harga_satuan, jumlah, diskon, ppn, pph)').in('status', ['paid', 'sent']).gte('tanggal', period.since).lte('tanggal', period.until),
    supabase.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status, tanggal)').gte('purchase_order.tanggal', period.since).lte('purchase_order.tanggal', period.until),
  ])

  const { data: prevInvoices } = await supabase.from('invoice').select('*, invoice_item!invoice_id(harga_satuan, jumlah, diskon, ppn, pph)').in('status', ['paid', 'sent']).gte('tanggal', prev.since).lte('tanggal', prev.until)
  const { data: prevPoItems } = await supabase.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status, tanggal)').gte('purchase_order.tanggal', prev.since).lte('purchase_order.tanggal', prev.until)

  function calcRev(items: Array<Record<string, unknown>>): number {
    let total = 0
    for (const inv of items) {
      const invItems = (inv as { invoice_item?: Array<{ harga_satuan: number; jumlah: number; diskon: number | null; ppn: number | null; pph: number | null }> }).invoice_item ?? []
      for (const it of invItems) {
        total += it.harga_satuan * it.jumlah - (it.diskon ?? 0) + (it.ppn ?? 0) - (it.pph ?? 0)
      }
    }
    return total
  }

  function calcCogs(items: Array<Record<string, unknown>>): number {
    type PoRow = { purchase_order: { status: string; tanggal: string } | null; harga_satuan: number; jumlah: number }
    const typed = items as unknown as PoRow[]
    return typed.filter(i => i.purchase_order?.status !== 'draft').reduce((s, i) => s + i.harga_satuan * i.jumlah, 0)
  }

  const totalRevenue = calcRev(invoices ?? [])
  const totalCOGS = calcCogs(poItems ?? [])
  const grossProfit = totalRevenue - totalCOGS

  const prevRevenue = calcRev(prevInvoices ?? [])
  const prevCOGS = calcCogs(prevPoItems ?? [])
  const prevProfit = prevRevenue - prevCOGS

  // Monthly breakdown for chart
  const buckets = buildMonthlyBuckets(period)
  const chartData = await Promise.all(buckets.map(async b => {
    const [r, c] = await Promise.all([
      supabase.from('invoice').select('*, invoice_item!invoice_id(harga_satuan, jumlah, diskon, ppn, pph)').in('status', ['paid', 'sent']).gte('tanggal', b.since).lte('tanggal', b.until),
      supabase.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status)').gte('purchase_order.tanggal', b.since).lte('purchase_order.tanggal', b.until),
    ])
    return { label: b.label, revenue: calcRev(r.data ?? []), cogs: calcCogs(c.data ?? []) }
  }))

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="print:hidden">
        <PageHeader title="Laporan Laba / Rugi" description="Income statement" actions={<div className="flex items-center gap-2"><PeriodFilter mode="monthly" /><ExportPdfButton hrefPrefix="/api/v1/laporan/laba-rugi/pdf" /></div>} />
      </div>

      {/* Chart */}
      <Card className="print:shadow-none print:border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Revenue vs HPP</CardTitle>
        </CardHeader>
        <CardContent>
          <LabaRugiChart data={chartData} />
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-600">Pendapatan</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</p>
            <p className="text-xs text-muted-foreground">{invoices?.length ?? 0} invoice</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-red-600">HPP / Beban</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp {totalCOGS.toLocaleString('id-ID')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className={`text-sm ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Laba / Rugi Kotor</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Rp {grossProfit.toLocaleString('id-ID')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detail + Comparative */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Rincian</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b"><span className="font-medium">Pendapatan (Invoice)</span><span className="font-bold">{rupiah(totalRevenue)}</span></div>
            <div className="flex justify-between py-2 border-b text-red-600"><span className="font-medium">HPP (Pembelian)</span><span className="font-bold">-{rupiah(totalCOGS)}</span></div>
            <div className="flex justify-between py-2 text-lg border-t pt-2"><span className="font-bold">Laba / Rugi Kotor</span><span className={`font-bold ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{rupiah(grossProfit)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Perbandingan Periode Sebelumnya</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: 'Pendapatan', cur: totalRevenue, prev: prevRevenue },
              { label: 'HPP / Beban', cur: totalCOGS, prev: prevCOGS },
              { label: 'Laba / Rugi', cur: grossProfit, prev: prevProfit },
            ].map(item => {
              const diff = item.cur - item.prev
              const pct = item.prev ? ((diff / item.prev) * 100).toFixed(1) : '-'
              return (
                <div key={item.label} className="flex justify-between py-1.5 border-b last:border-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <div className="text-right">
                    <p className="font-medium">{rupiah(item.cur)}</p>
                    <p className={`text-xs ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {diff >= 0 ? '↑' : '↓'} {rupiah(Math.abs(diff))} ({pct}%)
                    </p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Print watermark */}
      <div className="hidden print:block text-xs text-muted-foreground text-center pt-4 border-t mt-8">
        Dicetak pada {formatDateTime(new Date(), { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
