import { supabase } from '@/lib/db/client'
import { PageHeader } from '@/components/page-header'
import { PeriodFilter } from '@/components/period-filter'
import { formatDateTime } from '@/lib/utils/date'
import { ExportPdfButton } from '@/components/export-pdf-button'
import { NeracaChart } from '@/components/neraca-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function rupiah(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`
}

function makeDateRange(tahun: string | null): { since: string; until: string } {
  const y = tahun ? parseInt(tahun) : new Date().getFullYear()
  return { since: new Date(y, 0, 1).toISOString(), until: new Date(y, 11, 31, 23, 59, 59).toISOString() }
}

type CoaRow = { kode: string; nama: string; tipe: string; saldo: number }
type Grouped = Record<string, { coas: CoaRow[]; total: number }>

async function fetchBalance(tahun: string | null) {
  const period = makeDateRange(tahun)
  const { data } = await supabase
    .from('jurnal_item')
    .select('*, jurnal!jurnal_id(status, tanggal), coa!coa_id(kode, nama, tipe)')
    .gte('jurnal.tanggal', period.since)
    .lte('jurnal.tanggal', period.until)
    .neq('jurnal.status', 'draft')

  const coaMap = new Map<string, CoaRow & { tipe: string }>()
  for (const row of data ?? []) {
    const coa = row.coa as { kode: string; nama: string; tipe: string } | null
    if (!coa) continue
    const existing = coaMap.get(coa.kode)
    const delta = (row.debit ?? 0) - (row.credit ?? 0)
    if (existing) existing.saldo += delta
    else coaMap.set(coa.kode, { kode: coa.kode, nama: coa.nama, tipe: coa.tipe, saldo: delta })
  }

  const grouped: Grouped = {}
  const typeLabels: Record<string, string> = { aset: 'Aset', liabilitas: 'Liabilitas', ekuitas: 'Ekuitas' }
  const order = ['aset', 'liabilitas', 'ekuitas']
  for (const [, row] of coaMap) {
    const tipe = row.tipe?.toLowerCase() || 'lainnya'
    if (!grouped[tipe]) grouped[tipe] = { coas: [], total: 0 }
    grouped[tipe].coas.push(row)
    grouped[tipe].total += row.saldo
  }
  const balanceDiff = (grouped.aset?.total ?? 0) - ((grouped.liabilitas?.total ?? 0) + (grouped.ekuitas?.total ?? 0))

  return { grouped, typeLabels, order, balanceDiff }
}

export default async function NeracaPage({ searchParams }: { searchParams: Promise<{ tahun?: string }> }) {
  const sp = await searchParams
  const { grouped, typeLabels, order, balanceDiff } = await fetchBalance(sp.tahun ?? null)
  const { grouped: prevGrouped } = await fetchBalance(sp.tahun ? String(parseInt(sp.tahun) - 1) : String(new Date().getFullYear() - 1))

  const chartData = order
    .filter(t => grouped[t])
    .map(t => ({ name: typeLabels[t] ?? t, value: Math.abs(grouped[t].total) }))

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="print:hidden">
        <PageHeader title="Neraca" description="Balance sheet" actions={<div className="flex items-center gap-2"><PeriodFilter mode="quarterly" /><ExportPdfButton hrefPrefix="/api/v1/laporan/neraca/pdf" /></div>} />
      </div>

      {/* Chart */}
      <Card className="print:shadow-none print:border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Komposisi Neraca</CardTitle>
        </CardHeader>
        <CardContent>
          <NeracaChart data={chartData} />
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {order.filter(t => grouped[t]).map(t => (
          <Card key={t} className={t === 'aset' ? 'border-blue-200' : t === 'liabilitas' ? 'border-amber-200' : 'border-emerald-200'}>
            <CardHeader className="pb-2"><CardTitle className={`text-sm ${t === 'aset' ? 'text-blue-600' : t === 'liabilitas' ? 'text-amber-600' : 'text-emerald-600'}`}>{typeLabels[t]}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{rupiah(grouped[t].total)}</p>
              <p className="text-xs text-muted-foreground">{grouped[t].coas.length} akun</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Balance Check</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${Math.abs(balanceDiff) < 1000 ? 'text-emerald-600' : 'text-red-600'}`}>
              {Math.abs(balanceDiff) < 1000 ? '✓ Balanced' : `⚠ Rp ${balanceDiff.toLocaleString('id-ID')}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Rincian Akun</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Tipe</th>
                <th className="pb-2 font-medium">Kode</th>
                <th className="pb-2 font-medium">Nama Akun</th>
                <th className="pb-2 font-medium text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {order.filter(t => grouped[t]).map(t => grouped[t].coas.map((coa, i) => (
                <tr key={`${t}-${i}`} className="border-b last:border-0">
                  {i === 0 && <td className="py-2 font-semibold" rowSpan={grouped[t].coas.length}>{typeLabels[t] ?? t}</td>}
                  <td className="py-2 text-muted-foreground">{coa.kode}</td>
                  <td className="py-2">{coa.nama}</td>
                  <td className="py-2 text-right font-medium">{rupiah(coa.saldo)}</td>
                </tr>
              )))}
            </tbody>
            <tfoot>
              {order.filter(t => grouped[t]).map(t => (
                <tr key={`total-${t}`} className="border-t font-bold">
                  <td colSpan={3} className="pt-2 text-right">{typeLabels[t]}</td>
                  <td className="pt-2 text-right">{rupiah(grouped[t].total)}</td>
                </tr>
              ))}
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Comparative */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {order.filter(t => grouped[t] && prevGrouped[t]).map(t => {
          const cur = grouped[t].total
          const prev = prevGrouped[t].total
          const diff = cur - prev
          const pct = prev ? ((diff / prev) * 100).toFixed(1) : '-'
          return (
            <Card key={t}>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{typeLabels[t]} — YoY</CardTitle></CardHeader>
              <CardContent>
                <p className="text-lg font-bold">{rupiah(cur)}</p>
                <p className={`text-xs ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {diff >= 0 ? '↑' : '↓'} {rupiah(Math.abs(diff))} ({pct}%)
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Print watermark */}
      <div className="hidden print:block text-xs text-muted-foreground text-center pt-4 border-t mt-8">
        Dicetak pada {formatDateTime(new Date(), { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
