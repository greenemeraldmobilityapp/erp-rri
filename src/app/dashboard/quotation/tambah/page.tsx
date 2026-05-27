"use client"

import { useState, useEffect, useRef } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, ArrowLeft, Loader2, Upload, FileText, X } from 'lucide-react'
import { toast } from 'sonner'
import { FormSkeleton } from '@/components/ui/skeleton'

const itemSchema = z.object({
  barang_id: z.string().min(1, 'Barang harus dipilih'),
  specification: z.string().optional(),
  justification: z.string().optional(),
  image_url: z.string().optional(),
  satuan: z.string().min(1, 'Satuan harus diisi'),
  jumlah: z.coerce.number().int().positive('Jumlah harus > 0'),
  harga_satuan: z.coerce.number().nonnegative('Harga harus diisi'),
  diskon: z.coerce.number().nonnegative().optional(),
  keterangan: z.string().optional(),
})

const qtnSchema = z.object({
  customer_id: z.string().min(1, 'Customer harus dipilih'),
  rfq_id: z.string().optional(),
  referensi: z.string().optional(),
  lampiran: z.string().optional(),
  perihal: z.string().default('Penawaran Harga'),
  pic_customer_id: z.string().optional(),
  alamat: z.string().optional(),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  masa_berlaku: z.string().optional(),
  ppn_rate: z.coerce.number().nonnegative().default(0.11),
  ppn_enabled: z.boolean().default(true),
  keterangan: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Minimal 1 item'),
})

type QtnFormValues = z.input<typeof qtnSchema>

const masaBerlakuOptions = [
  { value: '1 Minggu', label: '1 Minggu' },
  { value: '2 Minggu', label: '2 Minggu' },
  { value: '3 Minggu', label: '3 Minggu' },
  { value: '1 Bulan', label: '1 Bulan' },
]

interface BarangOption {
  value: string
  label: string
  satuan: string
  spesifikasi: string
  justification: string
  image_url: string
}

