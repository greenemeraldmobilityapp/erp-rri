import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList, FileCheck, Package, FileText, ArrowRight, Bot } from 'lucide-react'

export default async function ProcurementDashboard() {
  const [pr, po, receiving, grns] = await Promise.all([
    supabase.from('purchase_request').select('*', { count: 'exact', head: true }).neq('status', 'ordered'),
    supabase.from('purchase_order').select('*', { count: 'exact', head: true }).in('status', ['draft', 'sent']),
    supabase.from('purchase_receiving').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('grn').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
  ])

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">Dashboard Procurement</h1><p className="text-muted-foreground mt-1">Pembelian & pengadaan barang</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">PR Aktif</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{pr.count ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">PO Terbuka</CardTitle><FileCheck className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{po.count ?? 0}</p></CardContent></Card>
        <Card className={receiving.count && receiving.count > 0 ? 'border-amber-200' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Receiving</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{receiving.count ?? 0}</p></CardContent></Card>
        <Card className={grns.count && grns.count > 0 ? 'border-amber-200' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Pending GRN</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{grns.count ?? 0}</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="text-base">Akses Cepat</CardTitle></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {[
          { href: '/dashboard/purchase-request/tambah', label: 'Buat PR', icon: ClipboardList },
          { href: '/dashboard/purchase-order/tambah', label: 'Buat PO', icon: FileCheck },
          { href: '/dashboard/purchase-receiving/tambah', label: 'Input Receiving', icon: Package },
          { href: '/dashboard/grn/tambah', label: 'Input GRN', icon: FileText },
          { href: '/dashboard/ai/search-harga', label: 'AI Search Harga', icon: Bot },
          { href: '/dashboard/retur-pembelian/tambah', label: 'Retur Pembelian', icon: ArrowRight },
        ].map(item => (
          <Button key={item.href} variant="outline" className="justify-start h-auto py-3" asChild>
            <Link href={item.href}><item.icon className="h-4 w-4 mr-2" />{item.label}</Link>
          </Button>
        ))}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Modul</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2">
        {[
          { href: '/dashboard/master/supplier', label: 'Master Supplier' },
          { href: '/dashboard/purchase-order', label: 'List PO' },
          { href: '/dashboard/purchase-request', label: 'List PR' },
          { href: '/dashboard/ai/search-harga', label: 'AI Search' },
        ].map(item => (
          <Button key={item.href} variant="ghost" className="justify-start h-auto py-2" asChild>
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </CardContent></Card>
    </div>
  )
}
