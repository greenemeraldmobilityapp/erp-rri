import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { PageHeader } from '@/components/page-header'
import { AgingChart } from '@/components/aging-chart'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const STATUS_MAP: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' }> = {
  sent: { label: 'Dikirim', variant: 'warning' },
  confirmed: { label: 'Dikonfirmasi', variant: 'success' },
  partial: { label: 'Dibayar Sebagian', variant: 'warning' },
  paid: { label: 'Lunas', variant: 'success' },
}

const BUCKETS = [
  { label: '0-30 Hari', min: 0, max: 30, color: 'text-emerald-600' },
  { label: '31-60 Hari', min: 31, max: 60, color: 'text-yellow-600' },
  { label: '61-90 Hari', min: 61, max: 90, color: 'text-orange-600' },
  { label: '>90 Hari', min: 91, max: Infinity, color: 'text-red-600' },
]

export default async function ApAgingPage() {
  const { data: orders } = await supabase
    .from('purchase_order')
    .select('*, supplier!supplier_id(nama, kode)')
    .in('status', ['sent', 'confirmed', 'partial'])
    .order('tanggal', { ascending: true })

  const ids = (orders ?? []).map(p => p.id)
  const { data: items } = ids.length
    ? await supabase.from('purchase_order_item').select('purchase_order_id, harga_satuan, jumlah').in('purchase_order_id', ids)
    : { data: [] }

  const totalsById: Record<string, number> = {}
  for (const it of items ?? []) {
    totalsById[it.purchase_order_id] = (totalsById[it.purchase_order_id] ?? 0) + it.harga_satuan * it.jumlah
  }

  const now = new Date()
  const enriched = (orders ?? []).map(po => ({ ...po, total: totalsById[po.id] ?? 0 }))

  const aging = BUCKETS.map(b => {
    const list = enriched.filter(i => {
      const d = Math.floor((now.getTime() - new Date(i.tanggal).getTime()) / (1000 * 60 * 60 * 24))
      return d >= b.min && d <= b.max
    })
    return { ...b, items: list, count: list.length, total: list.reduce((s, i) => s + i.total, 0) }
  })

  const grandTotal = aging.reduce((s, b) => s + b.total, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="AP Aging" description="Hutang usaha berdasarkan umur" />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Grafik Aging</CardTitle>
        </CardHeader>
        <CardContent>
          {grandTotal > 0 ? (
            <AgingChart data={aging.map(b => ({ label: b.label, total: b.total }))} formatCurrency />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data hutang.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        {aging.map(b => (
          <Card key={b.label}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm ${b.color}`}>{b.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{b.count}</p>
              <p className="text-xs text-muted-foreground">PO</p>
              {b.total > 0 && (
                <p className="text-sm font-semibold mt-1">Rp {b.total.toLocaleString('id-ID')}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detail Hutang</CardTitle>
        </CardHeader>
        <CardContent>
          {!enriched.length ? (
            <p className="text-muted-foreground text-sm">Belum ada hutang.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Umur</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map(po => {
                  const umur = Math.floor((now.getTime() - new Date(po.tanggal).getTime()) / (1000 * 60 * 60 * 24))
                  const st = STATUS_MAP[po.status] ?? { label: po.status, variant: 'warning' as const }
                  return (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/purchase-order/${po.id}`} className="hover:underline">
                          {po.nomor}
                        </Link>
                      </TableCell>
                      <TableCell>{po.supplier?.nama}</TableCell>
                      <TableCell>{new Date(po.tanggal).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell className="text-right">{umur} hr</TableCell>
                      <TableCell className="text-right font-medium">
                        Rp {po.total.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
