import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Package, Plus, Minus, FileText } from 'lucide-react'

export default async function StokPage() {
  const { data, error } = await supabase
    .from('stok')
    .select('*, barang!barang_id(id, nama, kode, satuan, stok_minimum), gudang!gudang_id(nama)')
    .order('barang_id')
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Stok Barang</h1><p className="text-muted-foreground mt-1">Saldo stok saat ini</p></div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/dashboard/inventory/stok/masuk"><Plus className="h-4 w-4 mr-2" />Stok Masuk</Link></Button>
          <Button variant="outline" asChild><Link href="/dashboard/inventory/stok/keluar"><Minus className="h-4 w-4 mr-2" />Stok Keluar</Link></Button>
        </div>
      </div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Belum ada stok tercatat.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/inventory/stok/masuk">Catat Stok Masuk</Link></Button>
      </div> :
      <div className="rounded-lg border bg-card"><Table><TableHeader><TableRow>
        <TableHead>Barang</TableHead>
        <TableHead>Gudang</TableHead>
        <TableHead className="text-right">Jumlah</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Aksi</TableHead>
      </TableRow></TableHeader><TableBody>
        {data.map((item) => {
          const brg = item.barang as { id: string; nama: string; kode: string; satuan: string; stok_minimum: number } | null
          const gdg = item.gudang as { nama: string } | null
          const isLow = item.jumlah <= (brg?.stok_minimum ?? 0)
          return (
            <TableRow key={item.id}>
              <TableCell><div className="text-sm font-medium">{brg?.nama ?? '-'}</div><div className="text-xs text-muted-foreground">{brg?.kode} — {brg?.satuan}</div></TableCell>
              <TableCell>{gdg?.nama ?? '-'}</TableCell>
              <TableCell className={`text-right text-sm font-bold ${isLow ? 'text-destructive' : ''}`}>{item.jumlah}</TableCell>
              <TableCell>{isLow ? <Badge variant="destructive">Stok Minimum</Badge> : <Badge variant="success">Aman</Badge>}</TableCell>
              <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/inventory/stok/kartu/${brg?.id}`}><FileText className="h-4 w-4" /></Link></Button></TableCell>
            </TableRow>
          )
        })}
      </TableBody></Table></div>}
    </div>
  )
}
