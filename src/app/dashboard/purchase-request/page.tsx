import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Pencil, Eye } from 'lucide-react'
import { ExportButton } from '@/components/export-button'
export const dynamic = 'force-dynamic'

const s: Record<string, { label: string; v: 'secondary' | 'warning' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' }, approved: { label: 'Disetujui', v: 'success' }, rejected: { label: 'Ditolak', v: 'outline' }, ordered: { label: 'Sudah diPO', v: 'warning' },
}

export default async function PurchaseRequestPage() {
  const { data, error } = await supabase.from('purchase_request').select('*, sales_order!sales_order_id(nomor)').order('created_at', { ascending: false })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Purchase Request</h1><p className="text-muted-foreground mt-1">Permintaan pembelian barang</p></div>
        <div className="flex items-center gap-2"><ExportButton table="purchase_request" /><Button asChild><Link href="/dashboard/purchase-request/tambah"><Plus className="h-4 w-4 mr-2" />Tambah PR</Link></Button></div>
      </div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada PR.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/purchase-request/tambah">Buat PR Pertama</Link></Button></div> :
      <div className="rounded-lg border bg-card"><Table><TableHeader><TableRow>
        <TableHead>Nomor</TableHead>
        <TableHead>SO Ref</TableHead>
        <TableHead>Tanggal</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Aksi</TableHead>
      </TableRow></TableHeader><TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.nomor}</TableCell>
            <TableCell className="text-muted-foreground">{item.sales_order?.nomor ?? '-'}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
            <TableCell><Badge variant={s[item.status]?.v ?? 'outline'}>{s[item.status]?.label ?? item.status}</Badge></TableCell>
            <TableCell className="text-right space-x-1"><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/purchase-request/${item.id}`}><Eye className="h-4 w-4" /></Link></Button><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/purchase-request/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button></TableCell>
          </TableRow>
        ))}
      </TableBody></Table></div>}
    </div>
  )
}
