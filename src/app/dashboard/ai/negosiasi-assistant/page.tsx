"use client"
import { useState, useEffect } from 'react'; import { z } from 'zod'; import { useForm } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'; import { Loader2, MessageSquare } from 'lucide-react'; import { toast } from 'sonner'

const schema = z.object({ quotation_id: z.string().min(1), barang_id: z.string().min(1), harga_diminta: z.coerce.number().positive() })
type FV = z.input<typeof schema>

interface Analisa { harga_diminta: number; harga_terendah_disetujui: number; margin_projected: number; rekomendasi: string; level_wewenang: string }

export default function NegosiasiAssistantPage() {
  const [qOpts, setQOpts] = useState<Array<{ value: string; label: string }>>([]); const [barangOpts, setBarangOpts] = useState<Array<{ value: string; label: string }>>([]); const [analisa, setAnalisa] = useState<Analisa | null>(null); const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm<FV>({ resolver: zodResolver(schema) })
  useEffect(() => {
    Promise.all([
      apiFetch<Array<{ id: string; nomor: string }>>('/api/v1/quotation'),
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/barang'),
    ]).then(([q, b]) => { setQOpts((q.data ?? []).map(x => ({ value: x.id, label: x.nomor }))); setBarangOpts((b.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` }))) }).catch(() => toast.error('Gagal'))
  }, [])
  const onSubmit = async (data: FV) => {
    setLoading(true)
    try { const r = await apiFetch<{ data: Analisa }>('/api/v1/ai/negosiasi-assistant', { method: 'POST', body: JSON.stringify(data) }); setAnalisa(r.data) }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setLoading(false) }
  }
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">AI Negosiasi Assistant</h1><p className="text-muted-foreground mt-1">Analisa permintaan negosiasi harga</p></div>
      <Card><CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Quotation</label>
              <select {...register('quotation_id')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Pilih</option>{qOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="space-y-2"><label className="text-sm font-medium">Barang</label>
              <select {...register('barang_id')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Pilih</option>{barangOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="space-y-2"><label className="text-sm font-medium">Harga Diminta</label><Input type="number" step="0.01" {...register('harga_diminta')} /></div>
          </div>
          <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}Analisa</Button>
        </form>
      </CardContent></Card>
      {analisa && (
        <Card><CardHeader><CardTitle className="text-lg">Hasil Analisa</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div><p className="text-sm text-muted-foreground">Harga Diminta</p><p className="text-xl font-bold">Rp {analisa.harga_diminta.toLocaleString('id-ID')}</p></div>
            <div><p className="text-sm text-muted-foreground">Harga Minimal Disetujui</p><p className="text-xl font-bold text-emerald-600">Rp {analisa.harga_terendah_disetujui.toLocaleString('id-ID')}</p></div>
            <div><p className="text-sm text-muted-foreground">Margin Proyeksi</p><p className={`text-xl font-bold ${analisa.margin_projected >= 0.1 ? 'text-emerald-600' : 'text-red-600'}`}>{Math.round(analisa.margin_projected * 100)}%</p></div>
          </div>
          <div className="p-4 border rounded-lg bg-muted/30">
            <p className="text-sm"><strong>Rekomendasi:</strong> {analisa.rekomendasi}</p>
            <Badge className="mt-2" variant={analisa.level_wewenang === 'sales' ? 'success' : analisa.level_wewenang === 'manager' ? 'warning' : 'destructive'}>
              Approval: {analisa.level_wewenang.toUpperCase()}
            </Badge>
          </div>
        </CardContent></Card>
      )}
    </div>
  )
}
