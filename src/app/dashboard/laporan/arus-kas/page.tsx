import { supabase } from '@/lib/db/client'
import { PageHeader } from '@/components/page-header'
import { PeriodFilter } from '@/components/period-filter'
import { formatDateTime } from '@/lib/utils/date'
import { ExportPdfButton } from '@/components/export-pdf-button'
import { CashflowChart } from '@/components/cashflow-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function rupiah(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`
}

function makeDateRange(tahun: string | null, bulan: string | null): { since: string; until: string } {
  const y = tahun ? parseInt(tahun) : new Date().getFullYear()
  if (bulan) {
    const m = parseInt(bulan)
    return { since: new Date(y, m - 1, 1).toISOString(), until: new Date(y, m, 0, 23, 59, 59).toISOString() }
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

type InvItem = { harga_satuan: number; jumlah: number; diskon: number | null; ppn: number | null; pph: number | null }
type PoItem = { harga_satuan: number; jumlah: number }

function calcRevenue(invoices: Array<{ invoice_item?: InvItem[] }>) {
  let total = 0
  for (const inv of invoices) {
    for (const it of inv.invoice_item ?? []) {
      total += it.harga_satuan * it.jumlah - (it.diskon ?? 0) + (it.ppn ?? 0) - (it.pph ?? 0)
    }
  }
  return total
}

function calcExpense(items: PoItem[]) {
  return items.reduce((s, i) => s + i.harga_satuan * i.jumlah, 0)
}

export default async function ArusKasPage({ searchParams }: { searchParams: Promise<{ tahun?: string; bulan?: string }> }) {
  const sp = await searchParams
  const period = makeDateRange(sp.tahun ?? null, sp.bulan ?? null)
  const prev = prevPeriod(sp.tahun ?? null, sp.bulan ?? null)

  const [curInvoices, curPoItems, prevInvoices, prevPoItems] = await Promise.all([
    supabase.from('invoice').select('*, invoice_item!invoice_id(harga_satuan, jumlah, diskon, ppn, pph)').in('status', ['paid', 'sent']).gte('tanggal', period.since).lte('tanggal', period.until),
    supabase.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status)').in('purchase_order.status', ['sent', 'received']).gte('purchase_order.tanggal', period.since).lte('purchase_order.tanggal', period.until),
    supabase.from('invoice').select('*, invoice_item!invoice_id(harga_satuan, jumlah, diskon, ppn, pph)').in('status', ['paid', 'sent']).gte('tanggal', prev.since).lte('tanggal', prev.until),
    supabase.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status)').in('purchase_order.status', ['sent', 'received']).gte('purchase_order.tanggal', prev.since).lte('purchase_order.tanggal', prev.until),
  ])

  const totalRevenue = calcRevenue(curInvoices.data ?? [])
  const totalExpense = calcExpense(curPoItems.data ?? [])
  const netCashflow = totalRevenue - totalExpense

  const prevRevenue = calcRevenue(prevInvoices.data ?? [])
  const prevExpense = calcExpense(prevPoItems.data ?? [])
  const prevNet = prevRevenue - prevExpense

  // Monthly chart data
  const buckets = buildMonthlyBuckets(period)
  const chartData = await Promise.all(buckets.map(async b => {
    const [r, e] = await Promise.all([
      supabase.from('invoice').select('*, invoice_item!invoice_id(harga_satuan, jumlah, diskon, ppn, pph)').in('status', ['paid', 'sent']).gte('tanggal', b.since).lte('tanggal', b.until),
      supabase.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status)').in('purchase_order.status', ['sent', 'received']).gte('purchase_order.tanggal', b.since).lte('purchase_order.tanggal', b.until),
    ])
    return {
      bulan: b.label,
      revenue: calcRevenue(r.data ?? []),
      expense: calcExpense(e.data ?? []),
    }
  }))

  // Overall totals for all-time buckets
  const allTimeRevenue = chartData.reduce((s, d) => s + d.revenue, 0)
  const allTimeExpense = chartData.reduce((s, d) => s + d.expense, 0)
  const allTimeNet = allTimeRevenue - allTimeExpense

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="print:hidden">
        <PageHeader title="Laporan Arus Kas" description="Cash flow statement" actions={<div className="flex items-center gap-2"><PeriodFilter mode="monthly" /><ExportPdfButton hrefPrefix="/api/v1/laporan/arus-kas/pdf" /></div>} />
      </div>

      {/* Chart */}
      <Card className="print:shadow-none print:border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Arus Kas per Bulan</CardTitle>
        </CardHeader>
        <CardContent>
          <CashflowChart data={chartData} />
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-600">Pemasukan</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rupiah(allTimeRevenue)}</p>
            <p className="text-xs text-muted-foreground">{curInvoices.data?.length ?? 0} invoice</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-red-600">Pengeluaran</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rupiah(allTimeExpense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className={`text-sm ${allTimeNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Arus Kas Bersih</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${allTimeNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{rupiah(allTimeNet)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detail + Comparative */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Rincian Arus Kas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b"><span className="font-medium">Pemasukan (Invoice)</span><span className="font-bold text-emerald-600">{rupiah(allTimeRevenue)}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="font-medium">Pengeluaran (PO)</span><span className="font-bold text-red-600">-{rupiah(allTimeExpense)}</span></div>
            <div className="flex justify-between py-2 text-lg border-t pt-2"><span className="font-bold">Arus Kas Bersih</span><span className={`font-bold ${allTimeNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{rupiah(allTimeNet)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Perbandingan Periode Sebelumnya</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: 'Pemasukan', cur: totalRevenue, prev: prevRevenue },
              { label: 'Pengeluaran', cur: totalExpense, prev: prevExpense },
              { label: 'Arus Kas Bersih', cur: netCashflow, prev: prevNet },
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
