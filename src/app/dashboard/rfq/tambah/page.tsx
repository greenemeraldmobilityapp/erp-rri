"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  keterangan: z.string().optional(),
  items: z.array(rfqItemSchema).min(1, 'Minimal 1 item'),
})

type RfqFormValues = z.input<typeof rfqSchema>

export default function TambahRfqPage() {
  const router = useRouter()
  const [supplierOptions, setSupplierOptions] = useState<Array<{ value: string; label: string }>>([])
  const [barangOptions, setBarangOptions] = useState<Array<{ value: string; label: string; satuan: string }>>([])
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm<RfqFormValues>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      tanggal: today,
      items: [{ barang_id: '', jumlah: 1, satuan: '', harga_target: undefined, keterangan: '' }],
    },
  })

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

  const onSubmit = async (data: RfqFormValues) => {
    setSubmitting(true)
    try {
      await apiFetch('/api/v1/rfq', {
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

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <a href="/dashboard/rfq"><ArrowLeft className="h-5 w-5" /></a>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Buat RFQ Baru</h1>
          <p className="text-muted-foreground mt-1">Request for Quotation ke Supplier</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi RFQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal <span className="text-destructive">*</span></label>
                <Input type="date" {...register('tanggal')} />
                {errors.tanggal && <p className="text-sm text-destructive">{errors.tanggal.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Keterangan</label>
              <Textarea {...register('keterangan')} placeholder="Catatan untuk RFQ ini" rows={2} />
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
                    {errors.items?.[index]?.barang_id && (
                      <p className="text-xs text-destructive">{errors.items[index]?.barang_id?.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Jumlah <span className="text-destructive">*</span></label>
                    <Input type="number" min="1" {...register(`items.${index}.jumlah`)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Satuan</label>
                    <Input {...register(`items.${index}.satuan`)} placeholder="pcs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Harga Target</label>
                    <Input type="number" min="0" step="0.01" {...register(`items.${index}.harga_target`)} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Keterangan</label>
                    <Input {...register(`items.${index}.keterangan`)} placeholder="Spesifikasi / catatan" />
                  </div>
                </div>
              </div>
            ))}
            {errors.items && !Array.isArray(errors.items) && (
              <p className="text-sm text-destructive">{errors.items.message}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <a href="/dashboard/rfq">Batal</a>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submitting ? 'Menyimpan...' : 'Simpan RFQ'}
          </Button>
        </div>
      </form>
    </div>
  )
}
