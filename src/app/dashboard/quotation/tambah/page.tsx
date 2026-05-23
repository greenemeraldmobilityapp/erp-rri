"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { FormSkeleton } from '@/components/ui/skeleton'

const itemSchema = z.object({
  barang_id: z.string().min(1, 'Barang harus dipilih'),
  jumlah: z.coerce.number().int().positive('Jumlah harus > 0'),
  harga_satuan: z.coerce.number().nonnegative('Harga harus diisi'),
  diskon: z.coerce.number().nonnegative().optional(),
  keterangan: z.string().optional(),
})

const qtnSchema = z.object({
  customer_id: z.string().min(1, 'Customer harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  ppn_rate: z.coerce.number().nonnegative().default(0.11),
  keterangan: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Minimal 1 item'),
})

type QtnFormValues = z.input<typeof qtnSchema>

export default function TambahQuotationPage() {
  const router = useRouter()
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string }>>([])
  const [barangOptions, setBarangOptions] = useState<Array<{ value: string; label: string }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  const form = useForm<QtnFormValues>({
    resolver: zodResolver(qtnSchema),
    defaultValues: {
      tanggal: today,
      ppn_rate: 0.11,
      items: [{ barang_id: '', jumlah: 1, harga_satuan: 0, diskon: 0, keterangan: '' }],
    },
  })

  const { register, handleSubmit, control } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    Promise.all([
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/customer'),
      apiFetch<Array<{ id: string; nama: string; kode: string; satuan: string }>>('/api/v1/master/barang'),
    ]).then(([customers, barang]) => {
      setCustomerOptions((customers.data ?? []).map(c => ({ value: c.id, label: `[${c.kode}] ${c.nama}` })))
      setBarangOptions((barang.data ?? []).map(b => ({ value: b.id, label: `[${b.kode}] ${b.nama}` })))
    }).catch(() => toast.error('Gagal memuat data referensi')).finally(() => setLoading(false))
  }, [])

  const onSubmit = async (data: QtnFormValues) => {
    setSubmitting(true)
    try {
      await apiFetch('/api/v1/quotation', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      toast.success('Quotation berhasil dibuat!')
      router.push('/dashboard/quotation')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }
  if (loading) return <FormSkeleton />
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/quotation"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold">Buat Quotation</h1>
          <p className="text-muted-foreground mt-1">Penawaran harga untuk customer</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Quotation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField control={control} name="customer_id" render={({ field }) => (
                  <FormItem><FormLabel>Customer *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih Customer" /></SelectTrigger></FormControl>
                      <SelectContent>{customerOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="tanggal" render={({ field }) => (
                  <FormItem><FormLabel>Tanggal *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="space-y-2"><label className="text-sm font-medium">PPN Rate (%)</label><Input type="number" step="0.01" min="0" max="100" {...register('ppn_rate')} /></div>
              </div>
              <FormField control={control} name="keterangan" render={({ field }) => (
                <FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea {...field} placeholder="Term and conditions, validity period, etc." rows={2} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Item Penawaran</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ barang_id: '', jumlah: 1, harga_satuan: 0 })}>
                <Plus className="h-4 w-4 mr-1" />Tambah Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Item #{index + 1}</span>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <FormField control={control} name={`items.${index}.barang_id`} render={({ field }) => (
                      <FormItem className="col-span-2"><FormLabel>Barang *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Pilih Barang" /></SelectTrigger></FormControl>
                          <SelectContent>{barangOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="space-y-2"><label className="text-xs font-medium">Jumlah *</label><Input type="number" min="1" {...register(`items.${index}.jumlah`)} /></div>
                    <div className="space-y-2"><label className="text-xs font-medium">Harga Satuan *</label><Input type="number" min="0" step="1" {...register(`items.${index}.harga_satuan`)} placeholder="0" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><label className="text-xs font-medium">Diskon (%)</label><Input type="number" min="0" max="100" step="0.01" {...register(`items.${index}.diskon`)} placeholder="0" /></div>
                    <div className="space-y-2"><label className="text-xs font-medium">Keterangan</label><Input {...register(`items.${index}.keterangan`)} placeholder="Spesifikasi / catatan" /></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/quotation">Batal</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? 'Menyimpan...' : 'Simpan Quotation'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
