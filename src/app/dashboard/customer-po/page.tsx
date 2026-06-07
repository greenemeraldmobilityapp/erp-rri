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

export default async function CustomerPoPage() {
  const { data, error } = await supabase.from('customer_po').select('*, customer!customer_id(nama, kode)').order('tanggal', { ascending: false }).order('created_at', { ascending: false })
  const { data: soData } = await supabase.from('sales_order').select('customer_po_id, nomor, status')
  const soByPoId = new Map(soData?.map(s => [s.customer_po_id, s]) ?? [])
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Customer PO</h1><p className="text-muted-foreground mt-1">Purchase Order dari customer</p></div>
        <div className="flex items-center gap-2"><ExportButton table="customer_po" /><Button asChild><Link href="/dashboard/customer-po/tambah"><Plus className="h-4 w-4 mr-2" />Tambah PO</Link></Button></div>
      </div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada PO customer.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/customer-po/tambah">Buat PO Pertama</Link></Button></div> :
      <div className="rounded-lg border bg-card"><Table><TableHeader><TableRow>
        <TableHead>Nomor</TableHead>
        <TableHead>Customer</TableHead>
        <TableHead>PO Customer</TableHead>
        <TableHead>Tgl</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>SO</TableHead>
        <TableHead className="text-right">Aksi</TableHead>
      </TableRow></TableHeader><TableBody>
        {data.map((item) => {
          const so = soByPoId.get(item.id)
          return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.nomor}</TableCell>
            <TableCell className="font-medium">{item.customer?.nama}</TableCell>
            <TableCell className="font-medium">{item.nomor_po_customer ?? '-'}</TableCell>
            <TableCell className="font-medium">{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
            <TableCell><Badge variant={s[item.status]?.v ?? 'outline'}>{s[item.status]?.label ?? item.status}</Badge></TableCell>
            <TableCell>{so ? <Badge variant="secondary">{so.nomor}</Badge> : '-'}</TableCell>
            <TableCell className="text-right space-x-1"><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/customer-po/${item.id}`}><Eye className="h-4 w-4" /></Link></Button><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/customer-po/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button></TableCell>
          </TableRow>
        )})}
      </TableBody></Table></div>}
    </div>
  )
}
