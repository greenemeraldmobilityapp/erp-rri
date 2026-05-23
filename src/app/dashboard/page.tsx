import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Package, Users, Building2, Users2, FileText, ShoppingCart, DollarSign, ClipboardList, AlertTriangle, Clock, Bot, Receipt, Banknote, Truck, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import ManagerDashboard from '@/components/dashboards/manager'
import SalesDashboard from '@/components/dashboards/sales'
import ProcurementDashboard from '@/components/dashboards/procurement'
import GudangDashboard from '@/components/dashboards/gudang'
import FinanceDashboard from '@/components/dashboards/finance'
import { StatusBadge } from '@/components/status-badge'
import { RevenueChart } from '@/components/revenue-chart'

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
type Stat = { label: string; value: string | number; icon: typeof Package; color?: string; subtitle?: string; trend?: number; trendLabel?: string }

function StatCard({ label, value, icon: Icon, color, subtitle, trend, trendLabel }: Stat) {
  return (
    <Card className={color ? 'border-border' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={`text-sm ${color ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</CardTitle>
        <Icon className={`h-4 w-4 ${color ? 'text-foreground' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString('id-ID') : value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
              {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span>{Math.abs(trend).toFixed(1)}%</span>
              {trendLabel && <span className="text-muted-foreground font-normal ml-1">{trendLabel}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

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
    kwitansis, poFinance, fakturPajaks,
    stoks, barangsStok, dos,
    recentQuotation, recentSO, recentInvoice, recentPO,
    lastMonthKwitansis,
    sixMonthRevenue,
    rfq,
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
    supabase.from('faktur_pajak').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('stok').select('*'),
    supabase.from('barang').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('delivery_order').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('quotation').select('id, nomor, tanggal, status').order('created_at', { ascending: false }).limit(5),
    supabase.from('sales_order').select('id, nomor, tanggal, status').order('created_at', { ascending: false }).limit(5),
    supabase.from('invoice').select('id, nomor, tanggal, status').order('created_at', { ascending: false }).limit(5),
    supabase.from('purchase_order').select('id, nomor, tanggal, status').order('created_at', { ascending: false }).limit(5),
    supabase.from('kwitansi').select('*, total').gte('created_at', lastMonthFirstDay).lte('created_at', lastMonthLastDay),
    supabase.from('kwitansi').select('created_at, total').gte('created_at', sixMonthsAgo).order('created_at', { ascending: true }),
    supabase.from('rfq').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
  ])

  const totalPiutang = (invoice.data ?? []).reduce((s: number, i) => s + ((i as { ppn_rate?: number }).ppn_rate ?? 0), 0)
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
    ...(recentSO.data ?? []).map(s => ({ ...s, label: 'Sales Order', href: `/dashboard/sales-order/${s.id}/edit` })),
    ...(recentInvoice.data ?? []).map(i => ({ ...i, label: 'Invoice', href: `/dashboard/invoice/${i.id}/edit` })),
    ...(recentPO.data ?? []).map(p => ({ ...p, label: 'Purchase Order', href: `/dashboard/purchase-order/${p.id}/edit` })),
  ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Executive Command Center</h1>
          <p className="text-muted-foreground mt-1">Overview bisnis — {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild><a href="/api/v1/export?table=barang" target="_blank">Export Barang</a></Button>
          <Button variant="outline" size="sm" asChild><a href="/api/v1/export?table=invoice" target="_blank">Export Invoice</a></Button>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2"><DollarSign className="h-5 w-5 text-muted-foreground" />Revenue & Profit</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Revenue Bulan Ini" value={`Rp ${revenueBulanIni.toLocaleString('id-ID')}`} icon={TrendingUp} color="emerald" subtitle={`${(kwitansis.data ?? []).length} kwitansi`} trend={revenueTrend} trendLabel="vs last month" />
          <StatCard label="Piutang (AR)" value={`Rp ${totalPiutang.toLocaleString('id-ID')}`} icon={Banknote} color="amber" subtitle={`${piutangCount} faktur outstanding`} />
          <StatCard label="Hutang (AP)" value={totalHutang} icon={TrendingDown} color="red" subtitle="PO belum lunas" />
          <StatCard label="Karyawan Aktif" value={karyawan.count ?? 0} icon={Users2} />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-foreground">Revenue Trend</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-[60px]">
                <RevenueChart data={revenueChartData} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">6 bulan terakhir</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-muted-foreground" />Sales Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 rounded-lg border overflow-hidden">
          {[
            { label: 'Quotation', count: rfq.count ?? 0, sub: 'RFQ dikirim ke supplier', icon: FileText, bg: 'bg-muted' },
            { label: 'Quotation Diterima', count: quotations.count ?? 0, sub: 'Menunggu respon', icon: FileText, bg: 'bg-muted' },
            { label: 'PO Customer', count: custPos.count ?? 0, sub: 'Deal confirmed', icon: ShoppingCart, bg: 'bg-muted' },
            { label: 'Sales Order', count: sos.count ?? 0, sub: 'Dalam proses', icon: DollarSign, bg: 'bg-muted' },
          ].map((stage, i, arr) => (
            <div key={stage.label} className={`relative ${stage.bg} p-4 ${i < arr.length - 1 ? 'border-r border-border' : ''}`}>
              {i < arr.length - 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                  <div className="bg-background rounded-full p-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <stage.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{stage.label}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{stage.count}</p>
              <p className="text-xs text-muted-foreground mt-1">{stage.sub}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <StatCard label="Customer Aktif" value={cust.count ?? 0} icon={Users} subtitle="Total customer terdaftar" />
          <StatCard label="Piutang Outstanding" value={piutangCount} icon={Banknote} color="amber" subtitle="Faktur belum dibayar" />
          <StatCard label="Delivery Pending" value={dos.count ?? 0} icon={Truck} color="blue" subtitle="Siap dikirim" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2"><Package className="h-5 w-5 text-muted-foreground" />Procurement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="PR Aktif" value={prCount} icon={ClipboardList} color={prCount > 0 ? 'amber' : undefined} subtitle="Menunggu diproses" />
          <StatCard label="PO Terbuka" value={poCount} icon={FileText} color={poCount > 0 ? 'amber' : undefined} subtitle="Belum dikirim / dikonfirmasi" />
          <StatCard label="Pending Receiving" value={receiving.count ?? 0} icon={Package} color={(receiving.count ?? 0) > 0 ? 'amber' : undefined} />
          <StatCard label="Pending GRN" value={grns.count ?? 0} icon={ClipboardList} color={(grns.count ?? 0) > 0 ? 'amber' : undefined} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2"><Banknote className="h-5 w-5 text-muted-foreground" />Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Barang" value={barangsStok.count ?? 0} icon={Package} />
          <StatCard label="Total Stok" value={totalStok.toLocaleString('id-ID')} icon={Building2} subtitle="Unit tersedia" />
          <StatCard label="Stok Kosong" value={lowStockItems.length} icon={AlertTriangle} color={lowStockItems.length > 0 ? 'red' : undefined} subtitle="Perlu re-stock" />
          <StatCard label="DO Pending" value={dos.count ?? 0} icon={Truck} color={(dos.count ?? 0) > 0 ? 'amber' : undefined} />
        </div>
      </section>

      {prCount > 0 || poCount > 0 || (fakturPajaks.count ?? 0) > 0 || lowStockItems.length > 0 ? (
        <section>
          <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5 text-destructive" />Butuh Tindakan</h2>
          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
              {prCount > 0 && <Button variant="outline" className="justify-start h-auto py-3" asChild><Link href="/dashboard/purchase-request"><ClipboardList className="h-4 w-4 mr-2 text-warning" />{prCount} PR perlu diproses</Link></Button>}
              {poCount > 0 && <Button variant="outline" className="justify-start h-auto py-3" asChild><Link href="/dashboard/purchase-order"><FileText className="h-4 w-4 mr-2 text-warning" />{poCount} PO perlu tindakan</Link></Button>}
              {(fakturPajaks.count ?? 0) > 0 && <Button variant="outline" className="justify-start h-auto py-3" asChild><Link href="/dashboard/faktur-pajak"><Receipt className="h-4 w-4 mr-2 text-warning" />{fakturPajaks.count} Faktur Pajak perlu diterbitkan</Link></Button>}
              {lowStockItems.length > 0 && <Button variant="outline" className="justify-start h-auto py-3" asChild><Link href="/dashboard/inventory/stok"><AlertTriangle className="h-4 w-4 mr-2 text-destructive" />{lowStockItems.length} barang stok kosong</Link></Button>}
              {(dos.count ?? 0) > 0 && <Button variant="outline" className="justify-start h-auto py-3" asChild><Link href="/dashboard/delivery-order"><Package className="h-4 w-4 mr-2 text-muted-foreground" />{dos.count} DO perlu dikirim</Link></Button>}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />Aktivitas Terbaru</CardTitle></CardHeader>
          <CardContent>
            {!recentItems.length ? <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p> :
            <div className="space-y-1">{recentItems.map(item => (
              <Link key={item.id + item.label} href={item.href} className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted font-medium text-muted-foreground min-w-[7rem]">{item.label}</span>
                  <p className="text-sm font-medium">{item.nomor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{new Date(item.tanggal).toLocaleDateString('id-ID')}</span>
                  <StatusBadge status={item.status} />
                </div>
              </Link>
            ))}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Akses Cepat</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { href: '/dashboard/absensi/tambah', label: 'Input Absensi', icon: Users2 },
              { href: '/dashboard/penggajian/tambah', label: 'Input Gaji', icon: DollarSign },
              { href: '/dashboard/invoice/tambah', label: 'Buat Invoice', icon: Receipt },
              { href: '/dashboard/kwitansi/tambah', label: 'Buat Kwitansi', icon: Banknote },
              { href: '/dashboard/quotation/tambah', label: 'Buat Quotation', icon: FileText },
              { href: '/dashboard/purchase-order/tambah', label: 'Buat PO', icon: ShoppingCart },
              { href: '/dashboard/sales-order/tambah', label: 'Buat SO', icon: DollarSign },
              { href: '/dashboard/ai/search-harga', label: 'Search Harga', icon: Bot },
            ].map(item => (
              <Button key={item.href} variant="outline" className="justify-start h-auto py-3" asChild>
                <Link href={item.href}><item.icon className="h-4 w-4 mr-2" />{item.label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Modul</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { href: '/dashboard/master/barang', label: 'Master Barang' },
            { href: '/dashboard/master/supplier', label: 'Supplier' },
            { href: '/dashboard/master/customer', label: 'Customer' },
            { href: '/dashboard/master/karyawan', label: 'Karyawan' },
            { href: '/dashboard/laporan/laba-rugi', label: 'Laba/Rugi' },
            { href: '/dashboard/laporan/neraca', label: 'Neraca' },
            { href: '/dashboard/laporan/ar-aging', label: 'AR Aging' },
            { href: '/dashboard/laporan/arus-kas', label: 'Arus Kas' },
          ].map(item => (
            <Button key={item.href} variant="ghost" className="justify-start h-auto py-2" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
