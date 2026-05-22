import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Pencil } from 'lucide-react'

const s: Record<string, { label: string; v: 'secondary' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' }, approved: { label: 'Disetujui', v: 'success' },
}

export default async function FakturPajakPage() {
  const { data, error } = await supabase.from('faktur_pajak').select('*, invoice!invoice_id(nomor)').order('created_at', { ascending: false })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Faktur Pajak</h1><p className="text-muted-foreground mt-1">Faktur pajak penjualan</p></div>
        <Button asChild><Link href="/dashboard/faktur-pajak/tambah"><Plus className="h-4 w-4 mr-2" />Tambah Faktur Pajak</Link></Button>
      </div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada faktur pajak.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/faktur-pajak/tambah">Buat Faktur Pajak Pertama</Link></Button></div> :
      <div className="rounded-lg border bg-card"><table className="w-full"><thead><tr className="border-b bg-muted/50">
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Nomor</th>
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Invoice Ref</th>
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">No Faktur</th>
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">DPP</th>
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">PPN</th>
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
        <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase">Aksi</th>
      </tr></thead><tbody className="divide-y">
        {data.map((item) => (
          <tr key={item.id} className="hover:bg-muted/30">
            <td className="p-3 text-sm font-medium">{item.nomor}</td>
            <td className="p-3 text-sm text-muted-foreground">{item.invoice?.nomor ?? '-'}</td>
            <td className="p-3 text-sm font-mono">{item.nomor_faktur}</td>
            <td className="p-3 text-sm">{item.dpp?.toLocaleString('id-ID')}</td>
            <td className="p-3 text-sm">{item.ppn?.toLocaleString('id-ID')}</td>
            <td className="p-3"><Badge variant={s[item.status]?.v ?? 'outline'}>{s[item.status]?.label ?? item.status}</Badge></td>
            <td className="p-3 text-right"><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/faktur-pajak/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button></td>
          </tr>
        ))}
      </tbody></table></div>}
    </div>
  )
}
