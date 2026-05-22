import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, AlertTriangle, Building2, ArrowRight, ClipboardList } from 'lucide-react'

export default async function GudangDashboard() {
  const gudangData = await Promise.all([
    supabase.from('barang').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('stok').select('*'),
    supabase.from('delivery_order').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
  ])
  const barangs = gudangData[0]; const stoks = gudangData[1]
  const totalStok = (stoks.data ?? []).reduce((s: number, i) => s + ((i as { jumlah: number }).jumlah ?? 0), 0)
  const lowStockItems = (stoks.data ?? []).filter((s: { jumlah: number }) => s.jumlah <= 0)

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">Dashboard Gudang</h1><p className="text-muted-foreground mt-1">Inventaris & pergerakan stok</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Total Barang</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{barangs.count ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Total Stok</CardTitle><Building2 className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalStok.toLocaleString('id-ID')}</p></CardContent></Card>
        <Card className={lowStockItems.length > 0 ? 'border-red-200' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className={`text-sm ${lowStockItems.length > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>Stok Kosong</CardTitle><AlertTriangle className={`h-4 w-4 ${lowStockItems.length > 0 ? 'text-red-600' : 'text-muted-foreground'}`} /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{lowStockItems.length}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">DO Pending</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{gudangData[2].count ?? 0}</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Akses Cepat</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2">
          {[
            { href: '/dashboard/inventory/stok/masuk', label: 'Stok Masuk' },
            { href: '/dashboard/inventory/stok/keluar', label: 'Stok Keluar' },
            { href: '/dashboard/inventory/stok', label: 'Kartu Stok' },
            { href: '/dashboard/inventory/gudang', label: 'Master Gudang' },
            { href: '/dashboard/delivery-order', label: 'List DO' },
            { href: '/dashboard/delivery-order/tambah', label: 'Buat DO' },
          ].map(item => (
            <Button key={item.href} variant="outline" className="justify-start h-auto py-3" asChild>
              <Link href={item.href}><ArrowRight className="h-4 w-4 mr-2" />{item.label}</Link>
            </Button>
          ))}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Modul</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2">
          {[
            { href: '/dashboard/master/barang', label: 'Master Barang' },
            { href: '/dashboard/inventory/gudang', label: 'Gudang' },
            { href: '/dashboard/purchase-receiving', label: 'Penerimaan' },
            { href: '/dashboard/grn', label: 'GRN' },
          ].map(item => (
            <Button key={item.href} variant="ghost" className="justify-start h-auto py-2" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </CardContent></Card>
      </div>
    </div>
  )
}
