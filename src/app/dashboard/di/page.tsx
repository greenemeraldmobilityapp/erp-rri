import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Pencil, Eye } from 'lucide-react'
import { ExportButton } from "@/components/export-button"
export const dynamic = 'force-dynamic'

const s: Record<string, { label: string; v: 'secondary' | 'warning' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' }, confirmed: { label: 'Dikonfirmasi', v: 'success' }, cancelled: { label: 'Batal', v: 'outline' },
}

export default async function DiPage() {
  const { data, error } = await supabase.from('di').select('*, customer!customer_id(nama, kode), customer_pic!pic_customer_id(nama, no_hp)').order('created_at', { ascending: false })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Delivery Instruction</h1><p className="text-muted-foreground mt-1">Instruksi pengiriman barang</p></div>
        <ExportButton table="di" />
        <Button asChild><Link href="/dashboard/di/tambah"><Plus className="h-4 w-4 mr-2" />Tambah DI</Link></Button>
      </div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada DI.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/di/tambah">Buat DI Pertama</Link></Button></div> :
      <div className="rounded-lg border bg-card"><Table><TableHeader><TableRow>
        <TableHead>Nomor</TableHead>
        <TableHead>Customer</TableHead>
        <TableHead>PIC</TableHead>
        <TableHead>Tanggal</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Aksi</TableHead>
      </TableRow></TableHeader><TableBody>
        {data.map((item: { id: string; nomor: string; customer: { nama: string } | null; customer_pic: { nama: string } | null; tanggal: string; status: string }) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.nomor}</TableCell>
            <TableCell>{item.customer?.nama}</TableCell>
            <TableCell className="font-medium">{item.customer_pic?.nama ?? '-'}</TableCell>
            <TableCell className="font-medium">{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
            <TableCell><Badge variant={s[item.status]?.v ?? 'outline'}>{s[item.status]?.label ?? item.status}</Badge></TableCell>
            <TableCell className="text-right space-x-1"><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/di/${item.id}`}><Eye className="h-4 w-4" /></Link></Button><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/di/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button></TableCell>
          </TableRow>
        ))}
      </TableBody></Table></div>}
    </div>
  )
}
