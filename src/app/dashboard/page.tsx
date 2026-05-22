import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Package, Users, Building2, Users2, FileText, ShoppingCart, DollarSign, ClipboardList, AlertTriangle, Clock, Bot, Receipt, Banknote, Truck } from 'lucide-react'
import ManagerDashboard from '@/components/dashboards/manager'
import SalesDashboard from '@/components/dashboards/sales'
import ProcurementDashboard from '@/components/dashboards/procurement'
import GudangDashboard from '@/components/dashboards/gudang'
import FinanceDashboard from '@/components/dashboards/finance'

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
type Stat = { label: string; value: string | number; icon: typeof Package; color?: string; subtitle?: string }

function StatCard({ label, value, icon: Icon, color, subtitle }: Stat) {
  return (
    <Card className={color ? `border-${color}-200` : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={`text-sm ${color ? `text-${color}-600` : 'text-muted-foreground'}`}>{label}</CardTitle>
        <Icon className={`h-4 w-4 ${color ? `text-${color}-600` : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString('id-ID') : value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
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

  const now = new Date(); const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    invoice, cust, karyawan,
    quotations, custPos, sos,
    pr, po, receiving, grns,
    kwitansis, poFinance, fakturPajaks,
    stoks, barangsStok, dos,
    recentQuotation, recentSO, recentInvoice, recentPO,
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
  ])

  const totalPiutang = (invoice.data ?? []).reduce((s: number, i) => s + ((i as { ppn_rate?: number }).ppn_rate ?? 0), 0)
  const totalStok = (stoks.data ?? []).reduce((s: number, i) => s + ((i as { jumlah: number }).jumlah ?? 0), 0)
  const lowStockItems = (stoks.data ?? []).filter((s: { jumlah: number }) => s.jumlah <= 0)
  const revenueBulanIni = (kwitansis.data ?? []).length
  const totalHutang = (poFinance.data ?? []).length
  const piutangCount = invoice.count ?? 0
  const prCount = pr.count ?? 0; const poCount = po.count ?? 0

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
        <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-600" />Revenue & Profit</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Revenue Bulan Ini" value={`Rp ${(revenueBulanIni * 1000000).toLocaleString('id-ID')}`} icon={TrendingUp} color="emerald" subtitle={`${revenueBulanIni} kwitansi`} />
          <StatCard label="Piutang (AR)" value={`Rp ${totalPiutang.toLocaleString('id-ID')}`} icon={Banknote} color="amber" subtitle={`${piutangCount} faktur outstanding`} />
          <StatCard label="Hutang (AP)" value={totalHutang} icon={TrendingDown} color="red" subtitle="PO belum lunas" />
          <StatCard label="Karyawan Aktif" value={karyawan.count ?? 0} icon={Users2} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-blue-600" />Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Quotation Terkirim" value={quotations.count ?? 0} icon={FileText} subtitle="Menunggu respon customer" />
          <StatCard label="PO Customer Deal" value={custPos.count ?? 0} icon={ShoppingCart} subtitle="Siap diproses" />
          <StatCard label="Sales Order Aktif" value={sos.count ?? 0} icon={DollarSign} color="blue" subtitle="Dalam proses" />
          <StatCard label="Customer" value={cust.count ?? 0} icon={Users} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2"><Package className="h-5 w-5 text-purple-600" />Procurement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="PR Aktif" value={prCount} icon={ClipboardList} color={prCount > 0 ? 'amber' : undefined} subtitle="Menunggu diproses" />
          <StatCard label="PO Terbuka" value={poCount} icon={FileText} color={poCount > 0 ? 'amber' : undefined} subtitle="Belum dikirim / dikonfirmasi" />
          <StatCard label="Pending Receiving" value={receiving.count ?? 0} icon={Package} color={(receiving.count ?? 0) > 0 ? 'amber' : undefined} />
          <StatCard label="Pending GRN" value={grns.count ?? 0} icon={ClipboardList} color={(grns.count ?? 0) > 0 ? 'amber' : undefined} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2"><Banknote className="h-5 w-5 text-emerald-600" />Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Barang" value={barangsStok.count ?? 0} icon={Package} />
          <StatCard label="Total Stok" value={totalStok.toLocaleString('id-ID')} icon={Building2} subtitle="Unit tersedia" />
          <StatCard label="Stok Kosong" value={lowStockItems.length} icon={AlertTriangle} color={lowStockItems.length > 0 ? 'red' : undefined} subtitle="Perlu re-stock" />
          <StatCard label="DO Pending" value={dos.count ?? 0} icon={Truck} color={(dos.count ?? 0) > 0 ? 'amber' : undefined} />
        </div>
      </section>

      {prCount > 0 || poCount > 0 || (fakturPajaks.count ?? 0) > 0 || lowStockItems.length > 0 ? (
        <section>
          <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5 text-red-600" />Butuh Tindakan</h2>
          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
              {prCount > 0 && <Button variant="outline" className="justify-start h-auto py-3 border-amber-200" asChild><Link href="/dashboard/purchase-request"><ClipboardList className="h-4 w-4 mr-2 text-amber-600" />{prCount} PR perlu diproses</Link></Button>}
              {poCount > 0 && <Button variant="outline" className="justify-start h-auto py-3 border-amber-200" asChild><Link href="/dashboard/purchase-order"><FileText className="h-4 w-4 mr-2 text-amber-600" />{poCount} PO perlu tindakan</Link></Button>}
              {(fakturPajaks.count ?? 0) > 0 && <Button variant="outline" className="justify-start h-auto py-3 border-amber-200" asChild><Link href="/dashboard/faktur-pajak"><Receipt className="h-4 w-4 mr-2 text-amber-600" />{fakturPajaks.count} Faktur Pajak perlu diterbitkan</Link></Button>}
              {lowStockItems.length > 0 && <Button variant="outline" className="justify-start h-auto py-3 border-red-200" asChild><Link href="/dashboard/inventory/stok"><AlertTriangle className="h-4 w-4 mr-2 text-red-600" />{lowStockItems.length} barang stok kosong</Link></Button>}
              {(dos.count ?? 0) > 0 && <Button variant="outline" className="justify-start h-auto py-3" asChild><Link href="/dashboard/delivery-order"><Package className="h-4 w-4 mr-2" />{dos.count} DO perlu dikirim</Link></Button>}
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
                  <span className={`text-xs px-1.5 py-0.5 rounded ${item.status === 'paid' || item.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : item.status === 'sent' || item.status === 'delivered' ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'}`}>{item.status}</span>
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
