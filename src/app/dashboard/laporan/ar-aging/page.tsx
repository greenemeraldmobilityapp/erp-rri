import { supabase } from '@/lib/db/client'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
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
        <Table><TableHeader><TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Tanggal</TableHead>
          <TableHead>Umur (Hari)</TableHead>
          <TableHead>Status</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map(item => {
            const umur = Math.floor((now.getTime() - new Date(item.tanggal).getTime()) / (1000 * 60 * 60 * 24))
            return <TableRow key={item.id}><TableCell className="font-medium">{item.nomor}</TableCell>
              <TableCell>{item.customer?.nama}</TableCell>
              <TableCell>{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
              <TableCell>{umur} hari</TableCell>
              <TableCell>{item.status}</TableCell></TableRow>
          })}
        </TableBody></Table>}
      </CardContent></Card>
    </div>
  )
}
