import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileCheck, ClipboardList, ShoppingCart, FileText, Users, TrendingUp, DollarSign } from 'lucide-react'

export default async function ManagerDashboard() {
  const [pr, po, so, kontrak, invoices, karyawan] = await Promise.all([
    supabase.from('purchase_request').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('purchase_order').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('sales_order').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'processed']),
    supabase.from('kontrak').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('invoice').select('ppn_rate').in('status', ['sent', 'overdue']),
    supabase.from('karyawan').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])
  const totalPiutang = (invoices.data ?? []).reduce((s: number, i) => s + ((i as { ppn_rate?: number }).ppn_rate ?? 0), 0)

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">Dashboard Manager</h1><p className="text-muted-foreground mt-1">Overview operasional & approval</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={pr.count && pr.count > 0 ? 'border-amber-200' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">PR Pending Approval</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{pr.count ?? 0}</p></CardContent></Card>
        <Card className={po.count && po.count > 0 ? 'border-amber-200' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">PO Pending Approval</CardTitle><FileCheck className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{po.count ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Sales Order Aktif</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{so.count ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Kontrak Aktif</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{kontrak.count ?? 0}</p></CardContent></Card>
        <Card className="border-emerald-200"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-emerald-600">Piutang Outstanding</CardTitle><TrendingUp className="h-4 w-4 text-emerald-600" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">Rp {totalPiutang.toLocaleString('id-ID')}</p><p className="text-xs text-muted-foreground">{invoices.count ?? 0} faktur</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Karyawan Aktif</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{karyawan.count ?? 0}</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="text-base">Akses Cepat</CardTitle></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {[
          { href: '/dashboard/purchase-request', label: 'List PR', icon: ClipboardList },
          { href: '/dashboard/purchase-order', label: 'List PO', icon: FileCheck },
          { href: '/dashboard/laporan/laba-rugi', label: 'Laba/Rugi', icon: DollarSign },
          { href: '/dashboard/laporan/ar-aging', label: 'AR Aging', icon: TrendingUp },
          { href: '/dashboard/sales-order', label: 'Sales Order', icon: ShoppingCart },
          { href: '/dashboard/audit-log', label: 'Audit Trail', icon: Users },
        ].map(item => (
          <Button key={item.href} variant="outline" className="justify-start h-auto py-3" asChild>
            <Link href={item.href}><item.icon className="h-4 w-4 mr-2" />{item.label}</Link>
          </Button>
        ))}
      </CardContent></Card>
    </div>
  )
}
