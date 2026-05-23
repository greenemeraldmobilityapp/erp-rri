import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Pencil, Eye } from 'lucide-react'

const s: Record<string, { label: string; v: 'secondary' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' }, posted: { label: 'Posted', v: 'success' },
}

export default async function JurnalPage() {
  const { data, error } = await supabase.from('jurnal').select('*').order('created_at', { ascending: false })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Jurnal Umum</h1><p className="text-muted-foreground mt-1">Catatan jurnal akuntansi</p></div>
        <Button asChild><Link href="/dashboard/jurnal/tambah"><Plus className="h-4 w-4 mr-2" />Tambah Jurnal</Link></Button>
      </div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada jurnal.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/jurnal/tambah">Buat Jurnal Pertama</Link></Button></div> :
      <div className="rounded-lg border bg-card"><Table><TableHeader><TableRow>
        <TableHead>Nomor</TableHead>
        <TableHead>Tanggal</TableHead>
        <TableHead>Keterangan</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Aksi</TableHead>
      </TableRow></TableHeader><TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.nomor}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
            <TableCell className="text-muted-foreground max-w-xs truncate">{item.keterangan ?? '-'}</TableCell>
            <TableCell><Badge variant={s[item.status]?.v ?? 'outline'}>{s[item.status]?.label ?? item.status}</Badge></TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" asChild><Link href={`/dashboard/jurnal/${item.id}`}><Eye className="h-4 w-4" /></Link></Button>
                <Button variant="ghost" size="sm" asChild><Link href={`/dashboard/jurnal/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody></Table></div>}
    </div>
  )
}
