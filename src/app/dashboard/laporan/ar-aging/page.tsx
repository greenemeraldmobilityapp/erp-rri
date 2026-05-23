import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { PageHeader } from '@/components/page-header'
import { AgingChart } from '@/components/aging-chart'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const STATUS_MAP: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' }> = {
  sent: { label: 'Belum Dibayar', variant: 'warning' },
  partial: { label: 'Dibayar Sebagian', variant: 'warning' },
  overdue: { label: 'Overdue', variant: 'destructive' },
}

const BUCKETS = [
  { label: '0-30 Hari', min: 0, max: 30, color: 'text-emerald-600' },
  { label: '31-60 Hari', min: 31, max: 60, color: 'text-yellow-600' },
  { label: '61-90 Hari', min: 61, max: 90, color: 'text-orange-600' },
  { label: '>90 Hari', min: 91, max: Infinity, color: 'text-red-600' },
]

export default async function ArAgingPage() {
  const { data: invoices } = await supabase
    .from('invoice')
    .select('*, customer!customer_id(nama, kode)')
    .in('status', ['sent', 'partial', 'overdue'])
    .order('tanggal', { ascending: true })

  const ids = (invoices ?? []).map(i => i.id)
  const { data: items } = ids.length
    ? await supabase.from('invoice_item').select('invoice_id, harga, jumlah, diskon, ppn, pph').in('invoice_id', ids)
    : { data: [] }

  const totalsById: Record<string, number> = {}
  for (const it of items ?? []) {
    const dpp = it.harga * it.jumlah - (it.diskon ?? 0)
    totalsById[it.invoice_id] = (totalsById[it.invoice_id] ?? 0) + dpp + (it.ppn ?? 0) - (it.pph ?? 0)
  }

  const now = new Date()
  const enriched = (invoices ?? []).map(inv => ({ ...inv, total: totalsById[inv.id] ?? 0 }))

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
      <PageHeader title="AR Aging" description="Piutang usaha berdasarkan umur" />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Grafik Aging</CardTitle>
        </CardHeader>
        <CardContent>
          {grandTotal > 0 ? (
            <AgingChart data={aging.map(b => ({ label: b.label, total: b.total }))} formatCurrency />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data piutang.</p>
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
              <p className="text-xs text-muted-foreground">faktur</p>
              {b.total > 0 && (
                <p className="text-sm font-semibold mt-1">Rp {b.total.toLocaleString('id-ID')}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detail Piutang</CardTitle>
        </CardHeader>
        <CardContent>
          {!enriched.length ? (
            <p className="text-muted-foreground text-sm">Belum ada piutang.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Umur</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map(inv => {
                  const umur = Math.floor((now.getTime() - new Date(inv.tanggal).getTime()) / (1000 * 60 * 60 * 24))
                  const st = STATUS_MAP[inv.status] ?? { label: inv.status, variant: 'warning' as const }
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/invoice/${inv.id}`} className="hover:underline">
                          {inv.nomor}
                        </Link>
                      </TableCell>
                      <TableCell>{inv.customer?.nama}</TableCell>
                      <TableCell>{new Date(inv.tanggal).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell className="text-right">{umur} hr</TableCell>
                      <TableCell className="text-right font-medium">
                        Rp {inv.total.toLocaleString('id-ID')}
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
