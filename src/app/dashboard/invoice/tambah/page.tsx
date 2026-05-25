"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'; import { useRouter } from 'next/navigation'; import { z } from 'zod'; import { useForm, useFieldArray } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'; import { FormSkeleton } from '@/components/ui/skeleton'

const itemSchema = z.object({ barang_id: z.string().min(1), harga: z.coerce.number().positive(), jumlah: z.coerce.number().int().positive(), diskon: z.coerce.number().optional(), ppn: z.coerce.number().optional(), pph: z.coerce.number().optional(), keterangan: z.string().optional() })
const schema = z.object({ sales_order_id: z.string().min(1), customer_id: z.string().min(1), tanggal: z.string().min(1), top: z.string().min(1), ppn_rate: z.coerce.number().optional().default(0.11), pph_rate: z.coerce.number().optional(), items: z.array(itemSchema).min(1) })
type FV = z.input<typeof schema>

export default function TambahInvoicePage() {
  const router = useRouter(); const [soOpts, setSoOpts] = useState<Array<{ value: string; label: string }>>([]); const [custOpts, setCustOpts] = useState<Array<{ value: string; label: string }>>([]); const [barangOpts, setBarangOpts] = useState<Array<{ value: string; label: string }>>([]); const [submitting, setSubmitting] = useState(false); const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]
  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { tanggal: today, ppn_rate: 0.11, items: [{ barang_id: '', harga: 0, jumlah: 1 }] } })
  const { register, handleSubmit, control, watch } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items'); const ppnRate = (watch('ppn_rate') ?? 0.11) as number; const pphRate = watch('pph_rate') as (number | undefined)
  const calcSubtotal = (i: Record<string, unknown>) => Number(i.harga ?? 0) * Number(i.jumlah ?? 0) - Number(i.diskon ?? 0)
  const calcPPN = (i: Record<string, unknown>) => calcSubtotal(i) * ppnRate
  const calcPPh = (i: Record<string, unknown>) => pphRate ? calcSubtotal(i) * pphRate : 0
  const totalDpp = (watchedItems ?? []).reduce((s, i) => s + calcSubtotal(i), 0)
  const totalPPN = (watchedItems ?? []).reduce((s, i) => s + calcPPN(i), 0)
  const totalPPh = (watchedItems ?? []).reduce((s, i) => s + calcPPh(i), 0)
  const grandTotal = totalDpp + totalPPN - totalPPh

  useEffect(() => {
    Promise.all([
      apiFetch<Array<{ id: string; nomor: string }>>('/api/v1/sales-order'),
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/customer'),
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/barang'),
    ]).then(([so, c, b]) => { setSoOpts((so.data ?? []).map(x => ({ value: x.id, label: x.nomor }))); setCustOpts((c.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` }))); setBarangOpts((b.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` }))) }).catch(() => toast.error('Gagal')).finally(() => setLoading(false))
  }, [])
  const onSubmit = async (data: FV) => {
    const items = data.items.map(i => ({ ...i, ppn: i.ppn ?? calcPPN(i), pph: i.pph ?? (pphRate ? calcPPh(i) : undefined) }))
    setSubmitting(true); try { await apiFetch('/api/v1/invoice', { method: 'POST', body: JSON.stringify({ ...data, items }) }); toast.success('Invoice berhasil!'); router.push('/dashboard/invoice') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan') } finally { setSubmitting(false) }
  }
  if (loading) return <FormSkeleton />
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><Link href="/dashboard/invoice"><ArrowLeft className="h-5 w-5" /></Link></Button><div><h1 className="text-3xl font-heading font-bold">Tambah Invoice</h1></div></div>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">Informasi</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={control} name="sales_order_id" render={({ field }) => (
                <FormItem><FormLabel>Sales Order *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                    <SelectContent>{soOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="customer_id" render={({ field }) => (
                <FormItem><FormLabel>Customer *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                    <SelectContent>{custOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="tanggal" render={({ field }) => (
                <FormItem><FormLabel>Tanggal *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="top" render={({ field }) => (
                <FormItem><FormLabel>TOP *</FormLabel><FormControl><Input {...field} placeholder="e.g. 30 Hari" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="space-y-2"><label className="text-sm font-medium">PPN Rate</label><Input type="number" step="0.01" {...register('ppn_rate')} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">PPh Rate</label><Input type="number" step="0.01" {...register('pph_rate')} /></div>
            </div>
          </CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Item</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ barang_id: '', harga: 0, jumlah: 1 })}><Plus className="h-4 w-4 mr-1" />Tambah</Button></CardHeader>
            <CardContent className="space-y-4">{fields.map((f, i) => (
              <div key={f.id} className="p-4 border rounded-lg space-y-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Item #{i+1}</span>{fields.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>
                <div className="grid grid-cols-4 gap-3">
                  <FormField control={control} name={`items.${i}.barang_id`} render={({ field }) => (
                    <FormItem><FormLabel>Barang *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                        <SelectContent>{barangOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="space-y-2"><label className="text-xs font-medium">Harga *</label><Input type="number" step="0.01" {...register(`items.${i}.harga`)} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium">Jumlah *</label><Input type="number" min="1" {...register(`items.${i}.jumlah`)} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium">Diskon</label><Input type="number" step="0.01" {...register(`items.${i}.diskon`)} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2"><label className="text-xs font-medium">PPN <span className="text-muted-foreground">(auto: {(ppnRate * 100).toFixed(0)}%)</span></label><Input type="number" step="0.01" {...register(`items.${i}.ppn`)} placeholder={calcPPN(watchedItems?.[i] ?? {}).toLocaleString('id-ID')} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium">PPh {pphRate ? <span className="text-muted-foreground">({(pphRate * 100).toFixed(0)}%)</span> : ''}</label><Input type="number" step="0.01" {...register(`items.${i}.pph`)} placeholder={pphRate ? calcPPh(watchedItems?.[i] ?? {}).toLocaleString('id-ID') : '0'} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium">Keterangan</label><Input {...register(`items.${i}.keterangan`)} /></div>
                </div>
              </div>
            ))}
            <div className="border-t pt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">DPP</span><span>{totalDpp.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">PPN {(ppnRate * 100).toFixed(0)}%</span><span>{totalPPN.toLocaleString('id-ID')}</span></div>
              {pphRate ? <div className="flex justify-between"><span className="text-muted-foreground">PPh {(pphRate * 100).toFixed(0)}%</span><span>-{totalPPh.toLocaleString('id-ID')}</span></div> : null}
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Grand Total</span><span>{grandTotal.toLocaleString('id-ID')}</span></div>
            </div>
          </CardContent></Card>
          <div className="flex justify-end gap-3"><Button type="button" variant="cancel" asChild><Link href="/dashboard/invoice">Batal</Link></Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitting ? '...' : 'Simpan Invoice'}</Button></div>
        </form>
      </Form>
    </div>
  )
}
