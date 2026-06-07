import { supabase } from '@/lib/db/client'
import { PageHeader } from '@/components/page-header'
import { PeriodFilter } from '@/components/period-filter'
import { formatDateTime } from '@/lib/utils/date'
import { ExportPdfButton } from '@/components/export-pdf-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
export const dynamic = 'force-dynamic'

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

export default async function PpnMasaPage({ searchParams }: { searchParams: Promise<{ tahun?: string; bulan?: string }> }) {
  const sp = await searchParams
  const period = makeDateRange(sp.tahun ?? null, sp.bulan ?? null)
  const prev = prevPeriod(sp.tahun ?? null, sp.bulan ?? null)

  const [{ data: invoices }, { data: poItems }] = await Promise.all([
    supabase.from('invoice').select('*, invoice_item!invoice_id(harga_satuan, jumlah, ppn)').in('status', ['paid', 'sent', 'lunas']).gte('tanggal', period.since).lte('tanggal', period.until),
    supabase.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status, tanggal)').gte('purchase_order.tanggal', period.since).lte('purchase_order.tanggal', period.until),
  ])

  const { data: prevInvoices } = await supabase.from('invoice').select('*, invoice_item!invoice_id(harga_satuan, jumlah, ppn)').in('status', ['paid', 'sent', 'lunas']).gte('tanggal', prev.since).lte('tanggal', prev.until)
  const { data: prevPoItems } = await supabase.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status, tanggal)').gte('purchase_order.tanggal', prev.since).lte('purchase_order.tanggal', prev.until)

  function calcPpnKeluaran(items: Array<Record<string, unknown>>): number {
    let total = 0
    for (const inv of items) {
      const invItems = (inv as { invoice_item?: Array<{ ppn: number | null }> }).invoice_item ?? []
      for (const it of invItems) {
        total += it.ppn ?? 0
      }
    }
    return total
  }

  function calcPpnMasukan(items: Array<Record<string, unknown>>): number {
    type PoRow = { purchase_order: { status: string; tanggal: string } | null; harga_satuan: number; jumlah: number }
    const typed = items as unknown as PoRow[]
    return typed.filter(i => i.purchase_order?.status !== 'draft').reduce((s, i) => s + i.harga_satuan * i.jumlah * 0.11, 0)
  }

  const ppnKeluaran = calcPpnKeluaran(invoices ?? [])
  const ppnMasukan = calcPpnMasukan(poItems ?? [])
  const kurangBayar = ppnKeluaran - ppnMasukan

  const prevKeluaran = calcPpnKeluaran(prevInvoices ?? [])
  const prevMasukan = calcPpnMasukan(prevPoItems ?? [])
  const prevKurangBayar = prevKeluaran - prevMasukan

  const buckets = buildMonthlyBuckets(period)
  const chartData = await Promise.all(buckets.map(async b => {
    const [r, c] = await Promise.all([
      supabase.from('invoice').select('*, invoice_item!invoice_id(harga_satuan, jumlah, ppn)').in('status', ['paid', 'sent', 'lunas']).gte('tanggal', b.since).lte('tanggal', b.until),
      supabase.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status)').gte('purchase_order.tanggal', b.since).lte('purchase_order.tanggal', b.until),
    ])
    const keluaran = calcPpnKeluaran(r.data ?? [])
    const masukan = calcPpnMasukan(c.data ?? [])
    return { label: b.label, keluaran, masukan, net: keluaran - masukan }
  }))

  const countLabel = sp.bulan ? `Bulan ${new Date(parseInt(sp.bulan ?? '1') - 1).toLocaleString('id', { month: 'long' })} ${sp.tahun ?? ''}` : `Tahun ${sp.tahun ?? new Date().getFullYear()}`

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="print:hidden">
        <PageHeader title="Laporan PPN Masa" description={`PPN Keluaran & Masukan — ${countLabel}`} actions={<div className="flex items-center gap-2"><PeriodFilter mode="monthly" /><ExportPdfButton hrefPrefix="/api/v1/laporan/ppn-masa/pdf" /></div>} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-accent">PPN Keluaran (Penjualan)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{rupiah(ppnKeluaran)}</p>
            <p className="text-xs text-muted-foreground">{invoices?.length ?? 0} invoice</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-warning">PPN Masukan (Pembelian)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{rupiah(ppnMasukan)}</p>
            <p className="text-xs text-muted-foreground">Estimasi 11% dari total pembelian</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className={`text-sm ${kurangBayar >= 0 ? 'text-success' : 'text-destructive'}`}>Kurang / Lebih Bayar</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${kurangBayar >= 0 ? 'text-success' : 'text-destructive'}`}>{kurangBayar >= 0 ? '(Kurang Bayar)' : '(Lebih Bayar)'} {rupiah(Math.abs(kurangBayar))}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Table */}
      <Card className="print:shadow-none print:border">
        <CardHeader><CardTitle className="text-base">Rincian Bulanan</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bulan</TableHead>
                  <TableHead className="text-right">PPN Keluaran</TableHead>
                  <TableHead className="text-right">PPN Masukan</TableHead>
                  <TableHead className="text-right">Kurang / Lebih Bayar</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((row) => {
                  const net = row.keluaran - row.masukan
                  return (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-right">{rupiah(row.keluaran)}</TableCell>
                      <TableCell className="text-right">{rupiah(row.masukan)}</TableCell>
                      <TableCell className={`text-right font-bold ${net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {rupiah(Math.abs(net))} {net >= 0 ? '(KB)' : '(LB)'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          net === 0 ? 'bg-success/10 text-success' :
                          net > 0 ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
                        }`}>
                          {net === 0 ? 'Nihil' : net > 0 ? 'Kurang Bayar' : 'Lebih Bayar'}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Rincian Setoran PPN</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b"><span className="font-medium">PPN Keluaran (Penjualan)</span><span className="font-bold text-blue-600">{rupiah(ppnKeluaran)}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="font-medium">PPN Masukan (Pembelian)</span><span className="font-bold text-amber-600">-{rupiah(ppnMasukan)}</span></div>
            <div className="flex justify-between py-2 text-lg border-t pt-2">
              <span className="font-bold">Kurang / Lebih Bayar</span>
              <span className={`font-bold ${kurangBayar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{rupiah(kurangBayar)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Perbandingan Periode Sebelumnya</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: 'PPN Keluaran', cur: ppnKeluaran, prev: prevKeluaran },
              { label: 'PPN Masukan', cur: ppnMasukan, prev: prevMasukan },
              { label: 'Kurang / Lebih Bayar', cur: kurangBayar, prev: prevKurangBayar },
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

      <div className="hidden print:block text-xs text-muted-foreground text-center pt-4 border-t mt-8">
        Dicetak pada {formatDateTime(new Date(), { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
