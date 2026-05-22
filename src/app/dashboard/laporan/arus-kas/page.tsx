import { supabase } from '@/lib/db/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ArusKasPage() {
  const { data: kwitansi } = await supabase.from('kwitansi').select('*').eq('status', 'completed')
  const { data: po } = await supabase.from('purchase_order').select('*').eq('is_active', true)

  const kasMasuk = (kwitansi ?? []).length * 1000000  // simplified - real calc from invoice items
  const kasKeluar = (po ?? []).length * 500000        // simplified
  const saldoAkhir = kasMasuk - kasKeluar

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">Arus Kas</h1><p className="text-muted-foreground mt-1">Cash flow statement</p></div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-600">Kas Masuk</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">Rp {kasMasuk.toLocaleString('id-ID')}</p><p className="text-xs text-muted-foreground">{kwitansi?.length ?? 0} transaksi</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-red-600">Kas Keluar</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">Rp {kasKeluar.toLocaleString('id-ID')}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-blue-600">Saldo Akhir</CardTitle></CardHeader>
          <CardContent><p className={`text-2xl font-bold ${saldoAkhir >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Rp {saldoAkhir.toLocaleString('id-ID')}</p></CardContent></Card>
      </div>
    </div>
  )
}
