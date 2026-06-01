import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Pencil, Download, Eye } from 'lucide-react'

const s: Record<string, { label: string; v: 'secondary' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' }, completed: { label: 'Selesai', v: 'success' },
}

export default async function KwitansiPage() {
  const { data, error } = await supabase.from('kwitansi').select('*, invoice!invoice_id(nomor)').order('created_at', { ascending: false })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Kwitansi</h1><p className="text-muted-foreground mt-1">Tanda terima pembayaran</p></div>
        <Button asChild><Link href="/dashboard/kwitansi/tambah"><Plus className="h-4 w-4 mr-2" />Tambah Kwitansi</Link></Button>
      </div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada kwitansi.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/kwitansi/tambah">Buat Kwitansi Pertama</Link></Button></div> :
      <div className="rounded-lg border bg-card"><Table><TableHeader><TableRow>
        <TableHead>Nomor</TableHead>
        <TableHead>Invoice Ref</TableHead>
        <TableHead>Tanggal</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Aksi</TableHead>
      </TableRow></TableHeader><TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.nomor}</TableCell>
            <TableCell className="text-muted-foreground">{item.invoice?.nomor ?? '-'}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
            <TableCell><Badge variant={s[item.status]?.v ?? 'outline'}>{s[item.status]?.label ?? item.status}</Badge></TableCell>
            <TableCell className="text-right space-x-1">
              <Button variant="ghost" size="sm" asChild><Link href={`/dashboard/kwitansi/${item.id}`}><Eye className="h-4 w-4" /></Link></Button>
              <Button variant="ghost" size="sm" asChild><a href={`/api/v1/kwitansi/${item.id}/pdf`} target="_blank"><Download className="h-4 w-4" /></a></Button>
              <Button variant="ghost" size="sm" asChild><Link href={`/dashboard/kwitansi/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody></Table></div>}
    </div>
  )
}
