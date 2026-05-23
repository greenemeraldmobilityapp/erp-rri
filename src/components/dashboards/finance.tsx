import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { ArapChart } from '@/components/arap-chart'
import { CashflowChart } from '@/components/cashflow-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, ReceiptText, DollarSign, ArrowRight, PieChart, Banknote, Receipt } from 'lucide-react'

const AGING_BUCKETS = [
  { label: '0-30', min: 0, max: 30 },
  { label: '31-60', min: 31, max: 60 },
  { label: '61-90', min: 61, max: 90 },
  { label: '>90', min: 91, max: Infinity },
]

function computeAging(
  items: Array<{ id: string; tanggal: string }>,
  totals: Record<string, number>,
) {
  const now = new Date()
  return AGING_BUCKETS.map(b => {
    const filtered = items.filter(i => {
      const d = Math.floor((now.getTime() - new Date(i.tanggal).getTime()) / (1000 * 60 * 60 * 24))
      return d >= b.min && d <= b.max
    })
    return { label: b.label, total: filtered.reduce((s, i) => s + (totals[i.id] ?? 0), 0) }
  })
}

function computeMonthly(
  items: Array<{ id: string; tanggal: string }>,
  totals: Record<string, number>,
  months: string[],
) {
  const map: Record<string, number> = {}
  for (const it of items) {
    const m = new Date(it.tanggal).toISOString().slice(0, 7)
    map[m] = (map[m] ?? 0) + (totals[it.id] ?? 0)
  }
  return months.map(m => ({ bulan: m, revenue: map[m] ?? 0 }))
}

