"use client"
import { useState, useEffect } from 'react'; import { useRouter } from 'next/navigation'; import { z } from 'zod'; import { useForm, useFieldArray } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

const itemSchema = z.object({ quotation_item_id: z.string().min(1), harga_satuan_baru: z.coerce.number().nonnegative(), diskon_baru: z.coerce.number().nonnegative().optional(), alasan: z.string().optional() })
const schema = z.object({ quotation_id: z.string().min(1), tanggal: z.string().min(1), keterangan: z.string().optional(), items: z.array(itemSchema).min(1) })
type FV = z.input<typeof schema>

export default function TambahNegoiasiPage() {
  const router = useRouter(); const [qtnOpts, setQtnOpts] = useState<Array<{ value: string; label: string }>>([]); const [submitting, setSubmitting] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const { register, handleSubmit, control, formState: { errors } } = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { tanggal: today, items: [{ quotation_item_id: '', harga_satuan_baru: 0 }] } })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  useEffect(() => { apiFetch<Array<{ id: string; nomor: string }>>('/api/v1/quotation').then(r => setQtnOpts((r.data ?? []).map(q => ({ value: q.id, label: q.nomor })))).catch(() => toast.error('Gagal memuat data')) }, [])
  const onSubmit = async (data: FV) => {
    setSubmitting(true); try { await apiFetch('/api/v1/negoiasi', { method: 'POST', body: JSON.stringify(data) }); toast.success('Negosiasi berhasil!'); router.push('/dashboard/negoiasi') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setSubmitting(false) }
  }
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><a href="/dashboard/negoiasi"><ArrowLeft className="h-5 w-5" /></a></Button>
        <div><h1 className="text-3xl font-heading font-bold">Buat Negosiasi</h1><p className="text-muted-foreground mt-1">Negosiasi harga dengan customer</p></div></div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card><CardHeader><CardTitle className="text-base">Informasi</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Quotation *</label>
              <select {...register('quotation_id')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"><option value="">Pilih Quotation</option>{qtnOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="space-y-2"><label className="text-sm font-medium">Tanggal *</label><Input type="date" {...register('tanggal')} /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Keterangan</label><Textarea {...register('keterangan')} rows={2} /></div>
        </CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Item Negosiasi</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ quotation_item_id: '', harga_satuan_baru: 0 })}><Plus className="h-4 w-4 mr-1" />Tambah</Button></CardHeader>
          <CardContent className="space-y-4">{fields.map((f, i) => (
            <div key={f.id} className="p-4 border rounded-lg space-y-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Item #{i+1}</span>{fields.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><label className="text-xs font-medium">Quotation Item ID</label><Input {...register(`items.${i}.quotation_item_id`)} placeholder="item id" /></div>
                <div className="space-y-2"><label className="text-xs font-medium">Harga Baru *</label><Input type="number" min="0" {...register(`items.${i}.harga_satuan_baru`)} /></div>
                <div className="space-y-2"><label className="text-xs font-medium">Diskon Baru</label><Input type="number" min="0" step="0.01" {...register(`items.${i}.diskon_baru`)} /></div>
              </div>
              <div className="space-y-2"><label className="text-xs font-medium">Alasan</label><Input {...register(`items.${i}.alasan`)} /></div>
            </div>
          ))}</CardContent></Card>
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" asChild><a href="/dashboard/negoiasi">Batal</a></Button>
          <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitting ? 'Menyimpan...' : 'Simpan'}</Button></div>
      </form>
    </div>
  )
}
