"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const itemSchema = z.object({
  barang_id: z.string().min(1),
  jumlah: z.coerce.number().int().positive(),
  harga_satuan: z.coerce.number().nonnegative(),
  diskon: z.coerce.number().nonnegative().optional(),
  keterangan: z.string().optional(),
})

const qtnSchema = z.object({
  customer_id: z.string().min(1),
  tanggal: z.string().min(1),
  status: z.string().optional(),
  ppn_rate: z.coerce.number().nonnegative().default(0.11),
  keterangan: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

type QtnFormValues = z.input<typeof qtnSchema>

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Terkirim' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'closed', label: 'Ditutup' },
]

export default function EditQuotationPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string }>>([])
  const [barangOptions, setBarangOptions] = useState<Array<{ value: string; label: string }>>([])

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<QtnFormValues>({
    resolver: zodResolver(qtnSchema),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    const id = params.id as string

    Promise.all([
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/customer'),
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/barang'),
    ]).then(([customers, barang]) => {
      setCustomerOptions((customers.data ?? []).map(c => ({ value: c.id, label: `[${c.kode}] ${c.nama}` })))
      setBarangOptions((barang.data ?? []).map(b => ({ value: b.id, label: `[${b.kode}] ${b.nama}` })))
    }).catch(() => toast.error('Gagal memuat data referensi'))

    apiFetch<{
      id: string
      customer_id: string
      tanggal: string
      status: string
      ppn_rate: number
      keterangan: string | null
      items: Array<{
        barang_id: string
        jumlah: number
        harga_satuan: number
        diskon: number | null
        keterangan: string | null
      }>
    }>(`/api/v1/quotation/${id}`)
      .then((res) => {
        const qtn = res.data
        reset({
          customer_id: qtn.customer_id,
          tanggal: qtn.tanggal.split('T')[0],
          status: qtn.status,
          ppn_rate: qtn.ppn_rate,
          keterangan: qtn.keterangan ?? '',
          items: qtn.items.length > 0 ? qtn.items.map(i => ({
            barang_id: i.barang_id,
            jumlah: i.jumlah,
            harga_satuan: i.harga_satuan,
            diskon: i.diskon ?? 0,
            keterangan: i.keterangan ?? '',
          })) : [{ barang_id: '', jumlah: 1, harga_satuan: 0 }],
        })
        setLoading(false)
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Gagal memuat Quotation')
        router.push('/dashboard/quotation')
      })
  }, [params.id, reset, router])

  const onSubmit = async (data: QtnFormValues) => {
    setSubmitting(true)
    try {
      await apiFetch(`/api/v1/quotation/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      toast.success('Quotation berhasil diupdate!')
      router.push('/dashboard/quotation')
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
          <a href="/dashboard/quotation"><ArrowLeft className="h-5 w-5" /></a>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Edit Quotation</h1>
          <p className="text-muted-foreground mt-1">Update penawaran harga</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Quotation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer <span className="text-destructive">*</span></label>
                <select
                  {...register('customer_id')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
                >
                  <option value="">Pilih Customer</option>
                  {customerOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal <span className="text-destructive">*</span></label>
                <Input type="date" {...register('tanggal')} />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">PPN Rate (%)</label>
                <Input type="number" step="0.01" min="0" max="100" {...register('ppn_rate')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Keterangan</label>
                <Input {...register('keterangan')} />
              </div>
            </div>
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
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-medium">Barang <span className="text-destructive">*</span></label>
                    <select
                      {...register(`items.${index}.barang_id`)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
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
                    <label className="text-xs font-medium">Harga Satuan <span className="text-destructive">*</span></label>
                    <Input type="number" min="0" step="1" {...register(`items.${index}.harga_satuan`)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Diskon (%)</label>
                    <Input type="number" min="0" max="100" step="0.01" {...register(`items.${index}.diskon`)} />
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
          <Button type="button" variant="outline" asChild>
            <a href="/dashboard/quotation">Batal</a>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submitting ? 'Menyimpan...' : 'Update Quotation'}
          </Button>
        </div>
      </form>
    </div>
  )
}
