"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch, apiFetchFormData } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Plus, Trash2, ArrowLeft, Loader2, Upload, FileText, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

const itemSchema = z.object({
  barang_id: z.string().optional(),
  nama_barang: z.string().optional(),
  jumlah: z.coerce.number().int().positive('Jumlah harus > 0'),
  satuan: z.string().optional(),
  image_url: z.string().optional(),
  keterangan: z.string().optional(),
  justification: z.string().optional(),
  _tempImage: z.any().optional(),
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

interface PendingFile {
  fileId: string
  fileName: string
  fileUrl: string
}

export default function TambahRfqCustomerPage() {
  const router = useRouter()
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string }>>([])
  const [picOptions, setPicOptions] = useState<Array<{ value: string; label: string }>>([])
  const [barangOptions, setBarangOptions] = useState<Array<{ value: string; label: string; satuan: string }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingItemImage, setUploadingItemImage] = useState<string | null>(null)
  const [nomorDokumen, setNomorDokumen] = useState('')
  const [nomorChecking, setNomorChecking] = useState(false)
  const checkNomorRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const recordIdRef = { current: crypto.randomUUID() }

  const today = new Date().toISOString().split('T')[0]

  const form = useForm<RfqFormValues>({
    resolver: zodResolver(rfqSchema),
    mode: 'onChange',
    defaultValues: {
      tanggal: today,
      perihal: 'Permintaan Penawaran',
      nomor_rfq_customer: '',
      pic_customer_id: '',
      items: [],
    },
  })

  const { handleSubmit, control, register, setValue, watch, formState } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const customerId = watch('customer_id')

  useEffect(() => {
    Promise.all([
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/customer'),
      apiFetch<Array<{ id: string; nama: string; kode: string; satuan: string }>>('/api/v1/master/barang'),
    ]).then(([customers, barang]) => {
      setCustomerOptions((customers.data ?? []).map(c => ({ value: c.id, label: `[${c.kode}] ${c.nama}` })))
      setBarangOptions((barang.data ?? []).map(b => ({ value: b.id, label: `[${b.kode}] ${b.nama}`, satuan: b.satuan })))
    }).catch(() => toast.error('Gagal memuat data referensi'))
    apiFetch<{ nomor: string }>('/api/v1/system/nomor-baru?kode=RFQC')
      .then(res => setNomorDokumen(res.data.nomor))
      .catch(() => {})
  }, [])

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

  const nomorRfqCustomer = watch('nomor_rfq_customer')

  useEffect(() => {
    if (checkNomorRef.current) clearTimeout(checkNomorRef.current)

    const value = nomorRfqCustomer
    if (!value || value.trim() === '') {
      setNomorChecking(false)
      form.clearErrors('nomor_rfq_customer')
      return
    }

    setNomorChecking(true)
    checkNomorRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch<{ available: boolean; usedBy: string | null }>(
          `/api/v1/rfq-customer/check-nomor?value=${encodeURIComponent(value.trim())}`
        )
        if (!res.data.available) {
          form.setError('nomor_rfq_customer', {
            type: 'manual',
            message: `Nomor RFQ Customer "${value.trim()}" sudah digunakan di ${res.data.usedBy}, silakan masukkan nomor yang berbeda`,
          })
        } else {
          form.clearErrors('nomor_rfq_customer')
        }
      } catch {
        // network error — ignore
      } finally {
        setNomorChecking(false)
      }
    }, 500)

    return () => {
      if (checkNomorRef.current) clearTimeout(checkNomorRef.current)
    }
  }, [nomorRfqCustomer, form])

  async function handleUploadRfqDoc(file: File) {
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'rfq')
      formData.append('recordId', recordIdRef.current)
      const res = await apiFetchFormData<{ fileId: string; fileName: string; fileUrl: string }>('/api/v1/rfq-customer/upload-temp', formData)
      setPendingFiles(prev => [...prev, res.data])
      toast.success('File berhasil diupload')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal upload file')
    } finally {
      setUploadingFile(false)
    }
  }

  function handleDeletePendingFile(fileId: string) {
    setPendingFiles(prev => prev.filter(f => f.fileId !== fileId))
  }

  async function handleUploadItemImage(index: number, file: File) {
    setUploadingItemImage(String(index))
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'gambar')
      formData.append('recordId', recordIdRef.current)
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
      const payload = {
        id: recordIdRef.current,
        ...data,
        nomor_rfq_customer: data.nomor_rfq_customer || null,
        pic_customer_id: data.pic_customer_id || null,
        files: pendingFiles,
        items: (data.items ?? []).map(item => ({
          barang_id: item.barang_id || null,
          nama_barang: item.nama_barang || null,
          jumlah: item.jumlah,
          satuan: item.satuan || null,
          image_url: item.image_url || null,
          keterangan: item.keterangan || null,
          justification: item.justification || null,
        })),
      }
      await apiFetch('/api/v1/rfq-customer', {
        method: 'POST',
        body: JSON.stringify(payload),
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
              <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 px-4 py-3">
                <FileText className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Nomor Dokumen Internal: </span>
                  <span className="font-mono font-semibold">{nomorDokumen || 'Memuat...'}</span>
                </div>
              </div>
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
                  <FormControl>
                    <div className="relative">
                      <Input {...field} placeholder="Nomor referensi dari customer" />
                      {nomorChecking && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </FormControl>
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
            <CardHeader>
              <CardTitle className="text-base">Dokumen RFQ dari Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div
                  className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer bg-muted/30 hover:bg-muted/50"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png,.webp'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) handleUploadRfqDoc(file)
                    }
                    input.click()
                  }}
                >
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Klik untuk upload dokumen RFQ</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, Excel, Word, Gambar (maks. 10MB) *</p>
                </div>
                {uploadingFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengupload...
                  </div>
                )}
                {pendingFiles.length > 0 && (
                  <div className="space-y-2">
                    {pendingFiles.map((f) => (
                      <div key={f.fileId} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                          <p className="text-sm font-medium truncate">{f.fileName}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePendingFile(f.fileId)} type="button">
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-2"><label className="text-xs font-medium">Jumlah *</label><Input type="number" min="1" {...register(`items.${index}.jumlah`)} /></div>
                    <div className="space-y-2"><label className="text-xs font-medium">Satuan</label><Input {...register(`items.${index}.satuan`)} placeholder="pcs" /></div>
                    <div className="space-y-2"><label className="text-xs font-medium">Spesifikasi</label><Input {...register(`items.${index}.keterangan`)} placeholder="Spesifikasi / catatan" /></div>
                    <div className="space-y-2"><label className="text-xs font-medium">Justification</label><Input {...register(`items.${index}.justification`)} placeholder="Alasan / justifikasi" /></div>
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
            <Button type="submit" disabled={submitting || !formState.isValid || pendingFiles.length === 0}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? 'Menyimpan...' : 'Simpan RFQ Customer'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
