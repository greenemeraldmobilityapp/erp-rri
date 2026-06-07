import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Pencil, Eye } from 'lucide-react'
import { ExportButton } from '@/components/export-button'
export const dynamic = 'force-dynamic'

const s: Record<string, { label: string; v: 'secondary' | 'warning' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' }, sent: { label: 'Terkirim', v: 'warning' }, confirmed: { label: 'Dikonfirmasi', v: 'success' }, partial: { label: 'Parsial', v: 'outline' }, completed: { label: 'Selesai', v: 'outline' },
}

export default async function PurchaseOrderPage() {
  const { data, error } = await supabase.from('purchase_order').select('*, supplier!supplier_id(nama, kode)').order('created_at', { ascending: false })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Purchase Order</h1><p className="text-muted-foreground mt-1">Order pembelian ke supplier</p></div>
        <div className="flex items-center gap-2"><ExportButton table="purchase_order" /><Button asChild><Link href="/dashboard/purchase-order/tambah"><Plus className="h-4 w-4 mr-2" />Tambah PO</Link></Button></div>
      </div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada PO.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/purchase-order/tambah">Buat PO Pertama</Link></Button></div> :
      <div className="rounded-lg border bg-card"><Table><TableHeader><TableRow>
        <TableHead>Nomor</TableHead>
        <TableHead>Supplier</TableHead>
        <TableHead>Tanggal</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Aksi</TableHead>
      </TableRow></TableHeader><TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.nomor}</TableCell>
            <TableCell>{item.supplier?.nama}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
            <TableCell><Badge variant={s[item.status]?.v ?? 'outline'}>{s[item.status]?.label ?? item.status}</Badge></TableCell>
            <TableCell className="text-right space-x-1"><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/purchase-order/${item.id}`}><Eye className="h-4 w-4" /></Link></Button><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/purchase-order/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button></TableCell>
          </TableRow>
        ))}
      </TableBody></Table></div>}
    </div>
  )
}
