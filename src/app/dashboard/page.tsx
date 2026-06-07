import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Package, Users, Building2, Users2, FileText, ShoppingCart, DollarSign, ClipboardList, AlertTriangle, Clock, Bot, Receipt, Banknote, Truck, Inbox, PieChart, TrendingUpIcon } from 'lucide-react'
import ManagerDashboard from '@/components/dashboards/manager'
import SalesDashboard from '@/components/dashboards/sales'
import ProcurementDashboard from '@/components/dashboards/procurement'
import GudangDashboard from '@/components/dashboards/gudang'
import FinanceDashboard from '@/components/dashboards/finance'
import { StatusBadge } from '@/components/status-badge'
import { StatCard } from '@/components/stat-card'
import { RevenueChartCard } from '@/components/revenue-chart-card'
import { ChartCard } from '@/components/chart-card'
import { SalesFunnelChart } from '@/components/sales-funnel-chart'
import { TopCustomersChart } from '@/components/top-customers-chart'
import { AgingChart } from '@/components/aging-chart'
import { StockCategoryChart } from '@/components/stock-category-chart'
import { LowStockChart } from '@/components/low-stock-chart'
import { RevenueMixChart } from '@/components/revenue-mix-chart'
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getUserRole(): Promise<string> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('sb-access-token')?.value
    if (!token) return 'owner'
    const sb = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: { user } } = await sb.auth.getUser(token)
    if (!user?.id) return 'owner'
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
    return (data as { role: string } | null)?.role ?? 'owner'
  } catch {
    return 'owner'
  }
}

type RecentItem = { id: string; nomor: string; tanggal: string; status: string; label: string; href: string }

