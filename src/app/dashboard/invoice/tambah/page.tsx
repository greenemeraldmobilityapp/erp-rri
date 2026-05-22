"use client"
import { useState, useEffect } from 'react'; import { useRouter } from 'next/navigation'; import { z } from 'zod'; import { useForm, useFieldArray } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

const itemSchema = z.object({ barang_id: z.string().min(1), harga: z.coerce.number().positive(), jumlah: z.coerce.number().int().positive(), diskon: z.coerce.number().optional(), ppn: z.coerce.number().optional(), pph: z.coerce.number().optional(), keterangan: z.string().optional() })
const schema = z.object({ sales_order_id: z.string().min(1), customer_id: z.string().min(1), tanggal: z.string().min(1), top: z.string().min(1), ppn_rate: z.coerce.number().optional().default(0.11), pph_rate: z.coerce.number().optional(), items: z.array(itemSchema).min(1) })
type FV = z.input<typeof schema>

export default function TambahInvoicePage() {
  const router = useRouter(); const [soOpts, setSoOpts] = useState<Array<{ value: string; label: string }>>([]); const [custOpts, setCustOpts] = useState<Array<{ value: string; label: string }>>([]); const [barangOpts, setBarangOpts] = useState<Array<{ value: string; label: string }>>([]); const [submitting, setSubmitting] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const { register, handleSubmit, control, formState: { errors } } = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { tanggal: today, ppn_rate: 0.11, items: [{ barang_id: '', harga: 0, jumlah: 1 }] } })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  useEffect(() => {
    Promise.all([
      apiFetch<Array<{ id: string; nomor: string }>>('/api/v1/sales-order'),
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/customer'),
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/barang'),
    ]).then(([so, c, b]) => { setSoOpts((so.data ?? []).map(x => ({ value: x.id, label: x.nomor }))); setCustOpts((c.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` }))); setBarangOpts((b.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` }))) }).catch(() => toast.error('Gagal'))
  }, [])
  const onSubmit = async (data: FV) => {
    setSubmitting(true); try { await apiFetch('/api/v1/invoice', { method: 'POST', body: JSON.stringify(data) }); toast.success('Invoice berhasil!'); router.push('/dashboard/invoice') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setSubmitting(false) }
  }
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><a href="/dashboard/invoice"><ArrowLeft className="h-5 w-5" /></a></Button><div><h1 className="text-3xl font-heading font-bold">Tambah Invoice</h1></div></div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card><CardHeader><CardTitle className="text-base">Informasi</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Sales Order *</label>
              <select {...register('sales_order_id')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"><option value="">Pilih</option>{soOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="space-y-2"><label className="text-sm font-medium">Customer *</label>
              <select {...register('customer_id')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"><option value="">Pilih</option>{custOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="space-y-2"><label className="text-sm font-medium">Tanggal *</label><Input type="date" {...register('tanggal')} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">TOP *</label><Input {...register('top')} placeholder="e.g. 30 Hari" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">PPN Rate</label><Input type="number" step="0.01" {...register('ppn_rate')} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">PPh Rate</label><Input type="number" step="0.01" {...register('pph_rate')} /></div>
          </div>
        </CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Item</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ barang_id: '', harga: 0, jumlah: 1 })}><Plus className="h-4 w-4 mr-1" />Tambah</Button></CardHeader>
          <CardContent className="space-y-4">{fields.map((f, i) => (
            <div key={f.id} className="p-4 border rounded-lg space-y-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Item #{i+1}</span>{fields.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2"><label className="text-xs font-medium">Barang *</label>
                  <select {...register(`items.${i}.barang_id`)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"><option value="">Pilih</option>{barangOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                <div className="space-y-2"><label className="text-xs font-medium">Harga *</label><Input type="number" step="0.01" {...register(`items.${i}.harga`)} /></div>
                <div className="space-y-2"><label className="text-xs font-medium">Jumlah *</label><Input type="number" min="1" {...register(`items.${i}.jumlah`)} /></div>
                <div className="space-y-2"><label className="text-xs font-medium">Diskon</label><Input type="number" step="0.01" {...register(`items.${i}.diskon`)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><label className="text-xs font-medium">PPN</label><Input type="number" step="0.01" {...register(`items.${i}.ppn`)} /></div>
                <div className="space-y-2"><label className="text-xs font-medium">PPh</label><Input type="number" step="0.01" {...register(`items.${i}.pph`)} /></div>
                <div className="space-y-2"><label className="text-xs font-medium">Keterangan</label><Input {...register(`items.${i}.keterangan`)} /></div>
              </div>
            </div>
          ))}</CardContent></Card>
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" asChild><a href="/dashboard/invoice">Batal</a></Button>
          <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitting ? '...' : 'Simpan Invoice'}</Button></div>
      </form>
    </div>
  )
}
