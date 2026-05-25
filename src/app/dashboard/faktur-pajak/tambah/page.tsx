"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'; import { useRouter } from 'next/navigation'; import { z } from 'zod'; import { useForm, useFieldArray } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

const itemSchema = z.object({ invoice_item_id: z.string().min(1), harga: z.coerce.number().positive(), dpp: z.coerce.number().positive(), ppn: z.coerce.number().positive(), pph: z.coerce.number().optional() })
const schema = z.object({ invoice_id: z.string().min(1), nomor_faktur: z.string().min(1), tanggal: z.string().min(1), dpp: z.coerce.number().positive(), ppn: z.coerce.number().positive(), pph: z.coerce.number().optional(), items: z.array(itemSchema).min(1) })
type FV = z.input<typeof schema>

export default function TambahFakturPajakPage() {
  const router = useRouter(); const [invOpts, setInvOpts] = useState<Array<{ value: string; label: string }>>([]); const [submitting, setSubmitting] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { tanggal: today, items: [{ invoice_item_id: '', harga: 0, dpp: 0, ppn: 0 }] } })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  useEffect(() => {
    apiFetch<Array<{ id: string; nomor: string }>>('/api/v1/invoice')
      .then(inv => setInvOpts((inv.data ?? []).map(x => ({ value: x.id, label: x.nomor })))).catch(() => toast.error('Gagal'))
  }, [])
  const onSubmit = async (data: FV) => {
    setSubmitting(true); try { await apiFetch('/api/v1/faktur-pajak', { method: 'POST', body: JSON.stringify(data) }); toast.success('Faktur Pajak berhasil!'); router.push('/dashboard/faktur-pajak') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setSubmitting(false) }
  }
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><Link href="/dashboard/faktur-pajak"><ArrowLeft className="h-5 w-5" /></Link></Button><div><h1 className="text-3xl font-heading font-bold">Tambah Faktur Pajak</h1></div></div>
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
              <div className="space-y-2"><label className="text-sm font-medium">Nomor Faktur *</label><Input {...form.register('nomor_faktur')} placeholder="010.000-25.12345678" /></div>
              <div className="space-y-2"><label className="text-sm font-medium">DPP *</label><Input type="number" step="0.01" {...form.register('dpp')} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">PPN *</label><Input type="number" step="0.01" {...form.register('ppn')} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">PPh</label><Input type="number" step="0.01" {...form.register('pph')} /></div>
            </div>
          </CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Item Invoice</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ invoice_item_id: '', harga: 0, dpp: 0, ppn: 0 })}><Plus className="h-4 w-4 mr-1" />Tambah</Button></CardHeader>
            <CardContent className="space-y-4">{fields.map((f, i) => (
              <div key={f.id} className="p-4 border rounded-lg space-y-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Item #{i+1}</span>{fields.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-2"><label className="text-xs font-medium">Invoice Item ID *</label><Input {...form.register(`items.${i}.invoice_item_id`)} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium">Harga *</label><Input type="number" step="0.01" {...form.register(`items.${i}.harga`)} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium">DPP *</label><Input type="number" step="0.01" {...form.register(`items.${i}.dpp`)} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium">PPN *</label><Input type="number" step="0.01" {...form.register(`items.${i}.ppn`)} /></div>
                </div>
              </div>
            ))}</CardContent></Card>
          <div className="flex justify-end gap-3"><Button type="button" className="bg-red-500/70 text-white hover:bg-red-500/90" asChild><Link href="/dashboard/faktur-pajak">Batal</Link></Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitting ? '...' : 'Simpan Faktur Pajak'}</Button></div>
        </form>
      </Form>
    </div>
  )
}
