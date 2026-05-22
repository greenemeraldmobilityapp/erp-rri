import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Plus, Pencil } from 'lucide-react'

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
      <div className="rounded-lg border bg-card"><table className="w-full"><thead><tr className="border-b bg-muted/50">
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Nama</th>
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Lokasi</th>
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Keterangan</th>
        <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase">Aksi</th>
      </tr></thead><tbody className="divide-y">
        {data.map((item) => (
          <tr key={item.id} className="hover:bg-muted/30">
            <td className="p-3 text-sm font-medium">{item.nama}</td>
            <td className="p-3 text-sm text-muted-foreground">{item.lokasi ?? '-'}</td>
            <td className="p-3 text-sm text-muted-foreground">{item.keterangan ?? '-'}</td>
            <td className="p-3 text-right"><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/inventory/gudang/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button></td>
          </tr>
        ))}
      </tbody></table></div>}
    </div>
  )
}
