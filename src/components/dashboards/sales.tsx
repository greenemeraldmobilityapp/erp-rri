import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Search, ShoppingCart, DollarSign, ArrowRight } from 'lucide-react'

export default async function SalesDashboard() {
  const [rfqs, quotations, custPos, sos] = await Promise.all([
    supabase.from('rfq').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
    supabase.from('quotation').select('*', { count: 'exact', head: true }).in('status', ['sent', 'approved']),
    supabase.from('customer_po').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('sales_order').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
  ])
  const [recentQuotations] = await Promise.all([
    supabase.from('quotation').select('id, nomor, tanggal, status').order('created_at', { ascending: false }).limit(5),
  ])

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">Dashboard Sales</h1><p className="text-muted-foreground mt-1">Pipeline penjualan & aktivitas</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">RFQ Masuk</CardTitle><Search className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{rfqs.count ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Quotation Terkirim</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{quotations.count ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">PO Customer Deal</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{custPos.count ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Sales Order Aktif</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{sos.count ?? 0}</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Quotation Terbaru</CardTitle></CardHeader><CardContent>
          {!recentQuotations.data?.length ? <p className="text-sm text-muted-foreground">Belum ada quotation.</p> :
          <div className="space-y-2">{(recentQuotations.data ?? []).map((q) => (
            <div key={q.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div><p className="text-sm font-medium">{q.nomor}</p><p className="text-xs text-muted-foreground">{new Date(q.tanggal).toLocaleDateString('id-ID')}</p></div>
              <span className="text-xs px-2 py-1 rounded bg-muted">{q.status}</span>
            </div>
          ))}</div>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Akses Cepat</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2">
          {[
            { href: '/dashboard/rfq/tambah', label: 'Buat RFQ' },
            { href: '/dashboard/quotation/tambah', label: 'Buat Quotation' },
            { href: '/dashboard/negoiasi/tambah', label: 'Negosiasi' },
            { href: '/dashboard/sales-order/tambah', label: 'Buat SO' },
            { href: '/dashboard/delivery-order/tambah', label: 'Buat DO' },
            { href: '/dashboard/customer-po/tambah', label: 'Input PO Customer' },
          ].map(item => (
            <Button key={item.href} variant="outline" className="justify-start h-auto py-3" asChild>
              <Link href={item.href}><ArrowRight className="h-4 w-4 mr-2" />{item.label}</Link>
            </Button>
          ))}
        </CardContent></Card>
      </div>
    </div>
  )
}
