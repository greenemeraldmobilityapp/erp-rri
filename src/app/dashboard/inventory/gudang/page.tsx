import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Pencil, Eye } from 'lucide-react'
export const dynamic = 'force-dynamic'

export default async function GudangPage() {
  const { data, error } = await supabase.from('gudang').select('*').order('nama')
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Gudang</h1><p className="text-muted-foreground mt-1">Lokasi penyimpanan barang</p></div>
        <Button asChild><Link href="/dashboard/inventory/gudang/tambah"><Plus className="h-4 w-4 mr-2" />Tambah Gudang</Link></Button>
      </div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada gudang.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/inventory/gudang/tambah">Buat Gudang Pertama</Link></Button></div> :
      <div className="rounded-lg border bg-card"><Table><TableHeader><TableRow>
        <TableHead>Nama</TableHead>
        <TableHead>Lokasi</TableHead>
        <TableHead>Keterangan</TableHead>
        <TableHead className="text-right">Aksi</TableHead>
      </TableRow></TableHeader><TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.nama}</TableCell>
            <TableCell className="text-muted-foreground">{item.lokasi ?? '-'}</TableCell>
            <TableCell className="text-muted-foreground">{item.keterangan ?? '-'}</TableCell>
            <TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/inventory/gudang/${item.id}`}><Eye className="h-4 w-4" /></Link></Button><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/inventory/gudang/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button></div></TableCell>
          </TableRow>
        ))}
      </TableBody></Table></div>}
    </div>
  )
}
