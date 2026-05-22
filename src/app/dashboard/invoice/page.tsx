import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Download } from 'lucide-react'

const s: Record<string, { label: string; v: 'secondary' | 'warning' | 'success' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' }, sent: { label: 'Dikirim', v: 'warning' },
  paid: { label: 'Lunas', v: 'success' }, overdue: { label: 'Overdue', v: 'destructive' },
}

export default async function InvoicePage() {
  const { data, error } = await supabase.from('invoice').select('*, sales_order!sales_order_id(nomor), customer!customer_id(nama)').order('created_at', { ascending: false })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Invoice</h1><p className="text-muted-foreground mt-1">Tagihan penjualan</p></div>
        <Button asChild><Link href="/dashboard/invoice/tambah"><Plus className="h-4 w-4 mr-2" />Tambah Invoice</Link></Button>
      </div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada invoice.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/invoice/tambah">Buat Invoice Pertama</Link></Button></div> :
      <div className="rounded-lg border bg-card"><table className="w-full"><thead><tr className="border-b bg-muted/50">
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Nomor</th>
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">SO Ref</th>
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Tgl</th>
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">TOP</th>
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
        <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase">Aksi</th>
      </tr></thead><tbody className="divide-y">
        {data.map((item) => (
          <tr key={item.id} className="hover:bg-muted/30">
            <td className="p-3 text-sm font-medium">{item.nomor}</td>
            <td className="p-3 text-sm">{item.customer?.nama}</td>
            <td className="p-3 text-sm text-muted-foreground">{item.sales_order?.nomor ?? '-'}</td>
            <td className="p-3 text-sm text-muted-foreground">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
            <td className="p-3 text-sm">{item.top}</td>
            <td className="p-3"><Badge variant={s[item.status]?.v ?? 'outline'}>{s[item.status]?.label ?? item.status}</Badge></td>
            <td className="p-3 text-right space-x-1">
              <Button variant="ghost" size="sm" asChild><a href={`/api/v1/invoice/${item.id}/pdf`} target="_blank"><Download className="h-4 w-4" /></a></Button>
              <Button variant="ghost" size="sm" asChild><Link href={`/dashboard/invoice/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
            </td>
          </tr>
        ))}
      </tbody></table></div>}
    </div>
  )
}
