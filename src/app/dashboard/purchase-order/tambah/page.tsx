"use client"
import { useState, useEffect } from 'react'; import { useRouter } from 'next/navigation'; import { z } from 'zod'; import { useForm, useFieldArray } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

const itemSchema = z.object({ barang_id: z.string().min(1), jumlah: z.coerce.number().int().positive(), harga_satuan: z.coerce.number().nonnegative(), link_produk: z.string().optional(), nama_toko: z.string().optional(), marketplace: z.string().optional() })
const schema = z.object({ supplier_id: z.string().min(1), purchase_request_id: z.string().optional(), tanggal: z.string().min(1), terms_of_payment: z.string().optional(), items: z.array(itemSchema).min(1) })
type FV = z.input<typeof schema>

export default function TambahPoPage() {
  const router = useRouter(); const [supOpts, setSupOpts] = useState<Array<{ value: string; label: string }>>([]); const [prOpts, setPrOpts] = useState<Array<{ value: string; label: string }>>([]); const [barangOpts, setBarangOpts] = useState<Array<{ value: string; label: string }>>([]); const [submitting, setSubmitting] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const { register, handleSubmit, control, formState: { errors } } = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { tanggal: today, items: [{ barang_id: '', jumlah: 1, harga_satuan: 0 }] } })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  useEffect(() => {
    Promise.all([
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/supplier'),
      apiFetch<Array<{ id: string; nomor: string }>>('/api/v1/purchase-request'),
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/barang'),
    ]).then(([sup, pr, b]) => { setSupOpts((sup.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` }))); setPrOpts((pr.data ?? []).map(x => ({ value: x.id, label: x.nomor }))); setBarangOpts((b.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` }))) }).catch(() => toast.error('Gagal'))
  }, [])
  const onSubmit = async (data: FV) => {
    setSubmitting(true); try { await apiFetch('/api/v1/purchase-order', { method: 'POST', body: JSON.stringify(data) }); toast.success('PO berhasil!'); router.push('/dashboard/purchase-order') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setSubmitting(false) }
  }
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><a href="/dashboard/purchase-order"><ArrowLeft className="h-5 w-5" /></a></Button>
        <div><h1 className="text-3xl font-heading font-bold">Tambah PO</h1><p className="text-muted-foreground mt-1">Purchase Order ke Supplier</p></div></div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card><CardHeader><CardTitle className="text-base">Informasi PO</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Supplier *</label>
              <select {...register('supplier_id')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"><option value="">Pilih</option>{supOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="space-y-2"><label className="text-sm font-medium">Tanggal *</label><Input type="date" {...register('tanggal')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">PR Reference</label>
              <select {...register('purchase_request_id')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"><option value="">Pilih PR</option>{prOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="space-y-2"><label className="text-sm font-medium">Terms of Payment</label><Input {...register('terms_of_payment')} placeholder="Net 30" /></div>
          </div>
        </CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Item</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ barang_id: '', jumlah: 1, harga_satuan: 0 })}><Plus className="h-4 w-4 mr-1" />Tambah</Button></CardHeader>
          <CardContent className="space-y-4">{fields.map((f, i) => (
            <div key={f.id} className="p-4 border rounded-lg space-y-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Item #{i+1}</span>{fields.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2"><label className="text-xs font-medium">Barang *</label>
                  <select {...register(`items.${i}.barang_id`)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"><option value="">Pilih</option>{barangOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                <div className="space-y-2"><label className="text-xs font-medium">Jumlah *</label><Input type="number" min="1" {...register(`items.${i}.jumlah`)} /></div>
                <div className="space-y-2"><label className="text-xs font-medium">Harga *</label><Input type="number" min="0" {...register(`items.${i}.harga_satuan`)} /></div>
                <div className="space-y-2"><label className="text-xs font-medium">Toko</label><Input {...register(`items.${i}.nama_toko`)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><label className="text-xs font-medium">Link Produk</label><Input {...register(`items.${i}.link_produk`)} /></div>
                <div className="space-y-2"><label className="text-xs font-medium">Marketplace</label><Input {...register(`items.${i}.marketplace`)} /></div>
              </div>
            </div>
          ))}</CardContent></Card>
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" asChild><a href="/dashboard/purchase-order">Batal</a></Button>
          <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitting ? '...' : 'Simpan PO'}</Button></div>
      </form>
    </div>
  )
}
