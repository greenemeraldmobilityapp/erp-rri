"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'; import { useRouter } from 'next/navigation'; import { z } from 'zod'; import { useForm, useFieldArray } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

const itemSchema = z.object({ barang_id: z.string().min(1), jumlah: z.coerce.number().int().positive(), harga_satuan: z.coerce.number().nonnegative(), keterangan: z.string().optional() })
const schema = z.object({ customer_id: z.string().min(1), quotation_id: z.string().optional(), tanggal: z.string().min(1), nomor_po_customer: z.string().optional(), terms_of_payment: z.string().optional(), items: z.array(itemSchema).min(1) })
type FV = z.input<typeof schema>

export default function TambahPoPage() {
  const router = useRouter(); const [custOpts, setCustOpts] = useState<Array<{ value: string; label: string }>>([]); const [barangOpts, setBarangOpts] = useState<Array<{ value: string; label: string }>>([]); const [submitting, setSubmitting] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { tanggal: today, items: [{ barang_id: '', jumlah: 1, harga_satuan: 0 }] } })
  const { register, handleSubmit, control } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  useEffect(() => {
    Promise.all([apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/customer'), apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/barang')])
      .then(([c, b]) => { setCustOpts((c.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` }))); setBarangOpts((b.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` }))) })
      .catch(() => toast.error('Gagal memuat data'))
  }, [])
  const onSubmit = async (data: FV) => {
    setSubmitting(true); try { await apiFetch('/api/v1/customer-po', { method: 'POST', body: JSON.stringify(data) }); toast.success('PO berhasil!'); router.push('/dashboard/customer-po') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setSubmitting(false) }
  }
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><Link href="/dashboard/customer-po"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Tambah Customer PO</h1><p className="text-muted-foreground mt-1">Purchase Order dari customer</p></div></div>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">Informasi PO</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={control} name="nomor_po_customer" render={({ field }) => (
                <FormItem><FormLabel>Nomor PO Customer</FormLabel><FormControl><Input {...field} placeholder="Dari customer" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="terms_of_payment" render={({ field }) => (
                <FormItem><FormLabel>Terms of Payment</FormLabel><FormControl><Input {...field} placeholder="Net 30" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Item</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ barang_id: '', jumlah: 1, harga_satuan: 0 })}><Plus className="h-4 w-4 mr-1" />Tambah</Button></CardHeader>
            <CardContent className="space-y-4">{fields.map((f, i) => (
              <div key={f.id} className="p-4 border rounded-lg space-y-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Item #{i+1}</span>{fields.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={control} name={`items.${i}.barang_id`} render={({ field }) => (
                    <FormItem><FormLabel>Barang *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                        <SelectContent>{barangOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="space-y-2"><label className="text-xs font-medium">Jumlah *</label><Input type="number" min="1" {...register(`items.${i}.jumlah`)} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium">Harga *</label><Input type="number" min="0" {...register(`items.${i}.harga_satuan`)} /></div>
                </div>
              </div>
            ))}</CardContent></Card>
          <div className="flex justify-end gap-3"><Button type="button" variant="cancel"><Link href="/dashboard/customer-po">Batal</Link></Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitting ? 'Menyimpan...' : 'Simpan PO'}</Button></div>
        </form>
      </Form>
    </div>
  )
}