export default function TambahQuotationPage() {
  const router = useRouter()
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string; alamat?: string }>>([])
  const [barangData, setBarangData] = useState<BarangOption[]>([])
  const [picOptions, setPicOptions] = useState<Array<{ value: string; label: string }>>([])
  const [rfqOptions, setRfqOptions] = useState<Array<{ value: string; label: string }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [fileUploading, setFileUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]

  const form = useForm<QtnFormValues>({
    resolver: zodResolver(qtnSchema),
    defaultValues: {
      tanggal: today,
      perihal: 'Penawaran Harga',
      ppn_rate: 0.11,
      ppn_enabled: true,
      items: [{ barang_id: '', jumlah: 1, harga_satuan: 0, specification: '', justification: '', image_url: '', satuan: '' }],
    },
  })

  const { register, handleSubmit, control, watch, setValue } = form
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' })

  const selectedCustomerId = watch('customer_id')
  const selectedRfqId = watch('rfq_id')

  useEffect(() => {
    Promise.all([
      apiFetch<Array<{ id: string; nama: string; kode: string; alamat?: string }>>('/api/v1/master/customer'),
      apiFetch<Array<{ id: string; nama: string; kode: string; satuan: string; spesifikasi?: string; justification?: string; image_url?: string }>>('/api/v1/master/barang'),
      apiFetch<Array<{ id: string; nomor: string }>>('/api/v1/rfq-customer'),
    ]).then(([customers, barang, rfqs]) => {
      setCustomerOptions((customers.data ?? []).map(c => ({ value: c.id, label: `[${c.kode}] ${c.nama}`, alamat: c.alamat ?? '' })))
      const bOptions = (barang.data ?? []).map(b => ({
        value: b.id,
        label: `[${b.kode}] ${b.nama}`,
        satuan: b.satuan,
        spesifikasi: b.spesifikasi ?? '',
        justification: b.justification ?? '',
        image_url: b.image_url ?? '',
      }))
      setBarangData(bOptions)
      setRfqOptions((rfqs.data ?? []).map(r => ({ value: r.id, label: r.nomor })))
    }).catch(() => toast.error('Gagal memuat data referensi')).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedCustomerId) { setPicOptions([]); return }
    apiFetch<Array<{ id: string; nama: string; jabatan?: string }>>(`/api/v1/master/customer-pic?customer_id=${selectedCustomerId}`)
      .then((res) => setPicOptions((res.data ?? []).map(p => ({ value: p.id, label: `${p.nama}${p.jabatan ? ` (${p.jabatan})` : ''}` }))))
      .catch(() => {})
    const cust = customerOptions.find(c => c.value === selectedCustomerId)
    if (cust?.alamat) setValue('alamat', cust.alamat)
  }, [selectedCustomerId, customerOptions, setValue])

  useEffect(() => {
    if (!selectedRfqId) return

    let cancelled = false

    interface RfqData {
      customer_id: string
      pic_customer_id: string | null
      nomor: string
      items: Array<{
        barang_id: string | null
        nama_barang: string | null
        jumlah: number
        satuan: string | null
        image_url: string | null
        keterangan: string | null
      }>
    }

    apiFetch<RfqData>(`/api/v1/rfq-customer/${selectedRfqId}`)
      .then(async (res) => {
        if (cancelled) return
        const rfq = res.data as RfqData

        setValue('referensi', rfq.nomor)
        setValue('customer_id', rfq.customer_id)

        const cust = customerOptions.find(c => c.value === rfq.customer_id)
        if (cust?.alamat) setValue('alamat', cust.alamat)

        if (rfq.pic_customer_id) {
          const picRes = await apiFetch<Array<{ id: string; nama: string; jabatan?: string }>>(`/api/v1/master/customer-pic?customer_id=${rfq.customer_id}`)
          if (cancelled) return
          const pics = (picRes.data ?? []) as Array<{ id: string; nama: string; jabatan?: string }>
          setPicOptions(pics.map(p => ({ value: p.id, label: `${p.nama}${p.jabatan ? ` (${p.jabatan})` : ''}` })))
          setValue('pic_customer_id', rfq.pic_customer_id)
        }

        const newItems = (rfq.items ?? []).map(item => ({
          barang_id: item.barang_id || '',
          specification: '',
          justification: '',
          image_url: item.image_url || '',
          satuan: item.satuan || '',
          jumlah: item.jumlah,
          harga_satuan: 0,
          diskon: 0,
          keterangan: item.keterangan || '',
        }))
        if (cancelled) return
        replace(newItems)

        newItems.forEach((item, i) => {
          if (item.barang_id) {
            const barang = barangData.find(b => b.value === item.barang_id)
            if (barang) {
              setValue(`items.${i}.specification`, barang.spesifikasi)
              setValue(`items.${i}.justification`, barang.justification)
            }
          }
        })
      })
      .catch(() => toast.error('Gagal memuat data RFQ Customer'))

    return () => { cancelled = true }
  }, [selectedRfqId, customerOptions, barangData, replace, setValue])

  const handleBarangChange = (index: number, barangId: string) => {
    const barang = barangData.find(b => b.value === barangId)
    if (barang) {
      setValue(`items.${index}.specification`, barang.spesifikasi)
      setValue(`items.${index}.justification`, barang.justification)
      setValue(`items.${index}.image_url`, barang.image_url)
      setValue(`items.${index}.satuan`, barang.satuan)
    }
  }

  const onSubmit = async (data: QtnFormValues) => {
    setSubmitting(true)
    try {
      const res = await apiFetch<{ id: string }>('/api/v1/quotation', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (uploadFile) {
        setFileUploading(true)
        const toastId = toast.loading('Mengupload file RFQ...')
        const formData = new FormData()
        formData.append('file', uploadFile)
        const { apiFetchFormData } = await import('@/lib/api/client')
        await apiFetchFormData(`/api/v1/quotation/${res.data.id}/documents`, formData)
        toast.success('File RFQ berhasil diupload!', { id: toastId })
      }

      toast.success('Quotation berhasil dibuat!')
      router.push('/dashboard/quotation')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
      setFileUploading(false)
    }
  }

  if (loading) return <FormSkeleton />

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/quotation"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold">Buat Quotation</h1>
          <p className="text-muted-foreground mt-1">Surat Penawaran Harga (SPH) untuk customer</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Header Surat</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={control} name="rfq_id" render={({ field }) => (
                  <FormItem><FormLabel>No. Referensi (RFQ)</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v)} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih RFQ" /></SelectTrigger></FormControl>
                      <SelectContent>{rfqOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="lampiran" render={({ field }) => (
                  <FormItem><FormLabel>Lampiran</FormLabel><FormControl><Input {...field} placeholder="Softcopy Penawaran Harga" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <span className="text-sm font-medium shrink-0">File RFQ Customer:</span>
                {uploadFile ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs max-w-[200px]">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{uploadFile.name}</span>
                    <button type="button" onClick={() => setUploadFile(null)} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Belum ada file</span>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadFile(f); if (e.target) e.target.value = ''; }} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="ml-auto shrink-0">
                  <Upload className="h-3.5 w-3.5 mr-1" /> Pilih File
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={control} name="perihal" render={({ field }) => (
                  <FormItem><FormLabel>Perihal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="tanggal" render={({ field }) => (
                  <FormItem><FormLabel>Tanggal *</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Kepada Yth.</CardTitle></CardHeader>
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
                <FormField control={control} name="pic_customer_id" render={({ field }) => (
                  <FormItem><FormLabel>PIC Customer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih PIC" /></SelectTrigger></FormControl>
                      <SelectContent>{picOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={control} name="alamat" render={({ field }) => (
                <FormItem><FormLabel>Alamat Tujuan</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Item Penawaran</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ barang_id: '', jumlah: 1, harga_satuan: 0, specification: '', justification: '', image_url: '', satuan: '' })}>
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
                    <FormField control={control} name={`items.${index}.barang_id`} render={({ field }) => (
                      <FormItem><FormLabel>Barang *</FormLabel>
                        <Select onValueChange={(v) => { field.onChange(v); handleBarangChange(index, v) }} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Pilih Barang" /></SelectTrigger></FormControl>
                          <SelectContent>{barangData.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={control} name={`items.${index}.specification`} render={({ field }) => (
                      <FormItem><FormLabel>Specification</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={control} name={`items.${index}.justification`} render={({ field }) => (
                      <FormItem><FormLabel>Justification</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={control} name={`items.${index}.image_url`} render={({ field }) => (
                      <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} placeholder="https://..." /></FormControl>
                        {field.value && <img src={field.value} alt="" className="mt-1 h-12 w-12 object-contain rounded border" />}
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <FormField control={control} name={`items.${index}.jumlah`} render={({ field }) => (
                      <FormItem><FormLabel>Qty *</FormLabel><FormControl><Input type="number" min="1" value={String(field.value ?? '')} onChange={e => field.onChange(Number(e.target.value))} onBlur={field.onBlur} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={control} name={`items.${index}.satuan`} render={({ field }) => (
                      <FormItem><FormLabel>UoM</FormLabel><FormControl><Input value={String(field.value ?? '')} onChange={field.onChange} onBlur={field.onBlur} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={control} name={`items.${index}.harga_satuan`} render={({ field }) => (
                      <FormItem><FormLabel>Price *</FormLabel><FormControl><Input type="number" min="0" step="1" value={String(field.value ?? '')} onChange={e => field.onChange(Number(e.target.value))} onBlur={field.onBlur} placeholder="0" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Total Price</label>
                      <div className="h-10 flex items-center px-3 border rounded-md bg-muted/30 text-sm font-medium">
                        Rp {((Number(watch(`items.${index}.jumlah`)) || 0) * (Number(watch(`items.${index}.harga_satuan`)) || 0)).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Pengaturan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={control} name="masa_berlaku" render={({ field }) => (
                  <FormItem><FormLabel>Masa Berlaku</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih masa berlaku" /></SelectTrigger></FormControl>
                      <SelectContent>{masaBerlakuOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="ppn_enabled" render={({ field }) => (
                  <FormItem><FormLabel>PPN</FormLabel>
                    <div className="flex items-center gap-3 h-10">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm text-muted-foreground">{field.value ? 'PPN 11%' : 'Non-PPN'}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={control} name="keterangan" render={({ field }) => (
                <FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="Catatan tambahan..." /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="cancel">
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
