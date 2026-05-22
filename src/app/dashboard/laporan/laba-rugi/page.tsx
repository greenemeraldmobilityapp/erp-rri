import { supabase } from '@/lib/db/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LabaRugiPage() {
  const { data: invoices } = await supabase.from('invoice').select('*').in('status', ['paid', 'sent'])
  const { data: poItems } = await supabase.from('purchase_order_item').select('*, purchase_order!purchase_order_id(status)')

  const totalRevenue = (invoices ?? []).reduce((s, i) => s + (i.ppn_rate ?? 0), 0)
  type PoRow = { purchase_order: { status: string } | null; harga_satuan: number; jumlah: number }
  const typedPo = (poItems ?? []) as unknown as PoRow[]
  const totalCOGS = typedPo.filter(i => i.purchase_order?.status !== 'draft').reduce((s, i) => s + i.harga_satuan * i.jumlah, 0)
  const grossProfit = totalRevenue - totalCOGS

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">Laporan Laba / Rugi</h1><p className="text-muted-foreground mt-1">Income statement</p></div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-600">Pendapatan</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</p><p className="text-xs text-muted-foreground">Dari {invoices?.length ?? 0} invoice</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-red-600">HPP / Beban</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">Rp {totalCOGS.toLocaleString('id-ID')}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-blue-600">Laba / Rugi Kotor</CardTitle></CardHeader>
          <CardContent><p className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Rp {grossProfit.toLocaleString('id-ID')}</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="text-lg">Rincian</CardTitle></CardHeader><CardContent>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b"><span className="font-medium">Pendapatan (Invoice)</span><span className="font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between py-2 border-b text-red-600"><span className="font-medium">HPP (Pembelian)</span><span className="font-bold">-Rp {totalCOGS.toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between py-2 text-lg"><span className="font-bold">Laba / Rugi Kotor</span><span className={`font-bold ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Rp {grossProfit.toLocaleString('id-ID')}</span></div>
        </div>
      </CardContent></Card>
    </div>
  )
}
