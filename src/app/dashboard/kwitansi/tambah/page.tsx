"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'; import { useRouter } from 'next/navigation'; import { z } from 'zod'; import { useForm, useFieldArray } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

const itemSchema = z.object({ invoice_item_id: z.string().min(1), jumlah: z.coerce.number().positive() })
const schema = z.object({ invoice_id: z.string().min(1), tanggal: z.string().min(1), keterangan: z.string().optional(), items: z.array(itemSchema).min(1) })
type FV = z.input<typeof schema>

export default function TambahKwitansiPage() {
  const router = useRouter(); const [invOpts, setInvOpts] = useState<Array<{ value: string; label: string }>>([]); const [submitting, setSubmitting] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { tanggal: today, items: [{ invoice_item_id: '', jumlah: 0 }] } })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  useEffect(() => {
    Promise.all([
      apiFetch<Array<{ id: string; nomor: string }>>('/api/v1/invoice'),
      apiFetch<Array<{ id: string; harga: number; barang_id: string }>>('/api/v1/invoice'),
    ]).then(async ([inv]) => {
      setInvOpts((inv.data ?? []).map(x => ({ value: x.id, label: x.nomor })))
    }).catch(() => toast.error('Gagal'))
  }, [])
  useEffect(() => {
    if (!fields.length) return
    apiFetch<{ items: Array<{ id: string; harga: number; barang_id: string }> }>(`/api/v1/invoice/${fields[0]}`).then(() => {
      // This will be called when invoice changes - we'll use a different approach
    }).catch(() => {})
  }, [fields])
  const onSubmit = async (data: FV) => {
    setSubmitting(true); try { await apiFetch('/api/v1/kwitansi', { method: 'POST', body: JSON.stringify(data) }); toast.success('Kwitansi berhasil!'); router.push('/dashboard/kwitansi') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan') } finally { setSubmitting(false) }
  }
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><Link href="/dashboard/kwitansi"><ArrowLeft className="h-5 w-5" /></Link></Button><div><h1 className="text-3xl font-heading font-bold">Tambah Kwitansi</h1></div></div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">Informasi</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="invoice_id" render={({ field }) => (
                <FormItem><FormLabel>Invoice</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Pilih invoice" /></SelectTrigger></FormControl>
                  <SelectContent>{invOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
              )} />
              <div className="space-y-2"><label className="text-sm font-medium">Tanggal *</label><Input type="date" {...form.register('tanggal')} /></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">Keterangan</label><Textarea {...form.register('keterangan')} rows={2} /></div>
          </CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Item Invoice</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ invoice_item_id: '', jumlah: 0 })}><Plus className="h-4 w-4 mr-1" />Tambah</Button></CardHeader>
            <CardContent className="space-y-4">{fields.map((f, i) => (
              <div key={f.id} className="p-4 border rounded-lg space-y-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Item #{i+1}</span>{fields.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><label className="text-xs font-medium">Invoice Item *</label><Input {...form.register(`items.${i}.invoice_item_id`)} placeholder="ID Item" /></div>
                  <div className="space-y-2"><label className="text-xs font-medium">Jumlah *</label><Input type="number" step="0.01" {...form.register(`items.${i}.jumlah`)} /></div>
                </div>
              </div>
            ))}</CardContent></Card>
          <div className="flex justify-end gap-3"><Button type="button" variant="cancel" asChild><Link href="/dashboard/kwitansi">Batal</Link></Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitting ? '...' : 'Simpan Kwitansi'}</Button></div>
        </form>
      </Form>
    </div>
  )
}