function rupiah(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`
}

export default async function FinanceDashboard() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const sixMonths: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    sixMonths.push(d.toISOString().slice(0, 7))
  }
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

  // Parallel queries
  const [invoices, kwitansis, fakturPajaks, allPos, paidInvoices, confirmedPos] = await Promise.all([
    supabase.from('invoice').select('*').in('status', ['sent', 'partial', 'overdue']),
    supabase.from('kwitansi').select('*').gte('created_at', firstDay),
    supabase.from('faktur_pajak').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('purchase_order').select('*').in('status', ['sent', 'confirmed']).gte('tanggal', sixMonthsAgo),
    supabase.from('invoice').select('*').in('status', ['paid', 'sent', 'partial', 'overdue']).gte('tanggal', sixMonthsAgo),
    supabase.from('purchase_order').select('*').in('status', ['sent', 'confirmed']),
  ])

  // AR totals (existing)
  const invIds = (invoices.data ?? []).map(i => i.id)
  const { data: invItems } = invIds.length
    ? await supabase.from('invoice_item').select('invoice_id, harga, jumlah, diskon, ppn, pph').in('invoice_id', invIds)
    : { data: [] }
  const arTotals: Record<string, number> = {}
  for (const it of invItems ?? []) {
    const dpp = it.harga * it.jumlah - (it.diskon ?? 0)
    arTotals[it.invoice_id] = (arTotals[it.invoice_id] ?? 0) + dpp + (it.ppn ?? 0) - (it.pph ?? 0)
  }
  const totalPiutang = invIds.reduce((s, id) => s + (arTotals[id] ?? 0), 0)
  const piutangCount = invoices.data?.length ?? 0

  // AP count
  const totalHutang = (confirmedPos.data ?? []).length

  // AR aging for ringkasan
  const arAging = computeAging(invoices.data ?? [], arTotals)

  // AP aging for ringkasan
  const poIds = (allPos.data ?? []).map(p => p.id)
  const { data: poItems } = poIds.length
    ? await supabase.from('purchase_order_item').select('purchase_order_id, harga_satuan, jumlah').in('purchase_order_id', poIds)
    : { data: [] }
  const apTotals: Record<string, number> = {}
  for (const it of poItems ?? []) {
    apTotals[it.purchase_order_id] = (apTotals[it.purchase_order_id] ?? 0) + it.harga_satuan * it.jumlah
  }
  const apAging = computeAging(allPos.data ?? [], apTotals)

  // Cashflow: monthly revenue from invoices
  const paidIds = (paidInvoices.data ?? []).map(i => i.id)
  const { data: paidItems } = paidIds.length
    ? await supabase.from('invoice_item').select('invoice_id, harga, jumlah, diskon, ppn, pph').in('invoice_id', paidIds)
    : { data: [] }
  const revTotals: Record<string, number> = {}
  for (const it of paidItems ?? []) {
    const dpp = it.harga * it.jumlah - (it.diskon ?? 0)
    revTotals[it.invoice_id] = (revTotals[it.invoice_id] ?? 0) + dpp + (it.ppn ?? 0) - (it.pph ?? 0)
  }
  const monthlyRev = computeMonthly(paidInvoices.data ?? [], revTotals, sixMonths)

  // Cashflow: monthly expense from POs
  const poAllIds = (allPos.data ?? []).map(p => p.id)
  const { data: poAllItems } = poAllIds.length
    ? await supabase.from('purchase_order_item').select('purchase_order_id, harga_satuan, jumlah').in('purchase_order_id', poAllIds)
    : { data: [] }
  const expTotals: Record<string, number> = {}
  for (const it of poAllItems ?? []) {
    expTotals[it.purchase_order_id] = (expTotals[it.purchase_order_id] ?? 0) + it.harga_satuan * it.jumlah
  }
  const monthlyExp = computeMonthly(allPos.data ?? [], expTotals, sixMonths)

  const cashflowData = monthlyRev.map((r, i) => ({
    bulan: r.bulan,
    revenue: r.revenue,
    expense: monthlyExp[i]?.revenue ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">Dashboard Finance</h1><p className="text-muted-foreground mt-1">Keuangan & pembayaran</p></div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-emerald-600">Piutang (AR)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rupiah(totalPiutang)}</p>
            <p className="text-xs text-muted-foreground">{piutangCount} faktur outstanding</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-red-600">Hutang (AP)</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalHutang}</p>
            <p className="text-xs text-muted-foreground">PO belum lunas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Kwitansi Bulan Ini</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kwitansis.data?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">transaksi</p>
          </CardContent>
        </Card>
        <Card className={fakturPajaks.count && fakturPajaks.count > 0 ? 'border-amber-200' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Faktur Pajak Pending</CardTitle>
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fakturPajaks.count ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* AR/AP Ringkasan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ringkasan AR / AP — Aging</CardTitle>
        </CardHeader>
        <CardContent>
          <ArapChart ar={arAging} ap={apAging} />
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div className="space-y-1">
              <p className="font-medium text-emerald-600 text-xs uppercase tracking-wider">Piutang (AR)</p>
              {arAging.map(b => (
                <div key={b.label} className="flex justify-between">
                  <span className="text-muted-foreground">{b.label} hari</span>
                  <span className="font-medium">{rupiah(b.total)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <p className="font-medium text-red-600 text-xs uppercase tracking-wider">Hutang (AP)</p>
              {apAging.map(b => (
                <div key={b.label} className="flex justify-between">
                  <span className="text-muted-foreground">{b.label} hari</span>
                  <span className="font-medium">{rupiah(b.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cashflow Mini-Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arus Kas (6 Bulan)</CardTitle>
        </CardHeader>
        <CardContent>
          <CashflowChart data={cashflowData} />
        </CardContent>
      </Card>

      {/* Quick Access + Laporan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Akses Cepat</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { href: '/dashboard/invoice/tambah', label: 'Buat Invoice' },
              { href: '/dashboard/kwitansi/tambah', label: 'Buat Kwitansi' },
              { href: '/dashboard/faktur-pajak/tambah', label: 'Buat Faktur Pajak' },
              { href: '/dashboard/jurnal/tambah', label: 'Input Jurnal' },
            ].map(item => (
              <Button key={item.href} variant="outline" className="justify-start h-auto py-3" asChild>
                <Link href={item.href}><ArrowRight className="h-4 w-4 mr-2" />{item.label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Laporan</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { href: '/dashboard/laporan/ar-aging', label: 'AR Aging', icon: TrendingUp },
              { href: '/dashboard/laporan/ap-aging', label: 'AP Aging', icon: TrendingDown },
              { href: '/dashboard/laporan/laba-rugi', label: 'Laba/Rugi', icon: Banknote },
              { href: '/dashboard/laporan/neraca', label: 'Neraca', icon: PieChart },
              { href: '/dashboard/laporan/arus-kas', label: 'Arus Kas', icon: DollarSign },
            ].map(item => (
              <Button key={item.href} variant="ghost" className="justify-start h-auto py-2" asChild>
                <Link href={item.href}><item.icon className="h-4 w-4 mr-2" />{item.label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
