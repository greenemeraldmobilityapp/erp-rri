import { supabase } from '@/lib/db/client'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ApAgingPage() {
  const { data } = await supabase.from('purchase_order').select('*, supplier!supplier_id(nama)').is('is_active', true).order('tanggal', { ascending: true })
  const now = new Date()
  const buckets = [{ label: '0-30 Hari', min: 0, max: 30 }, { label: '31-60 Hari', min: 31, max: 60 }, { label: '61-90 Hari', min: 61, max: 90 }, { label: '>90 Hari', min: 91, max: Infinity }]
  const aging = buckets.map(b => {
    const items = (data ?? []).filter(i => { const d = Math.floor((now.getTime() - new Date(i.tanggal).getTime()) / (1000 * 60 * 60 * 24)); return d >= b.min && d <= b.max })
    return { ...b, items, total: items.length }
  })
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">AP Aging</h1><p className="text-muted-foreground mt-1">Hutang usaha berdasarkan umur</p></div>
      <div className="grid grid-cols-4 gap-4">{aging.map(b => (
        <Card key={b.label}><CardHeader className="pb-2"><CardTitle className="text-sm">{b.label}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{b.items.length}</p><p className="text-xs text-muted-foreground">PO</p></CardContent></Card>
      ))}</div>
      <Card><CardHeader><CardTitle className="text-lg">Detail Hutang</CardTitle></CardHeader><CardContent>
        {!data?.length ? <p className="text-muted-foreground text-sm">Belum ada hutang.</p> :
        <Table><TableHeader><TableRow>
          <TableHead>PO</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Tanggal</TableHead>
          <TableHead>Umur (Hari)</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map(item => {
            const umur = Math.floor((now.getTime() - new Date(item.tanggal).getTime()) / (1000 * 60 * 60 * 24))
            return <TableRow key={item.id}><TableCell className="font-medium">{item.nomor}</TableCell>
              <TableCell>{item.supplier?.nama}</TableCell>
              <TableCell>{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
              <TableCell>{umur} hari</TableCell></TableRow>
          })}
        </TableBody></Table>}
      </CardContent></Card>
    </div>
  )
}
