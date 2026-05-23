import { supabase } from '@/lib/db/client'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NeracaPage() {
  const { data: coa } = await supabase.from('coa').select('*').order('kode', { ascending: true })
  const { data: jurnalItems } = await supabase.from('jurnal_item').select('*, jurnal!jurnal_id(status)')

  type JrnRow = { akun_id: string; debit: number; credit: number; jurnal: { status: string } | null }
  const typedJ = (jurnalItems ?? []) as unknown as JrnRow[]
  const akun = (coa ?? []).map(a => {
    const total = typedJ.filter(j => j.akun_id === a.id && j.jurnal?.status !== 'draft')
      .reduce((s, j) => s + (j.debit || 0) - (j.credit || 0), 0)
    return { ...a, total }
  })

  const aset = akun.filter(a => a.tipe === 'Asset').reduce((s, a) => s + a.total, 0)
  const liabilitas = akun.filter(a => a.tipe === 'Liability').reduce((s, a) => s + a.total, 0)
  const ekuitas = akun.filter(a => a.tipe === 'Equity').reduce((s, a) => s + a.total, 0)

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">Neraca</h1><p className="text-muted-foreground mt-1">Balance sheet</p></div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-blue-600">Aset</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">Rp {aset.toLocaleString('id-ID')}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-amber-600">Liabilitas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">Rp {liabilitas.toLocaleString('id-ID')}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-600">Ekuitas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">Rp {ekuitas.toLocaleString('id-ID')}</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="text-lg">Rincian Akun</CardTitle></CardHeader><CardContent>
        {!akun.length ? <p className="text-muted-foreground text-sm">Belum ada data COA.</p> :
        <Table><TableHeader><TableRow>
          <TableHead>Kode</TableHead>
          <TableHead>Nama Akun</TableHead>
          <TableHead>Tipe</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
        </TableRow></TableHeader><TableBody>
          {akun.filter(a => a.total !== 0).map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-mono">{item.kode}</TableCell>
              <TableCell className="font-medium">{item.nama}</TableCell>
              <TableCell>{item.tipe}</TableCell>
              <TableCell className={`text-sm font-bold text-right ${item.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Rp {item.total.toLocaleString('id-ID')}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>}
      </CardContent></Card>
    </div>
  )
}
