import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Pencil, Download, Eye } from 'lucide-react'
import { ExportButton } from "@/components/export-button"
export const dynamic = 'force-dynamic'

const s: Record<string, { label: string; v: 'secondary' | 'warning' | 'success' | 'outline' | 'destructive' }> = {
  draft: { label: 'Draft', v: 'secondary' }, awaiting_pickup: { label: 'Siap Kirim', v: 'warning' }, dikirim: { label: 'Dikirim', v: 'success' }, selesai: { label: 'Selesai', v: 'outline' }, ditolak: { label: 'Ditolak', v: 'destructive' },
}

type SoWithPIC = { nomor?: string; di?: { customer_pic?: { nama?: string } } | null; customer_po?: { nomor?: string; customer_pic?: { nama?: string } } | null }

export default async function DeliveryOrderPage() {
  const { data, error } = await supabase.from('delivery_order')
    .select('*, sales_order!sales_order_id(nomor, customer_po!customer_po_id(nomor, customer_pic!pic_customer_id(nama)), di(customer_pic(nama))), gudang!gudang_id(nama)')
    .order('created_at', { ascending: false })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Delivery Order</h1><p className="text-muted-foreground mt-1">Surat jalan pengiriman barang</p></div>
        <ExportButton table="delivery_order" />
      </div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada DO. DO akan tergenerate otomatis saat SO diproses.</p></div> :
      <div className="rounded-lg border bg-card"><Table><TableHeader><TableRow>
        <TableHead>Nomor</TableHead>
        <TableHead>CPO Reference</TableHead>
        <TableHead>SO Reference</TableHead>
        <TableHead>Gudang</TableHead>
        <TableHead>PIC Customer</TableHead>
        <TableHead>Tanggal</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Aksi</TableHead>
      </TableRow></TableHeader><TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.nomor}</TableCell>
            <TableCell className="text-muted-foreground">{(item.sales_order as SoWithPIC | null)?.customer_po?.nomor ?? '-'}</TableCell>
            <TableCell className="text-muted-foreground">{item.sales_order?.nomor ?? '-'}</TableCell>
            <TableCell className="text-muted-foreground">{item.gudang?.nama ?? '-'}</TableCell>
            <TableCell className="text-muted-foreground">{(item.sales_order as SoWithPIC | null)?.di?.customer_pic?.nama ?? (item.sales_order as SoWithPIC | null)?.customer_po?.customer_pic?.nama ?? '-'}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
            <TableCell><Badge variant={s[item.status]?.v ?? 'outline'}>{s[item.status]?.label ?? item.status}</Badge></TableCell>
            <TableCell className="text-right space-x-1"><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/delivery-order/${item.id}`}><Eye className="h-4 w-4" /></Link></Button><Button variant="ghost" size="sm" asChild><a href={`/api/v1/delivery-order/${item.id}/pdf`} target="_blank"><Download className="h-4 w-4" /></a></Button><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/delivery-order/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button></TableCell>
          </TableRow>
        ))}
      </TableBody></Table></div>}
    </div>
  )
}
