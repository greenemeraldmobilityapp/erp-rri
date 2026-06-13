"use client"
import { useState, useEffect } from 'react'; import { useRouter } from 'next/navigation'; import { z } from 'zod'; import { useForm, useFieldArray } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; import { DatePicker } from '@/components/ui/date-picker'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import Link from 'next/link'; import { Plus, Trash2, ArrowLeft, Loader2, Package } from 'lucide-react'; import { toast } from 'sonner'

const itemSchema = z.object({ barang_id: z.string().min(1), jumlah: z.coerce.number().int().positive(), keterangan: z.string().optional() })
const schema = z.object({ purchase_order_id: z.string().min(1), tanggal: z.string().min(1), keterangan: z.string().optional(), items: z.array(itemSchema).min(1) })
type FV = z.input<typeof schema>

export default function TambahReceivingPage() {
  const router = useRouter(); const [poOpts, setPoOpts] = useState<Array<{ value: string; label: string }>>([]); const [barangMap, setBarangMap] = useState<Record<string, { nama: string; kode: string }>>({}); const [submitting, setSubmitting] = useState(false); const [loadingItems, setLoadingItems] = useState(false); const [poItems, setPoItems] = useState<Array<{ barang_id: string; jumlah: number; keterangan: string | null; barang: { nama: string; kode: string } }>>([])
  const today = new Date().toISOString().split('T')[0]
  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { tanggal: today, items: [{ barang_id: '', jumlah: 1 }] } })
  const { register, handleSubmit, control, watch, setValue } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const selectedPoId = watch('purchase_order_id')

  useEffect(() => {
    Promise.all([apiFetch<Array<{ id: string; nomor: string }>>('/api/v1/purchase-order'), apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/barang/dropdown')])
      .then(([po, b]) => {
        setPoOpts((po.data ?? []).map(x => ({ value: x.id, label: x.nomor })))
        const map: Record<string, { nama: string; kode: string }> = {}
        ;(b.data ?? []).forEach(x => { map[x.id] = { nama: x.nama, kode: x.kode } })
        setBarangMap(map)
      }).catch(() => toast.error('Gagal'))
  }, [])

  useEffect(() => {
    if (!selectedPoId) { setPoItems([]); return }
    setLoadingItems(true)
    apiFetch<{ items: Array<{ barang_id: string; jumlah: number; keterangan: string | null; barang: { nama: string; kode: string } }> }>(`/api/v1/purchase-order/${selectedPoId}`)
      .then((res) => {
        const items = res.data.items || []
        setPoItems(items)
        if (items.length > 0) {
          setValue('items', items.map(i => ({ barang_id: i.barang_id, jumlah: i.jumlah, keterangan: i.keterangan || '' })))
        }
      })
      .catch(() => toast.error('Gagal memuat item PO'))
      .finally(() => setLoadingItems(false))
  }, [selectedPoId, setValue])

  const onSubmit = async (data: FV) => {
    setSubmitting(true); try { await apiFetch('/api/v1/purchase-receiving', { method: 'POST', body: JSON.stringify(data) }); toast.success('Penerimaan berhasil!'); router.push('/dashboard/purchase-receiving') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan') } finally { setSubmitting(false) }
  }
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><Link href="/dashboard/purchase-receiving"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Tambah Receiving</h1><p className="text-sm text-muted-foreground">Pilih PO, item akan otomatis terisi</p></div></div>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">Informasi</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={control} name="purchase_order_id" render={({ field }) => (
                <FormItem><FormLabel>Purchase Order *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih PO" /></SelectTrigger></FormControl>
                    <SelectContent>{poOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="tanggal" render={({ field }) => (
                <FormItem><FormLabel>Tanggal *</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={control} name="keterangan" render={({ field }) => (
              <FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Item Barang</CardTitle>
            {selectedPoId && poItems.length > 0 && <span className="text-xs text-muted-foreground flex items-center gap-1"><Package className="h-3 w-3" />{poItems.length} item dari PO</span>}
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingItems ? <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /><span className="ml-2 text-sm text-muted-foreground">Memuat item PO...</span></div> :
              !selectedPoId ? <p className="text-sm text-muted-foreground py-4 text-center">Pilih Purchase Order untuk memuat item</p> :
              <>{fields.map((f, i) => (
                <div key={f.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Item #{i + 1}</span>
                    {fields.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Barang *</label>
                      <input type="hidden" {...register(`items.${i}.barang_id`)} />
                      <div className="h-9 px-3 rounded-md border bg-muted/50 flex items-center text-sm">
                        {barangMap[poItems[i]?.barang_id] ? `[${barangMap[poItems[i].barang_id].kode}] ${barangMap[poItems[i].barang_id].nama}` : '-'}
                      </div>
                    </div>
                    <div className="space-y-2"><label className="text-xs font-medium">Jumlah *</label><Input type="number" min="1" {...register(`items.${i}.jumlah`)} /></div>
                    <div className="space-y-2"><label className="text-xs font-medium">Keterangan</label><Input {...register(`items.${i}.keterangan`)} /></div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ barang_id: '', jumlah: 1 })}><Plus className="h-4 w-4 mr-1" />Tambah Item</Button>
              </>}
          </CardContent></Card>
          <div className="flex justify-end gap-3"><Button type="button" variant="cancel"><Link href="/dashboard/purchase-receiving">Batal</Link></Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitting ? '...' : 'Simpan'}</Button></div>
        </form>
      </Form>
    </div>
  )
}
