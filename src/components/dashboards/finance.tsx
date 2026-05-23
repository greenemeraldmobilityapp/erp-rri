import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, ReceiptText, DollarSign, ArrowRight, PieChart, Banknote, Receipt } from 'lucide-react'

export default async function FinanceDashboard() {
  const now = new Date(); const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const [invoices, kwitansis, fakturPajaks] = await Promise.all([
    supabase.from('invoice').select('*').in('status', ['sent', 'partial', 'overdue']),
    supabase.from('kwitansi').select('*').gte('created_at', firstDay),
    supabase.from('faktur_pajak').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
  ])
  const invIds = (invoices.data ?? []).map(i => i.id)
  const { data: invItems } = invIds.length
    ? await supabase.from('invoice_item').select('invoice_id, harga, jumlah, diskon, ppn, pph').in('invoice_id', invIds)
    : { data: [] }
  const totalsById: Record<string, number> = {}
  for (const it of invItems ?? []) {
    const dpp = it.harga * it.jumlah - (it.diskon ?? 0)
    totalsById[it.invoice_id] = (totalsById[it.invoice_id] ?? 0) + dpp + (it.ppn ?? 0) - (it.pph ?? 0)
  }
  const totalPiutang = invIds.reduce((s, id) => s + (totalsById[id] ?? 0), 0)
  const { count: totalHutang } = await supabase.from('purchase_order').select('*', { count: 'exact', head: true }).in('status', ['sent', 'confirmed'])
  const revenueBulanIni = (kwitansis.data ?? []).length
  const piutangCount = invoices.data?.length ?? 0

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">Dashboard Finance</h1><p className="text-muted-foreground mt-1">Keuangan & pembayaran</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-200"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-emerald-600">Piutang (AR)</CardTitle><TrendingUp className="h-4 w-4 text-emerald-600" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">Rp {totalPiutang.toLocaleString('id-ID')}</p><p className="text-xs text-muted-foreground">{piutangCount} faktur outstanding</p></CardContent></Card>
        <Card className="border-red-200"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-red-600">Hutang (AP)</CardTitle><TrendingDown className="h-4 w-4 text-red-600" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalHutang}</p><p className="text-xs text-muted-foreground">PO belum lunas</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Kwitansi Bulan Ini</CardTitle><Receipt className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{revenueBulanIni}</p></CardContent></Card>
        <Card className={fakturPajaks.count && fakturPajaks.count > 0 ? 'border-amber-200' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Faktur Pajak Pending</CardTitle><ReceiptText className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fakturPajaks.count ?? 0}</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Akses Cepat</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2">
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
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Laporan</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2">
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
        </CardContent></Card>
      </div>
    </div>
  )
}
