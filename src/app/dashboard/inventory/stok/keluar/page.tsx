"use client"
import { useState, useEffect } from 'react'; import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

export default function StokKeluarPage() {
  const router = useRouter(); const [brgOpts, setBrgOpts] = useState<Array<{ value: string; label: string }>>([]); const [gudOpts, setGudOpts] = useState<Array<{ value: string; label: string }>>([]); const [submitting, setSubmitting] = useState(false)
  useEffect(() => {
    apiFetch<{ data: Array<{ id: string; nama: string; kode: string }> }>('/api/v1/master/barang').then(r => setBrgOpts((r.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` })))).catch(() => {})
    apiFetch<{ data: Array<{ id: string; nama: string }> }>('/api/v1/master/gudang').then(r => setGudOpts((r.data ?? []).map(x => ({ value: x.id, label: x.nama })))).catch(() => {})
  }, [])
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSubmitting(true); const fd = new FormData(e.currentTarget)
    try { await apiFetch('/api/v1/stok', { method: 'POST', body: JSON.stringify({ tipe: 'keluar', barang_id: fd.get('barang_id'), gudang_id: fd.get('gudang_id'), jumlah: Number(fd.get('jumlah')), keterangan: fd.get('keterangan') }) }); toast.success('Stok keluar dicatat!'); router.push('/dashboard/inventory/stok') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setSubmitting(false) }
  }
  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><a href="/dashboard/inventory/stok"><ArrowLeft className="h-5 w-5" /></a></Button><div><h1 className="text-3xl font-heading font-bold">Stok Keluar</h1></div></div>
      <form onSubmit={onSubmit} className="space-y-6"><Card><CardHeader><CardTitle className="text-base">Data Pengeluaran Barang</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="space-y-2"><label className="text-sm font-medium">Barang *</label>
          <select name="barang_id" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Pilih Barang</option>{brgOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><label className="text-sm font-medium">Gudang</label>
            <select name="gudang_id" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Pilih</option>{gudOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div className="space-y-2"><label className="text-sm font-medium">Jumlah *</label><Input type="number" name="jumlah" min="1" required placeholder="0" /></div>
        </div>
        <div className="space-y-2"><label className="text-sm font-medium">Keterangan</label><Textarea name="keterangan" rows={2} placeholder="Pengiriman ke customer..." /></div>
      </CardContent></Card><div className="flex justify-end gap-3"><Button type="button" variant="outline" asChild><a href="/dashboard/inventory/stok">Batal</a></Button>
        <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitting ? '...' : 'Simpan'}</Button></div></form>
    </div>
  )
}
