import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Eye } from 'lucide-react'

const s: Record<string, { label: string; v: 'secondary' | 'warning' | 'success' | 'outline' | 'destructive' }> = {
  draft: { label: 'Draft', v: 'secondary' }, confirmed: { label: 'Dikonfirmasi', v: 'warning' }, processed: { label: 'Diproses', v: 'success' }, delivered: { label: 'Dikirim', v: 'outline' }, cancelled: { label: 'Dibatalkan', v: 'destructive' },
}

export default async function SalesOrderPage() {
  const { data, error } = await supabase.from('sales_order').select('*, customer_po!customer_po_id(nomor, customer!customer_id(nama))').order('created_at', { ascending: false })
  const { data: doData } = await supabase.from('delivery_order').select('sales_order_id, nomor, status')
  const doBySoId = new Map(doData?.map(d => [d.sales_order_id, d]) ?? [])
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Sales Order</h1><p className="text-muted-foreground mt-1">Order penjualan internal</p></div>
        <Button asChild><Link href="/dashboard/sales-order/tambah"><Plus className="h-4 w-4 mr-2" />Tambah SO</Link></Button>
      </div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada Sales Order.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/sales-order/tambah">Buat SO Pertama</Link></Button></div> :
      <div className="rounded-lg border bg-card"><Table><TableHeader><TableRow>
        <TableHead>Nomor</TableHead>
        <TableHead>Customer</TableHead>
        <TableHead>PO Reference</TableHead>
        <TableHead>Tanggal</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Aktif</TableHead>
        <TableHead>DO</TableHead>
        <TableHead className="text-right">Aksi</TableHead>
      </TableRow></TableHeader><TableBody>
        {data.map((item) => {
          const doItem = doBySoId.get(item.id)
          const customer = (item.customer_po as Record<string, unknown>)?.customer as Record<string, unknown> | null
          return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.nomor}</TableCell>
            <TableCell className="font-medium">{customer?.nama as string ?? '-'}</TableCell>
            <TableCell className="font-medium">{item.customer_po?.nomor ?? '-'}</TableCell>
            <TableCell className="font-medium">{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
            <TableCell><Badge variant={s[item.status]?.v ?? 'outline'}>{s[item.status]?.label ?? item.status}</Badge></TableCell>
            <TableCell><Badge variant={item.is_active ? 'default' : 'secondary'} className="text-xs">{item.is_active ? 'Ya' : 'Tidak'}</Badge></TableCell>
            <TableCell>{doItem ? <Badge variant="secondary">{doItem.nomor}</Badge> : '-'}</TableCell>
            <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/sales-order/${item.id}`}><Eye className="h-4 w-4" /></Link></Button></TableCell>
          </TableRow>
        )})}
      </TableBody></Table></div>}
    </div>
  )
}