export default async function DashboardPage() {
  const role = await getUserRole()

  if (role === 'sales') return <SalesDashboard />
  if (role === 'procurement') return <ProcurementDashboard />
  if (role === 'gudang') return <GudangDashboard />
  if (role === 'finance') return <FinanceDashboard />
  if (role === 'manager') return <ManagerDashboard />

  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthFirstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

  const [
    invoice, cust, karyawan,
    quotations, custPos, sos,
    pr, po, receiving, grns,
    kwitansis, poFinance,
    stoks, barangsStok, dos,
    recentQuotation, recentSO, recentInvoice, recentPO,
    lastMonthKwitansis,
    sixMonthRevenue,
    rfqCustomer,
    invoiceItems, customersData, kategoriBarang, stokDetail, barangDetail,
    allInvoices,
  ] = await Promise.all([
    supabase.from('invoice').select('*').in('status', ['sent', 'overdue']),
    supabase.from('customer').select('*', { count: 'exact', head: true }),
    supabase.from('karyawan').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('quotation').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
    supabase.from('customer_po').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('sales_order').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'processed']),
    supabase.from('purchase_request').select('*', { count: 'exact', head: true }).neq('status', 'ordered'),
    supabase.from('purchase_order').select('*', { count: 'exact', head: true }).in('status', ['draft', 'sent']),
    supabase.from('purchase_receiving').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('grn').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('kwitansi').select('*').gte('created_at', firstDay),
    supabase.from('purchase_order').select('*').in('status', ['sent', 'confirmed']),
    supabase.from('stok').select('*'),
    supabase.from('barang').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('delivery_order').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('quotation').select('id, nomor, tanggal, status').order('created_at', { ascending: false }).limit(5),
    supabase.from('sales_order').select('id, nomor, tanggal, status').order('created_at', { ascending: false }).limit(5),
    supabase.from('invoice').select('id, nomor, tanggal, status').order('created_at', { ascending: false }).limit(5),
    supabase.from('purchase_order').select('id, nomor, tanggal, status').order('created_at', { ascending: false }).limit(5),
    supabase.from('kwitansi').select('*, total').gte('created_at', lastMonthFirstDay).lte('created_at', lastMonthLastDay),
    supabase.from('kwitansi').select('created_at, total').gte('created_at', sixMonthsAgo).order('created_at', { ascending: true }),
    supabase.from('rfq_customer').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
    supabase.from('invoice_item').select('invoice_id, barang_id, harga_satuan, jumlah, diskon'),
    supabase.from('customer').select('id, nama'),
    supabase.from('kategori_barang').select('id, nama'),
    supabase.from('stok').select('barang_id, jumlah'),
    supabase.from('barang').select('id, nama, kategori_id'),
    supabase.from('invoice').select('id, tanggal, status, customer_id').in('status', ['sent', 'paid', 'partial', 'overdue']),
  ])

  const invData = (Array.isArray(invoiceItems.data) ? invoiceItems.data : []) as { invoice_id: string; barang_id: string; harga_satuan: number; jumlah: number; diskon?: number }[]
  const invTotalsByInvoice: Record<string, number> = {}
  for (const it of invData) {
    invTotalsByInvoice[it.invoice_id] = (invTotalsByInvoice[it.invoice_id] ?? 0) + (it.harga_satuan * it.jumlah - (it.diskon ?? 0))
  }
  const totalPiutang = (invoice.data ?? []).reduce((s: number, i) => s + (invTotalsByInvoice[i.id] ?? 0), 0)
  const totalStok = (stoks.data ?? []).reduce((s: number, i) => s + ((i as { jumlah: number }).jumlah ?? 0), 0)
  const lowStockItems = (stoks.data ?? []).filter((s: { jumlah: number }) => s.jumlah <= 0)
  const revenueBulanIni = (kwitansis.data ?? []).reduce((s: number, k) => s + ((k as { total?: number }).total ?? 0), 0)
  const revenueLastMonth = (lastMonthKwitansis.data ?? []).reduce((s: number, k) => s + ((k as { total?: number }).total ?? 0), 0)
  const revenueTrend = revenueLastMonth > 0 ? ((revenueBulanIni - revenueLastMonth) / revenueLastMonth) * 100 : revenueBulanIni > 0 ? 100 : 0
  const piutangCount = invoice.count ?? 0
  const prCount = pr.count ?? 0; const poCount = po.count ?? 0
  const totalHutang = (poFinance.data ?? []).length

  const revenueChartData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - 5 + i + 1, 0)
    const monthLabel = monthDate.toLocaleDateString('id-ID', { month: 'short' })
    const monthTotal = (sixMonthRevenue.data ?? []).filter((k: { created_at: string; total?: number }) => {
      const d = new Date(k.created_at)
      return d >= monthDate && d <= monthEnd
    }).reduce((s: number, k: { total?: number }) => s + (k.total ?? 0), 0)
    return { month: monthLabel, revenue: monthTotal }
  })

  const recentItems: RecentItem[] = [
    ...(recentQuotation.data ?? []).map(q => ({ ...q, label: 'Quotation', href: `/dashboard/quotation/${q.id}/edit` })),
    ...(recentSO.data ?? []).map(s => ({ ...s, label: 'Sales Order', href: `/dashboard/sales-order/${s.id}` })),
    ...(recentInvoice.data ?? []).map(i => ({ ...i, label: 'Invoice', href: `/dashboard/invoice/${i.id}/edit` })),
    ...(recentPO.data ?? []).map(p => ({ ...p, label: 'Purchase Order', href: `/dashboard/purchase-order/${p.id}/edit` })),
  ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 8)

  // Sales funnel
  const funnelData = [
    { stage: 'Quotation\nDikirim', count: quotations.count ?? 0, fill: 'var(--info)' },
    { stage: 'PO Customer\nDeal', count: custPos.count ?? 0, fill: 'var(--primary)' },
    { stage: 'Sales Order\nAktif', count: sos.count ?? 0, fill: 'var(--success)' },
    { stage: 'DO\nPending', count: dos.count ?? 0, fill: 'var(--warning)' },
  ]

  // Top customers by revenue
  const allInvData = (Array.isArray(allInvoices.data) ? allInvoices.data : []) as { id: string; customer_id: string; tanggal: string; status: string }[]
  const custMap = new Map((customersData.data ?? []).map((c: { id: string; nama: string }) => [c.id, c.nama]))
  const custRevenue: Record<string, number> = {}
  for (const inv of allInvData) {
    if (inv.customer_id) {
      custRevenue[inv.customer_id] = (custRevenue[inv.customer_id] ?? 0) + (invTotalsByInvoice[inv.id] ?? 0)
    }
  }
  const topCustomersData = Object.entries(custRevenue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, revenue]) => ({ name: custMap.get(id) || '-', revenue }))

  // AR Aging
  const arTotals: Record<string, number> = {}
  for (const inv of invoice.data ?? []) {
    arTotals[inv.id] = invTotalsByInvoice[inv.id] ?? 0
  }
  const AGING_BUCKETS = [
    { label: '0-30 hari', min: 0, max: 30 },
    { label: '31-60 hari', min: 31, max: 60 },
    { label: '61-90 hari', min: 61, max: 90 },
    { label: '>90 hari', min: 91, max: Infinity },
  ]
  const agingData = AGING_BUCKETS.map(b => {
    const filtered = (invoice.data ?? []).filter((i: { tanggal: string }) => {
      const d = Math.floor((now.getTime() - new Date(i.tanggal).getTime()) / (1000 * 60 * 60 * 24))
      return d >= b.min && d <= b.max
    })
    return { label: b.label, total: filtered.reduce((s: number, i: { id: string }) => s + (arTotals[i.id] ?? 0), 0) }
  })

  // Stock by category
  const stokData = (Array.isArray(stokDetail.data) ? stokDetail.data : []) as { barang_id: string; jumlah: number }[]
  const barangData = (Array.isArray(barangDetail.data) ? barangDetail.data : []) as { id: string; nama: string; kategori_id: string }[]
  const kategoriMap = new Map((kategoriBarang.data ?? []).map((k: { id: string; nama: string }) => [k.id, k.nama]))
  const barangKategoriMap = new Map(barangData.map(b => [b.id, b.kategori_id]))
  const stokByKat: Record<string, number> = {}
  for (const s of stokData) {
    const katId = barangKategoriMap.get(s.barang_id) || ''
    stokByKat[katId] = (stokByKat[katId] ?? 0) + (s.jumlah ?? 0)
  }
  const stockCategoryData = Object.entries(stokByKat)
    .map(([id, value]) => ({ name: kategoriMap.get(id) || 'Tanpa Kategori', value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Low stock ranking
  const barangNamaMap = new Map(barangData.map(b => [b.id, b.nama]))
  const lowStockChartData = stokData
    .filter(s => s.jumlah <= 5)
    .sort((a, b) => a.jumlah - b.jumlah)
    .slice(0, 10)
    .map(s => ({ name: barangNamaMap.get(s.barang_id) || '-', stock: s.jumlah }))

  // Revenue mix by category
  const revenueByKat: Record<string, number> = {}
  for (const inv of allInvData) {
    const items = (invoiceItems.data ?? []).filter((it: { invoice_id: string }) => it.invoice_id === inv.id)
    for (const item of (Array.isArray(items) ? items : []) as Array<{ invoice_id: string; barang_id: string; harga_satuan: number; jumlah: number; diskon?: number }>) {
      const katId = barangKategoriMap.get(item.barang_id) || ''
      revenueByKat[katId] = (revenueByKat[katId] ?? 0) + (item.harga_satuan * item.jumlah - (item.diskon ?? 0))
    }
  }
  const revenueMixData = Object.entries(revenueByKat)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([id, value]) => ({ name: kategoriMap.get(id) || 'Tanpa Kategori', value }))

  return (
    <div className="space-y-6">

      <section>
         <h2 className="text-lg font-heading font-semibold tracking-tight mb-3 flex items-center gap-2"><DollarSign className="h-5 w-5 text-muted-foreground" />Revenue & Profit</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Revenue Bulan Ini" value={`Rp ${revenueBulanIni.toLocaleString('id-ID')}`} icon={TrendingUp} iconVariant="success" subtitle={`${(kwitansis.data ?? []).length} kwitansi`} trend={revenueTrend} trendLabel="vs last month" />
            <StatCard label="Piutang (AR)" value={`Rp ${totalPiutang.toLocaleString('id-ID')}`} icon={Banknote} iconVariant="warning" subtitle={`${piutangCount} faktur outstanding`} />
            <StatCard label="Hutang (AP)" value={totalHutang} icon={TrendingDown} iconVariant="destructive" subtitle="PO belum lunas" />
            <StatCard label="Karyawan Aktif" value={karyawan.count ?? 0} icon={Users2} iconVariant="info" />
            <RevenueChartCard data={revenueChartData} />
         </div>
      </section>

      <section>
         <h2 className="text-lg font-heading font-semibold tracking-tight mb-3 flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-muted-foreground" />Sales Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'RFQ Customer', count: rfqCustomer.count ?? 0, sub: 'Permintaan dari customer', icon: FileText, variant: 'primary' as const },
            { label: 'Quot. Diterima', count: quotations.count ?? 0, sub: 'Menunggu respon', icon: FileText, variant: 'info' as const },
            { label: 'PO Customer', count: custPos.count ?? 0, sub: 'Deal confirmed', icon: ShoppingCart, variant: 'success' as const },
            { label: 'Sales Order', count: sos.count ?? 0, sub: 'Dalam proses', icon: DollarSign, variant: 'success' as const },
          ].map(stage => {
            const colors = {
              primary: { container: 'bg-primary/20', icon: 'text-primary' },
              info: { container: 'bg-sky-500/20', icon: 'text-sky-500' },
              success: { container: 'bg-success/20', icon: 'text-success' },
            }[stage.variant]
            return (
              <div key={stage.label} className="rounded-2xl bg-white dark:bg-primary/10 dark:backdrop-blur-sm border border-primary/10 dark:border-primary/20 p-4 hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(0,0,255,0.08)] dark:hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">{stage.label}</span>
                  <div className={`${colors.container} p-2 rounded-lg`}>
                    <stage.icon className={`h-4 w-4 ${colors.icon}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold font-heading tracking-tight text-primary">{stage.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{stage.sub}</p>
              </div>
            )
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <StatCard label="Customer Aktif" value={cust.count ?? 0} icon={Users} iconVariant="info" subtitle="Total customer terdaftar" />
            <StatCard label="Piutang Outstanding" value={piutangCount} icon={Banknote} iconVariant="warning" subtitle="Faktur belum dibayar" />
           <StatCard label="Delivery Pending" value={dos.count ?? 0} icon={Truck} subtitle="Siap dikirim" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-heading font-semibold tracking-tight mb-3 flex items-center gap-2"><TrendingUpIcon className="h-5 w-5 text-muted-foreground" />Sales Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="Sales Pipeline Funnel" icon={TrendingUp} iconVariant="primary" subtitle="Konversi penjualan per tahap">
            <SalesFunnelChart data={funnelData} />
          </ChartCard>
          <ChartCard title="Top 5 Customers" icon={Users} iconVariant="info" subtitle="Berdasarkan total revenue">
            {topCustomersData.length > 0 ? <TopCustomersChart data={topCustomersData} /> : <p className="text-sm text-muted-foreground text-center py-8">Belum ada data transaksi.</p>}
          </ChartCard>
          <ChartCard title="AR Aging" icon={Banknote} iconVariant="warning" subtitle="Piutang berdasarkan umur">
            {agingData.some(d => d.total > 0) ? <AgingChart data={agingData} formatCurrency /> : <p className="text-sm text-muted-foreground text-center py-8">Tidak ada piutang.</p>}
          </ChartCard>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-heading font-semibold tracking-tight mb-3 flex items-center gap-2"><PieChart className="h-5 w-5 text-muted-foreground" />Revenue Mix</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Revenue per Kategori Barang" icon={PieChart} iconVariant="success" subtitle="Distribusi pendapatan">
            {revenueMixData.some(d => d.value > 0) ? <RevenueMixChart data={revenueMixData} /> : <p className="text-sm text-muted-foreground text-center py-8">Belum ada data.</p>}
          </ChartCard>
          <ChartCard title="Komposisi Stok per Kategori" icon={Building2} iconVariant="info" subtitle="Distribusi unit stok">
            {stockCategoryData.length > 0 ? <StockCategoryChart data={stockCategoryData} /> : <p className="text-sm text-muted-foreground text-center py-8">Belum ada data stok.</p>}
          </ChartCard>
        </div>
      </section>

      <section>
         <h2 className="text-lg font-heading font-semibold tracking-tight mb-3 flex items-center gap-2"><Package className="h-5 w-5 text-muted-foreground" />Procurement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="PR Aktif" value={prCount} icon={ClipboardList} iconVariant="warning" subtitle="Menunggu diproses" />
          <StatCard label="PO Terbuka" value={poCount} icon={FileText} iconVariant="warning" subtitle="Belum dikirim / dikonfirmasi" />
          <StatCard label="Pending Receiving" value={receiving.count ?? 0} icon={Package} iconVariant="warning" />
          <StatCard label="Pending GRN" value={grns.count ?? 0} icon={ClipboardList} iconVariant="warning" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-heading font-semibold tracking-tight mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-muted-foreground" />Inventory Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Peringkat Stok Menipis" icon={AlertTriangle} iconVariant="destructive" subtitle="Barang dengan stok paling rendah">
            {lowStockChartData.length > 0 ? <LowStockChart data={lowStockChartData} /> : <p className="text-sm text-muted-foreground text-center py-8">Semua stok aman.</p>}
          </ChartCard>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Barang" value={barangsStok.count ?? 0} icon={Package} iconVariant="info" />
            <StatCard label="Total Stok" value={totalStok.toLocaleString('id-ID')} icon={Building2} iconVariant="info" subtitle="Unit tersedia" />
             <StatCard label="Stok Kosong" value={lowStockItems.length} icon={AlertTriangle} iconVariant="destructive" subtitle="Perlu re-stock" />
            <StatCard label="DO Pending" value={dos.count ?? 0} icon={Truck} />
          </div>
        </div>
      </section>

      {prCount > 0 || poCount > 0 || lowStockItems.length > 0 ? (
        <section>
          <h2 className="text-lg font-heading font-semibold tracking-tight mb-3 flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5 text-destructive" />Butuh Tindakan</h2>
          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
               {prCount > 0 && <Button variant="default" className="justify-start h-auto py-3 bg-gradient-to-b from-[#0000FF] to-[#0000D9] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.1)] hover:opacity-95 transition-all duration-200" asChild><Link href="/dashboard/purchase-request"><ClipboardList className="h-4 w-4 mr-2" />{prCount} PR perlu diproses</Link></Button>}
               {poCount > 0 && <Button variant="default" className="justify-start h-auto py-3 bg-gradient-to-b from-[#0000FF] to-[#0000D9] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.1)] hover:opacity-95 transition-all duration-200" asChild><Link href="/dashboard/purchase-order"><FileText className="h-4 w-4 mr-2" />{poCount} PO perlu tindakan</Link></Button>}
               {lowStockItems.length > 0 && <Button variant="destructive" className="justify-start h-auto py-3 transition-all duration-200" asChild><Link href="/dashboard/inventory/stok"><AlertTriangle className="h-4 w-4 mr-2" />{lowStockItems.length} barang stok kosong</Link></Button>}
               {(dos.count ?? 0) > 0 && <Button variant="outline" className="justify-start h-auto py-3 transition-all duration-200" asChild><Link href="/dashboard/delivery-order"><Package className="h-4 w-4 mr-2" />{dos.count} DO perlu dikirim</Link></Button>}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white dark:bg-primary/10 dark:backdrop-blur-sm border border-primary/10 dark:border-primary/20">
          <div className="flex items-center justify-between px-6 pt-6 pb-0">
            <p className="text-sm font-semibold uppercase tracking-wider text-foreground">Aktivitas Terbaru</p>
            <div className="bg-primary/20 p-3 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="p-6 pt-4">
             {!recentItems.length ? (
               <div className="text-center py-12">
                 <Inbox className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                 <p className="text-sm font-medium text-muted-foreground">Belum ada aktivitas terkini</p>
               </div>
             ) :
             <div className="space-y-1">{recentItems.map(item => {
               const docIcons: Record<string, typeof FileText> = {
                 Quotation: FileText,
                 'Sales Order': DollarSign,
                 Invoice: Receipt,
                 'Purchase Order': Package,
               }
               const DocIcon = docIcons[item.label] || FileText
               return (
                <Link key={item.id + item.label} href={item.href} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-primary/5 hover:scale-[1.01] transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <DocIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.nomor}</p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{new Date(item.tanggal).toLocaleDateString('id-ID')}</span>
                    <StatusBadge status={item.status} />
                  </div>
                </Link>
              )
             })}</div>}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-primary/10 dark:backdrop-blur-sm border border-primary/10 dark:border-primary/20">
          <div className="flex items-center justify-between px-6 pt-6 pb-0">
            <p className="text-sm font-semibold uppercase tracking-wider text-foreground">Akses Cepat</p>
            <div className="bg-primary/20 p-3 rounded-lg">
              <Bot className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="p-6 pt-4 space-y-4">
            {[
              {
                category: 'HR & Kepegawaian',
                items: [
                  { href: '/dashboard/absensi/tambah', label: 'Input Absensi', icon: Users2 },
                  { href: '/dashboard/penggajian/tambah', label: 'Input Gaji', icon: DollarSign },
                ],
              },
              {
                category: 'Finance',
                items: [
                  { href: '/dashboard/invoice/tambah', label: 'Buat Invoice', icon: Receipt },
                  { href: '/dashboard/kwitansi/tambah', label: 'Buat Kwitansi', icon: Banknote },
                ],
              },
              {
                category: 'Sales & Procurement',
                items: [
                  { href: '/dashboard/quotation/tambah', label: 'Buat Quotation', icon: FileText },
                  { href: '/dashboard/purchase-order/tambah', label: 'Buat PO', icon: ShoppingCart },
                  { href: '/dashboard/sales-order/tambah', label: 'Buat SO', icon: DollarSign },
                  { href: '/dashboard/ai/search-harga', label: 'Search Harga', icon: Bot },
                ],
              },
            ].map(group => (
              <div key={group.category}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{group.category}</p>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map(item => (
                    <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl bg-white dark:bg-primary/5 border border-primary/10 dark:border-primary/20 p-3 hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(0,0,255,0.06)] dark:hover:shadow-xl transition-all duration-200">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-primary/10 dark:backdrop-blur-sm border border-primary/10 dark:border-primary/20">
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <p className="text-sm font-semibold uppercase tracking-wider text-foreground">Modul</p>
          <div className="bg-primary/20 p-3 rounded-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="p-6 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/dashboard/master/barang', label: 'Master Barang', icon: Package, variant: 'info' as const },
              { href: '/dashboard/master/supplier', label: 'Supplier', icon: Building2, variant: 'info' as const },
              { href: '/dashboard/master/customer', label: 'Customer', icon: Users, variant: 'info' as const },
              { href: '/dashboard/master/karyawan', label: 'Karyawan', icon: Users2, variant: 'info' as const },
              { href: '/dashboard/laporan/laba-rugi', label: 'Laba/Rugi', icon: TrendingUp, variant: 'success' as const },
              { href: '/dashboard/laporan/neraca', label: 'Neraca', icon: PieChart, variant: 'warning' as const },
              { href: '/dashboard/laporan/ar-aging', label: 'AR Aging', icon: Clock, variant: 'warning' as const },
              { href: '/dashboard/laporan/arus-kas', label: 'Arus Kas', icon: DollarSign, variant: 'success' as const },
            ].map(modul => {
              const colors = {
                info: { container: 'bg-primary/10', icon: 'text-primary' },
                success: { container: 'bg-success/10', icon: 'text-success' },
                warning: { container: 'bg-warning/10', icon: 'text-warning' },
              }[modul.variant]
              return (
                <Link key={modul.href} href={modul.href} className="flex items-center gap-3 rounded-xl bg-white dark:bg-primary/5 border border-primary/10 dark:border-primary/20 p-3 hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(0,0,255,0.06)] dark:hover:shadow-xl transition-all duration-200">
                  <div className={`${colors.container} p-2 rounded-lg`}>
                    <modul.icon className={`h-4 w-4 ${colors.icon}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{modul.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
