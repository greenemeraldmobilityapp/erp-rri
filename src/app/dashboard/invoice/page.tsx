import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Pencil, Download, Eye } from 'lucide-react'

const s: Record<string, { label: string; v: 'secondary' | 'warning' | 'success' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' }, sent: { label: 'Belum Dibayar', v: 'warning' },
  partial: { label: 'Dibayar Sebagian', v: 'warning' }, paid: { label: 'Lunas', v: 'success' },
  overdue: { label: 'Overdue', v: 'destructive' },
}

export default async function InvoicePage() {
  const { data, error } = await supabase.from('invoice')
    .select('*, sales_order!sales_order_id(nomor, di!fk_sales_order_di(nomor, nomor_di_customer), delivery_order!fk_delivery_order_sales_order(nomor)), customer!customer_id(nama)')
    .order('created_at', { ascending: false })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Invoice</h1><p className="text-muted-foreground mt-1">Tagihan penjualan</p></div>
        <Button asChild><Link href="/dashboard/invoice/tambah"><Plus className="h-4 w-4 mr-2" />Tambah Invoice</Link></Button>
      </div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada invoice.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/invoice/tambah">Buat Invoice Pertama</Link></Button></div> :
      <div className="rounded-lg border bg-card"><Table><TableHeader><TableRow>
        <TableHead>Nomor</TableHead>
        <TableHead>Customer</TableHead>
        <TableHead>SO Ref</TableHead>
        <TableHead>DI Cust. Ref</TableHead>
        <TableHead>DI Ref</TableHead>
        <TableHead>DO Ref</TableHead>
        <TableHead>Tgl</TableHead>
        <TableHead>TOP</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Aksi</TableHead>
      </TableRow></TableHeader><TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.nomor}</TableCell>
            <TableCell className="font-medium">{item.customer?.nama}</TableCell>
            <TableCell className="font-medium">{item.sales_order?.nomor ?? '-'}</TableCell>
            <TableCell className="font-medium">{item.sales_order?.di?.nomor_di_customer ?? '-'}</TableCell>
            <TableCell className="font-medium">{item.sales_order?.di?.nomor ?? '-'}</TableCell>
            <TableCell className="font-medium">{item.sales_order?.delivery_order?.[0]?.nomor ?? '-'}</TableCell>
            <TableCell className="font-medium">{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
            <TableCell className="font-medium">{item.top}</TableCell>
            <TableCell><Badge variant={s[item.status]?.v ?? 'outline'}>{s[item.status]?.label ?? item.status}</Badge></TableCell>
            <TableCell className="text-right space-x-1">
              <Button variant="ghost" size="sm" asChild><Link href={`/dashboard/invoice/${item.id}`}><Eye className="h-4 w-4" /></Link></Button>
              <Button variant="ghost" size="sm" asChild><a href={`/api/v1/invoice/${item.id}/pdf`} target="_blank"><Download className="h-4 w-4" /></a></Button>
              <Button variant="ghost" size="sm" asChild><Link href={`/dashboard/invoice/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody></Table></div>}
    </div>
  )
}
