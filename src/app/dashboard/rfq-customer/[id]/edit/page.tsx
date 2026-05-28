"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch, apiFetchFormData } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Plus, Trash2, ArrowLeft, Loader2, ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'

const itemSchema = z.object({
  id: z.string().optional(),
  barang_id: z.string().optional(),
  nama_barang: z.string().optional(),
  jumlah: z.coerce.number().int().positive('Jumlah harus > 0'),
  satuan: z.string().optional(),
  image_url: z.string().optional(),
  keterangan: z.string().optional(),
})

const rfqSchema = z.object({
  customer_id: z.string().min(1, 'Customer harus dipilih'),
  nomor_rfq_customer: z.string().min(1, 'Nomor RFQ Customer harus diisi'),
  pic_customer_id: z.string().min(1, 'PIC Customer harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  perihal: z.string().min(1, 'Perihal harus diisi'),
  keterangan: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Minimal 1 item barang'),
})

type RfqFormValues = z.input<typeof rfqSchema>

export default function EditRfqCustomerPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string }>>([])
  const [picOptions, setPicOptions] = useState<Array<{ value: string; label: string }>>([])
  const [barangOptions, setBarangOptions] = useState<Array<{ value: string; label: string; satuan: string }>>([])
  const [uploadingItemImage, setUploadingItemImage] = useState<string | null>(null)
  const [nomor, setNomor] = useState('')

  const form = useForm<RfqFormValues>({
    resolver: zodResolver(rfqSchema),
    mode: 'onChange',
    defaultValues: {
      customer_id: '',
      nomor_rfq_customer: '',
      pic_customer_id: '',
      tanggal: new Date().toISOString().split('T')[0],
      perihal: 'Permintaan Penawaran',
      keterangan: '',
      items: [],
    },
  })

  const { handleSubmit, control, register, setValue, watch, reset, formState } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const customerId = watch('customer_id')

  useEffect(() => {
    if (!params?.id) return
    const id = Array.isArray(params.id) ? params.id[0] : params.id

    Promise.all([
      apiFetch<{
        id: string
        nomor: string
        customer_id: string
        nomor_rfq_customer: string | null
        pic_customer_id: string | null
        tanggal: string
        perihal: string | null
        keterangan: string | null
        items: Array<{
          id: string
          barang_id: string | null
          nama_barang: string | null
          jumlah: number
          satuan: string | null
          image_url: string | null
          keterangan: string | null
        }>
        customer: { id: string; nama: string; kode: string }
        pic_customer: { id: string; nama: string } | null
      }>(`/api/v1/rfq-customer/${id}`),
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/customer'),
      apiFetch<Array<{ id: string; nama: string; kode: string; satuan: string }>>('/api/v1/master/barang'),
    ]).then(([rfqRes, customersRes, barangRes]) => {
      const rfq = rfqRes.data
      const customers = customersRes.data ?? []
      const barang = barangRes.data ?? []

      setCustomerOptions(customers.map(c => ({ value: c.id, label: `[${c.kode}] ${c.nama}` })))
      setBarangOptions(barang.map(b => ({ value: b.id, label: `[${b.kode}] ${b.nama}`, satuan: b.satuan })))

      setNomor(rfq.nomor || '')
      reset({
        customer_id: rfq.customer_id,
        nomor_rfq_customer: rfq.nomor_rfq_customer || '',
        pic_customer_id: rfq.pic_customer_id || '',
        tanggal: rfq.tanggal?.split('T')[0] || '',
        perihal: rfq.perihal || 'Permintaan Penawaran',
        keterangan: rfq.keterangan || '',
        items: (rfq.items ?? []).map(item => ({
          id: item.id,
          barang_id: item.barang_id || '',
          nama_barang: item.nama_barang || '',
          jumlah: item.jumlah,
          satuan: item.satuan || '',
          image_url: item.image_url || '',
          keterangan: item.keterangan || '',
        })),
      })

      setLoading(false)
    }).catch(() => {
      toast.error('Gagal memuat data RFQ Customer')
      setLoading(false)
    })
  }, [params?.id, reset])

  useEffect(() => {
    if (!customerId) {
      setPicOptions([])
      setValue('pic_customer_id', '')
      return
    }
    apiFetch<Array<{ id: string; nama: string; jabatan: string }>>(`/api/v1/master/pic-customer?customer_id=${customerId}`)
      .then((res) => {
        setPicOptions((res.data ?? []).map(p => ({ value: p.id, label: p.jabatan ? `${p.nama} (${p.jabatan})` : p.nama })))
      })
      .catch(() => toast.error('Gagal memuat data PIC Customer'))
  }, [customerId, setValue])

  async function handleUploadItemImage(index: number, file: File) {
    const selectedCustomerId = form.getValues('customer_id')
    const nomorRef = form.getValues('nomor_rfq_customer')
    if (!selectedCustomerId || !nomorRef) {
      toast.error('Pilih customer dan isi nomor RFQ terlebih dahulu')
      return
    }
    const customer = customerOptions.find(c => c.value === selectedCustomerId)
    const customerName = customer ? customer.label.replace(/^\[\w+\]\s*/, '') : ''

    setUploadingItemImage(String(index))
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('customerName', customerName)
      formData.append('nomorRfqCustomer', nomorRef)
      formData.append('type', 'gambar')
      const res = await apiFetchFormData<{ fileId: string; fileName: string; fileUrl: string }>('/api/v1/rfq-customer/upload-temp', formData)
      setValue(`items.${index}.image_url`, res.data.fileUrl)
      toast.success('Gambar berhasil diupload')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal upload gambar')
    } finally {
      setUploadingItemImage(null)
    }
  }

  const onSubmit = async (data: RfqFormValues) => {
    setSubmitting(true)
    try {
      const id = Array.isArray(params.id) ? params.id[0] : params.id
      const payload = {
        ...data,
        nomor_rfq_customer: data.nomor_rfq_customer || null,
        pic_customer_id: data.pic_customer_id || null,
        items: (data.items ?? []).map(item => ({
          barang_id: item.barang_id || null,
          nama_barang: item.nama_barang || null,
          jumlah: item.jumlah,
          satuan: item.satuan || null,
          image_url: item.image_url || null,
          keterangan: item.keterangan || null,
        })),
      }
      await apiFetch(`/api/v1/rfq-customer/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      toast.success('RFQ Customer berhasil diperbarui!')
      router.push(`/dashboard/rfq-customer/${id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Memuat data...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/rfq-customer"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold">Edit RFQ Customer</h1>
          <p className="text-muted-foreground mt-1">Ubah data Request for Quotation dari Customer</p>
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
                <FormItem>
                  <FormLabel>Nomor RFQ</FormLabel>
                  <Input value={nomor} disabled className="bg-muted" />
                </FormItem>
                <FormField control={control} name="pic_customer_id" render={({ field }) => (
                  <FormItem><FormLabel>PIC Customer *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={!customerId}>
                      <FormControl><SelectTrigger><SelectValue placeholder={customerId ? 'Pilih PIC' : 'Pilih customer dulu'} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {picOptions.length === 0 && <SelectItem value="_none" disabled>Tidak ada PIC</SelectItem>}
                        {picOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={control} name="nomor_rfq_customer" render={({ field }) => (
                <FormItem><FormLabel>Nomor RFQ Customer *</FormLabel>
                  <FormControl><Input {...field} placeholder="Nomor referensi dari customer" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="perihal" render={({ field }) => (
                <FormItem><FormLabel>Perihal *</FormLabel><FormControl><Input {...field} placeholder="Permintaan Penawaran" /></FormControl><FormMessage /></FormItem>
              )} />
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
                        {...register(`items.${index}.barang_id`, {
                          onChange: (e) => {
                            const selected = barangOptions.find(b => b.value === e.target.value)
                            if (selected?.satuan) setValue(`items.${index}.satuan`, selected.satuan)
                          }
                        })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Gambar Barang</label>
                    <div className="flex items-center gap-3">
                      {uploadingItemImage === String(index) ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Mengupload...
                        </div>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = '.jpg,.jpeg,.png,.webp'
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0]
                                if (file) handleUploadItemImage(index, file)
                              }
                              input.click()
                            }}
                          >
                            <ImageIcon className="h-4 w-4 mr-1" />
                            {watch(`items.${index}.image_url`) ? 'Ganti' : 'Upload'}
                          </Button>
                          {watch(`items.${index}.image_url`) && (
                            <>
                              <img
                                src={watch(`items.${index}.image_url`)}
                                alt="Preview"
                                className="h-10 w-10 rounded object-cover border"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setValue(`items.${index}.image_url`, '')}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
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
            <Button type="submit" disabled={submitting || !formState.isValid}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
