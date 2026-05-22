"use client"
import { useState, useEffect } from 'react'; import { z } from 'zod'; import { useForm } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'; import { Loader2, Lightbulb } from 'lucide-react'; import { toast } from 'sonner'

const schema = z.object({ barang_id: z.string().min(1) })
type FV = z.input<typeof schema>

interface Rekomendasi { barang_id: string; barang_nama: string; barang_kode: string; harga_beli_terendah: number | null; harga_beli_rata_rata: number | null; harga_jual_rekomendasi: number | null; margin: number; sumber: string }

export default function RekomendasiHargaPage() {
  const [barangOpts, setBarangOpts] = useState<Array<{ value: string; label: string }>>([]); const [rekom, setRekom] = useState<Rekomendasi | null>(null); const [loading, setLoading] = useState(false); const [searched, setSearched] = useState(false)
  const { register, handleSubmit } = useForm<FV>({ resolver: zodResolver(schema) })
  useEffect(() => {
    apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/barang')
      .then(r => setBarangOpts((r.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` })))).catch(() => toast.error('Gagal'))
  }, [])
  const onSubmit = async (data: FV) => {
    setLoading(true); setSearched(false)
    try { const r = await apiFetch<{ data: Rekomendasi }>('/api/v1/ai/rekomendasi-harga', { method: 'POST', body: JSON.stringify(data) }); setRekom(r.data); setSearched(true) }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setLoading(false) }
  }
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">AI Rekomendasi Harga</h1><p className="text-muted-foreground mt-1">Rekomendasi harga jual berdasarkan data pembelian & kontrak</p></div>
      <Card><CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3">
          <div className="flex-1">
            <select {...register('barang_id')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Pilih Barang</option>{barangOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-2" />}Rekomendasi</Button>
        </form>
      </CardContent></Card>
      {searched && rekom && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Harga Beli Terendah</CardTitle></CardHeader>
            <CardContent><p className="text-xl font-bold">{rekom.harga_beli_terendah ? `Rp ${rekom.harga_beli_terendah.toLocaleString('id-ID')}` : '-'}</p>
              <p className="text-xs text-muted-foreground">Sumber: {rekom.sumber}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Rata-rata Harga Beli</CardTitle></CardHeader>
            <CardContent><p className="text-xl font-bold">{rekom.harga_beli_rata_rata ? `Rp ${rekom.harga_beli_rata_rata.toLocaleString('id-ID')}` : '-'}</p></CardContent></Card>
          <Card className="border-primary"><CardHeader className="pb-2"><CardTitle className="text-sm text-primary">Harga Jual Rekomendasi</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-primary">{rekom.harga_jual_rekomendasi ? `Rp ${rekom.harga_jual_rekomendasi.toLocaleString('id-ID')}` : '-'}</p>
              <Badge variant="success" className="mt-1">Margin {Math.round(rekom.margin * 100)}%</Badge></CardContent></Card>
          <Card className="col-span-3"><CardContent className="pt-4">
            <div className="space-y-2 text-sm">
              <p><strong>Barang:</strong> [{rekom.barang_kode}] {rekom.barang_nama}</p>
              <p><strong>Sumber harga:</strong> {rekom.sumber}</p>
            </div>
          </CardContent></Card>
        </div>
      )}
    </div>
  )
}
