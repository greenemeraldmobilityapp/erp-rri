import { supabase } from '@/lib/db/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ArAgingPage() {
  const { data } = await supabase.from('invoice').select('*, customer!customer_id(nama)').in('status', ['sent', 'overdue']).order('tanggal', { ascending: true })
  const now = new Date()
  const buckets = [{ label: '0-30 Hari', min: 0, max: 30 }, { label: '31-60 Hari', min: 31, max: 60 }, { label: '61-90 Hari', min: 61, max: 90 }, { label: '>90 Hari', min: 91, max: Infinity }]
  const aging = buckets.map(b => {
    const items = (data ?? []).filter(i => { const d = Math.floor((now.getTime() - new Date(i.tanggal).getTime()) / (1000 * 60 * 60 * 24)); return d >= b.min && d <= b.max })
    type Row = { ppn_rate: number | null }
    return { ...b, items, total: items.reduce((s, i) => s + ((i as unknown as Row).ppn_rate ?? 0), 0) }
  })
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">AR Aging</h1><p className="text-muted-foreground mt-1">Piutang usaha berdasarkan umur</p></div>
      <div className="grid grid-cols-4 gap-4">{aging.map(b => (
        <Card key={b.label}><CardHeader className="pb-2"><CardTitle className="text-sm">{b.label}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{b.items.length}</p><p className="text-xs text-muted-foreground">faktur</p></CardContent></Card>
      ))}</div>
      <Card><CardHeader><CardTitle className="text-lg">Detail Piutang</CardTitle></CardHeader><CardContent>
        {!data?.length ? <p className="text-muted-foreground text-sm">Belum ada piutang.</p> :
        <table className="w-full"><thead><tr className="border-b bg-muted/50 text-left">
          <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Invoice</th>
          <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
          <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Tanggal</th>
          <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Umur (Hari)</th>
          <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
        </tr></thead><tbody className="divide-y">
          {data.map(item => {
            const umur = Math.floor((now.getTime() - new Date(item.tanggal).getTime()) / (1000 * 60 * 60 * 24))
            return <tr key={item.id} className="hover:bg-muted/30"><td className="p-3 text-sm font-medium">{item.nomor}</td>
              <td className="p-3 text-sm">{item.customer?.nama}</td>
              <td className="p-3 text-sm">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
              <td className="p-3 text-sm">{umur} hari</td>
              <td className="p-3 text-sm">{item.status}</td></tr>
          })}
        </tbody></table>}
      </CardContent></Card>
    </div>
  )
}
