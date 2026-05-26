"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const rfqItemSchema = z.object({
  barang_id: z.string().min(1),
  jumlah: z.coerce.number().int().positive(),
  satuan: z.string().optional(),
  harga_target: z.coerce.number().nonnegative().optional(),
  keterangan: z.string().optional(),
})

const rfqSchema = z.object({
  supplier_id: z.string().min(1),
  tanggal: z.string().min(1),
  status: z.string().optional(),
  keterangan: z.string().optional(),
  items: z.array(rfqItemSchema).min(1),
})

type RfqFormValues = z.input<typeof rfqSchema>

const statusOptions = [
  { value: 'draft', label: 'Draft', color: 'secondary' },
  { value: 'sent', label: 'Terkirim', color: 'warning' },
  { value: 'responded', label: 'Direspon', color: 'success' },
  { value: 'closed', label: 'Ditutup', color: 'outline' },
]

export default function EditRfqPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [supplierOptions, setSupplierOptions] = useState<Array<{ value: string; label: string }>>([])
  const [barangOptions, setBarangOptions] = useState<Array<{ value: string; label: string; satuan: string }>>([])

  const { register, handleSubmit, control, reset, setValue, watch } = useForm<RfqFormValues>({
    resolver: zodResolver(rfqSchema),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    const id = params.id as string

    Promise.all([
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/supplier'),
      apiFetch<Array<{ id: string; nama: string; kode: string; satuan: string }>>('/api/v1/master/barang'),
    ]).then(([suppliers, barang]) => {
      setSupplierOptions((suppliers.data ?? []).map(s => ({ value: s.id, label: `[${s.kode}] ${s.nama}` })))
      setBarangOptions((barang.data ?? []).map(b => ({ value: b.id, label: `[${b.kode}] ${b.nama}`, satuan: b.satuan })))
    }).catch(() => toast.error('Gagal memuat data referensi'))

    apiFetch<{
      id: string
      nomor: string
      supplier_id: string
      tanggal: string
      status: string
      keterangan: string | null
      items: Array<{
        barang_id: string
        jumlah: number
        satuan: string | null
        harga_target: number | null
        keterangan: string | null
      }>
    }>(`/api/v1/rfq-supplier/${id}`)
      .then((res) => {
        const rfq = res.data
        reset({
          supplier_id: rfq.supplier_id,
          tanggal: rfq.tanggal.split('T')[0],
          status: rfq.status,
          keterangan: rfq.keterangan ?? '',
          items: rfq.items.length > 0 ? rfq.items.map(i => ({
            barang_id: i.barang_id,
            jumlah: i.jumlah,
            satuan: i.satuan ?? '',
            harga_target: i.harga_target ?? undefined,
            keterangan: i.keterangan ?? '',
          })) : [{ barang_id: '', jumlah: 1 }],
        })
        setLoading(false)
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Gagal memuat RFQ')
        router.push('/dashboard/rfq')
      })
  }, [params.id, reset, router])

  const onSubmit = async (data: RfqFormValues) => {
    setSubmitting(true)
    try {
      await apiFetch(`/api/v1/rfq-supplier/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      toast.success('RFQ berhasil diupdate!')
      router.push('/dashboard/rfq')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/rfq"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Edit RFQ</h1>
          <p className="text-muted-foreground mt-1">Update Request for Quotation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi RFQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier <span className="text-destructive">*</span></label>
                <select
                  {...register('supplier_id')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
                >
                  <option value="">Pilih Supplier</option>
                  {supplierOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal <span className="text-destructive">*</span></label>
                <DatePicker value={watch('tanggal')} onChange={(v) => setValue('tanggal', v)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  {...register('status')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Keterangan</label>
              <Textarea {...register('keterangan')} rows={2} />
            </div>
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
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-medium">Barang <span className="text-destructive">*</span></label>
                    <select
                      {...register(`items.${index}.barang_id`)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
                      onChange={(e) => {
                        const selected = barangOptions.find(b => b.value === e.target.value)
                        if (selected?.satuan) {
                          setValue(`items.${index}.satuan`, selected.satuan)
                        }
                      }}
                    >
                      <option value="">Pilih Barang</option>
                      {barangOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Jumlah <span className="text-destructive">*</span></label>
                    <Input type="number" min="1" {...register(`items.${index}.jumlah`)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Satuan</label>
                    <Input {...register(`items.${index}.satuan`)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Harga Target</label>
                    <Input type="number" min="0" step="0.01" {...register(`items.${index}.harga_target`)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Keterangan</label>
                    <Input {...register(`items.${index}.keterangan`)} />
                  </div>
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
            {submitting ? 'Menyimpan...' : 'Update RFQ'}
          </Button>
        </div>
      </form>
    </div>
  )
}
