"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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

const rfqItemSchema = z.object({
  barang_id: z.string().min(1, 'Barang harus dipilih'),
  jumlah: z.coerce.number().int().positive('Jumlah harus > 0'),
  satuan: z.string().optional(),
  harga_target: z.coerce.number().nonnegative().optional(),
  keterangan: z.string().optional(),
})

const rfqSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  sales_order_id: z.string().optional(),
  keterangan: z.string().optional(),
  items: z.array(rfqItemSchema).min(1, 'Minimal 1 item'),
})

type RfqFormValues = z.input<typeof rfqSchema>

export default function TambahRfqPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const soId = searchParams.get('sales_order_id')
  const [supplierOptions, setSupplierOptions] = useState<Array<{ value: string; label: string }>>([])
  const [barangOptions, setBarangOptions] = useState<Array<{ value: string; label: string; satuan: string }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingSo, setLoadingSo] = useState(!!soId)

  const today = new Date().toISOString().split('T')[0]

  const form = useForm<RfqFormValues>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      tanggal: today,
      sales_order_id: soId ?? '',
      items: [{ barang_id: '', jumlah: 1, satuan: '', harga_target: undefined, keterangan: '' }],
    },
  })

  const { register, handleSubmit, control, setValue, reset } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    Promise.all([
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/supplier'),
      apiFetch<Array<{ id: string; nama: string; kode: string; satuan: string }>>('/api/v1/master/barang'),
    ]).then(([suppliers, barang]) => {
      setSupplierOptions((suppliers.data ?? []).map(s => ({ value: s.id, label: `[${s.kode}] ${s.nama}` })))
      setBarangOptions((barang.data ?? []).map(b => ({ value: b.id, label: `[${b.kode}] ${b.nama}`, satuan: b.satuan })))
    }).catch(() => toast.error('Gagal memuat data referensi'))
  }, [])

  useEffect(() => {
    if (!soId) return
    apiFetch<{ nomor: string; items: Array<{ barang_id: string; jumlah: number; keterangan: string | null; barang: { nama: string; kode: string; satuan: string; harga_beli_default: number | null } }> }>(`/api/v1/sales-order/${soId}`)
      .then((res) => {
        const so = res.data
        const items = (so.items ?? []).map((i: { barang_id: string; jumlah: number; keterangan: string | null; barang: { nama: string; kode: string; satuan: string; harga_beli_default: number | null } }) => ({
          barang_id: i.barang_id,
          jumlah: i.jumlah,
          satuan: i.barang?.satuan ?? '',
          harga_target: i.barang?.harga_beli_default ?? undefined,
          keterangan: i.keterangan ?? '',
        }))
        reset({
          tanggal: today,
          sales_order_id: soId,
          supplier_id: '',
          keterangan: '',
          items: items.length > 0 ? items : [{ barang_id: '', jumlah: 1 }],
        })
        setLoadingSo(false)
      })
      .catch(() => {
        toast.error('Gagal memuat data Sales Order')
        setLoadingSo(false)
      })
  }, [soId, reset, today])

  const onSubmit = async (data: RfqFormValues) => {
    setSubmitting(true)
    try {
      await apiFetch('/api/v1/rfq-supplier', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      toast.success('RFQ berhasil dibuat!')
      router.push('/dashboard/rfq')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingSo) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/rfq"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold">Buat RFQ Baru</h1>
          <p className="text-muted-foreground mt-1">Request for Quotation ke Supplier</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi RFQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={control} name="supplier_id" render={({ field }) => (
                  <FormItem><FormLabel>Supplier *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih Supplier" /></SelectTrigger></FormControl>
                      <SelectContent>{supplierOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="tanggal" render={({ field }) => (
                  <FormItem><FormLabel>Tanggal *</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              {soId && (
                <div className="text-sm text-muted-foreground">
                  Merujuk ke Sales Order: <span className="font-medium">{soId.slice(0, 8)}...</span>
                  <input type="hidden" {...register('sales_order_id')} />
                </div>
              )}
              <FormField control={control} name="keterangan" render={({ field }) => (
                <FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea {...field} placeholder="Catatan untuk RFQ ini" rows={2} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Item Barang</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ barang_id: '', jumlah: 1 })}>
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
                        <Select onValueChange={(val) => { field.onChange(val); const selected = barangOptions.find(b => b.value === val); if (selected?.satuan) setValue(`items.${index}.satuan`, selected.satuan) }} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Pilih Barang" /></SelectTrigger></FormControl>
                          <SelectContent>{barangOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="space-y-2"><label className="text-xs font-medium">Jumlah *</label><Input type="number" min="1" {...register(`items.${index}.jumlah`)} /></div>
                    <div className="space-y-2"><label className="text-xs font-medium">Satuan</label><Input {...register(`items.${index}.satuan`)} placeholder="pcs" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><label className="text-xs font-medium">Harga Target</label><Input type="number" min="0" step="0.01" {...register(`items.${index}.harga_target`)} placeholder="0" /></div>
                    <div className="space-y-2"><label className="text-xs font-medium">Keterangan</label><Input {...register(`items.${index}.keterangan`)} placeholder="Spesifikasi / catatan" /></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
<Button type="button" variant="cancel">
               <Link href="/dashboard/rfq">Batal</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? 'Menyimpan...' : 'Simpan RFQ'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
