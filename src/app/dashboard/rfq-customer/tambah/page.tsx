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
import { DatePicker } from '@/components/ui/date-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const itemSchema = z.object({
  barang_id: z.string().optional(),
  nama_barang: z.string().optional(),
  jumlah: z.coerce.number().int().positive('Jumlah harus > 0'),
  satuan: z.string().optional(),
  keterangan: z.string().optional(),
})

const rfqSchema = z.object({
  customer_id: z.string().min(1, 'Customer harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  perihal: z.string().optional(),
  keterangan: z.string().optional(),
  items: z.array(itemSchema).optional(),
})

type RfqFormValues = z.input<typeof rfqSchema>

export default function TambahRfqCustomerPage() {
  const router = useRouter()
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string }>>([])
  const [barangOptions, setBarangOptions] = useState<Array<{ value: string; label: string; satuan: string }>>([])
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const form = useForm<RfqFormValues>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      tanggal: today,
      perihal: 'Permintaan Penawaran',
      items: [],
    },
  })

  const { handleSubmit, control, register, setValue } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    Promise.all([
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/customer'),
      apiFetch<Array<{ id: string; nama: string; kode: string; satuan: string }>>('/api/v1/master/barang'),
    ]).then(([customers, barang]) => {
      setCustomerOptions((customers.data ?? []).map(c => ({ value: c.id, label: `[${c.kode}] ${c.nama}` })))
      setBarangOptions((barang.data ?? []).map(b => ({ value: b.id, label: `[${b.kode}] ${b.nama}`, satuan: b.satuan })))
    }).catch(() => toast.error('Gagal memuat data referensi'))
  }, [])

  const onSubmit = async (data: RfqFormValues) => {
    setSubmitting(true)
    try {
      await apiFetch('/api/v1/rfq-customer', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      toast.success('RFQ Customer berhasil dibuat!')
      router.push('/dashboard/rfq-customer')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/rfq-customer"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold">Buat RFQ Customer Baru</h1>
          <p className="text-muted-foreground mt-1">Request for Quotation dari Customer</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi RFQ Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <FormItem><FormLabel>Tanggal *</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={control} name="perihal" render={({ field }) => (
                  <FormItem><FormLabel>Perihal</FormLabel><FormControl><Input {...field} placeholder="Permintaan Penawaran" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={control} name="keterangan" render={({ field }) => (
                <FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea {...field} placeholder="Catatan untuk RFQ Customer ini" rows={2} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Item Barang</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ barang_id: '', nama_barang: '', jumlah: 1 })}>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Barang (Master)</label>
                      <select
                        {...register(`items.${index}.barang_id`)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        onChange={(e) => {
                          const selected = barangOptions.find(b => b.value === e.target.value)
                          if (selected?.satuan) setValue(`items.${index}.satuan`, selected.satuan)
                        }}
                      >
                        <option value="">- Pilih Barang -</option>
                        {barangOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Nama Barang (Manual)</label>
                      <Input {...register(`items.${index}.nama_barang`)} placeholder="Jika tidak ada di master" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2"><label className="text-xs font-medium">Jumlah *</label><Input type="number" min="1" {...register(`items.${index}.jumlah`)} /></div>
                    <div className="space-y-2"><label className="text-xs font-medium">Satuan</label><Input {...register(`items.${index}.satuan`)} placeholder="pcs" /></div>
                    <div className="space-y-2"><label className="text-xs font-medium">Keterangan</label><Input {...register(`items.${index}.keterangan`)} placeholder="Spesifikasi / catatan" /></div>
                  </div>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada item. Klik Tambah Item untuk menambahkan.</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="cancel">
              <Link href="/dashboard/rfq-customer">Batal</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? 'Menyimpan...' : 'Simpan RFQ Customer'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
