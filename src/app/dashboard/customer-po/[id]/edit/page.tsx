"use client"
import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ArrowLeft, Loader2, Settings2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { KelolaKategoriDialog } from '@/components/kelola-kategori-dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { FileUpload } from '@/components/file-upload'
import type { DocumentFile } from '@/components/file-upload'

const schema = z.object({ status: z.string().optional(), nomor_po_customer: z.string().optional(), terms_of_payment: z.enum(['Net 14', 'Net 20', 'Net 30', 'Net 60', 'Net 90', 'Cash', 'Custom']).optional().or(z.literal('')), waktu_pengiriman: z.coerce.number().int().positive().optional(), nama_penandatangan: z.string().optional().nullable(), jabatan_penandatangan: z.string().optional().nullable() })
type FV = z.input<typeof schema>
const statusOpts = [{ value: 'draft', label: 'Draft' }, { value: 'confirmed', label: 'Dikonfirmasi' }, { value: 'cancelled', label: 'Batal' }]

interface UnmappedItem {
  id: string
  nama_barang: string | null
  satuan: string | null
  jumlah: number
}

interface KategoriOption {
  value: string
  label: string
}

interface PoItem {
  id: string
  barang_id: string
  jumlah: number
  harga_satuan: number
  keterangan: string | null
  barang: { nama: string; kode: string; satuan: string; image_url: string | null } | null
}

export default function EditPoPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showBarangDialog, setShowBarangDialog] = useState(false)
  const [unmappedItems, setUnmappedItems] = useState<UnmappedItem[]>([])
  const [kategoriOptions, setKategoriOptions] = useState<KategoriOption[]>([])
  const [kategoriMap, setKategoriMap] = useState<Record<string, string>>({})
  const [kategoriDialogOpen, setKategoriDialogOpen] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FV | null>(null)
  const [items, setItems] = useState<PoItem[]>([])
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)

  const { register, handleSubmit, reset, control } = useForm<FV>({ resolver: zodResolver(schema) })
  const [customerLabel, setCustomerLabel] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [quotationLabel, setQuotationLabel] = useState('')
  const [picLabel, setPicLabel] = useState('')
  const [termsOfPayment, setTermsOfPayment] = useState('')
  const [waktuPengirimanVal, setWaktuPengirimanVal] = useState<number | null>(null)
  const [tanggal, setTanggal] = useState('')
  const [topOpts, setTopOpts] = useState<string[]>([])

  const topDays = useMemo(() => {
    if (!termsOfPayment) return null
    if (termsOfPayment === 'Cash') return 'Cash'
    const match = termsOfPayment.match(/\d+/)
    return match ? Number(match[0]) : null
  }, [termsOfPayment])

  const deliveryDate = useMemo(() => {
    if (!tanggal || !waktuPengirimanVal) return null
    const d = new Date(tanggal + 'T00:00:00')
    d.setDate(d.getDate() + waktuPengirimanVal)
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
  }, [tanggal, waktuPengirimanVal])

  useEffect(() => {
    Promise.all([
      apiFetch<{ customer_id: string; status: string; nomor_po_customer: string | null; terms_of_payment: string | null; waktu_pengiriman: number | null; tanggal: string; customer: { nama: string; kode: string } | null; quotation: { nomor: string } | null; customer_pic: { nama: string; jabatan: string | null } | null; items?: PoItem[]; nama_penandatangan: string | null; jabatan_penandatangan: string | null }>(`/api/v1/customer-po/${params.id}`),
      apiFetch<DocumentFile[]>(`/api/v1/customer-po/${params.id}/documents`).catch(() => ({ data: [] })),
    ])
      .then(async ([poRes, docRes]) => {
        reset({
          status: poRes.data.status,
          nomor_po_customer: poRes.data.nomor_po_customer ?? '',
          terms_of_payment: (poRes.data.terms_of_payment ?? '') as FV['terms_of_payment'],
          waktu_pengiriman: poRes.data.waktu_pengiriman ?? undefined,
        })
        setCustomerLabel(poRes.data.customer ? `[${poRes.data.customer.kode}] ${poRes.data.customer.nama}` : '-')
        setCustomerId(poRes.data.customer_id ?? '')
        setQuotationLabel(poRes.data.quotation?.nomor ?? '-')
        setPicLabel(poRes.data.customer_pic ? `${poRes.data.customer_pic.nama}${poRes.data.customer_pic.jabatan ? ` - ${poRes.data.customer_pic.jabatan}` : ''}` : '-')
        setTermsOfPayment(poRes.data.terms_of_payment ?? '')
        setWaktuPengirimanVal(poRes.data.waktu_pengiriman)
        setTanggal(poRes.data.tanggal ?? '')
        setItems(poRes.data.items ?? [])
        setDocuments(docRes.data ?? [])
        setLoading(false)

        if (poRes.data.customer_id) {
          try {
            const topsRes = await apiFetch<Array<{ top: string }>>(`/api/v1/master/customer-top?customer_id=${poRes.data.customer_id}`)
            setTopOpts((topsRes.data ?? []).map(t => t.top))
          } catch { /* ignore */ }
        }
      })
      .catch(() => { toast.error('Gagal memuat data'); router.push('/dashboard/customer-po') })
  }, [params.id, reset, router])

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const { apiFetchFormData } = await import("@/lib/api/client")
      const r = await apiFetchFormData(`/api/v1/customer-po/${params.id}/documents`, formData)
      setDocuments((prev) => [r.data as DocumentFile, ...prev].filter(Boolean))
      toast.success("File berhasil diupload")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal upload file")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    try {
      await apiFetch(`/api/v1/customer-po/${params.id}/documents?docId=${docId}`, { method: "DELETE" })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast.success("File berhasil dihapus")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal hapus file")
    }
  }

  const openBarangDialog = async (data: FV) => {
    try {
      const res = await apiFetch<{ has_unmapped: boolean; items: UnmappedItem[]; kategori_options: KategoriOption[] }>(
        `/api/v1/customer-po/${params.id}/check-unmapped-barang`
      )
      if (res.data.has_unmapped && res.data.items.length > 0) {
        setUnmappedItems(res.data.items)
        setKategoriOptions(res.data.kategori_options ?? [])
        const defaultMap: Record<string, string> = {}
        res.data.items.forEach((item) => { defaultMap[item.id] = '' })
        setKategoriMap(defaultMap)
        setPendingFormData(data)
        setShowBarangDialog(true)
      } else {
        await submitForm(data)
      }
    } catch {
      await submitForm(data)
    }
  }

  const handleKategoriSuccess = useCallback(async () => {
    try {
      const res = await apiFetch<KategoriOption[]>('/api/v1/master/kategori-barang')
      setKategoriOptions(res.data ?? [])
    } catch { /* ignore */ }
  }, [])

  const confirmWithBarang = async () => {
    if (!pendingFormData) return
    setShowBarangDialog(false)
    const barangAutoCreate = unmappedItems.map(item => ({
      item_id: item.id,
      nama_barang: item.nama_barang || '',
      satuan: item.satuan || '',
      kategori_id: kategoriMap[item.id] || null,
    }))
    await submitForm(pendingFormData, barangAutoCreate)
  }

  const updateItem = (itemId: string, field: 'jumlah' | 'harga_satuan', value: number) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: value } : i))
  }

  const submitForm = async (data: FV, barangAutoCreate?: Array<Record<string, unknown>>) => {
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = { ...data }
      if (body.waktu_pengiriman === '' || body.waktu_pengiriman === undefined || body.waktu_pengiriman === null) delete body.waktu_pengiriman
      if (barangAutoCreate) body.barang_auto_create = barangAutoCreate

      body.items = items.map(i => ({
        barang_id: i.barang_id,
        jumlah: i.jumlah,
        harga_satuan: i.harga_satuan,
        keterangan: i.keterangan ?? null,
      }))

      const res = await apiFetch<{ autoGenerated?: { id: string; nomor: string; type: string } }>(
        `/api/v1/customer-po/${params.id}`,
        { method: 'PUT', body: JSON.stringify(body) }
      )
      const autoGenerated = res.data?.autoGenerated
      if (autoGenerated) {
        toast.success('PO diupdate!', {
          description: `Sales Order ${autoGenerated.nomor} otomatis dibuat`,
          action: { label: 'Lihat SO', onClick: () => router.push(`/dashboard/sales-order/${autoGenerated.id}`) },
        })
        return
      }
      if (barangAutoCreate) {
        const names = unmappedItems.map(i => i.nama_barang).filter(Boolean)
        if (names.length > 0) toast.success(`${names.length} barang baru ditambahkan ke master barang: ${names.join(', ')}`)
      }
      toast.success('PO berhasil diupdate!')
      router.push('/dashboard/customer-po')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmit = async (data: FV) => {
    if (data.status === 'confirmed') {
      await openBarangDialog(data)
    } else {
      await submitForm(data)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/customer-po"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div><h1 className="text-3xl font-heading font-bold">Edit PO</h1></div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select {...register('status')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring">
                  {statusOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer</label>
                <Input value={customerLabel} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quotation</label>
                <Input value={quotationLabel} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">PIC Customer</label>
                <Input value={picLabel} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nomor PO Customer</label>
                <Input {...register('nomor_po_customer')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Terms of Payment</label>
                <Controller
                  name="terms_of_payment"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(v) => {
                        field.onChange(v)
                        setTermsOfPayment(v)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih TOP" />
                      </SelectTrigger>
                      <SelectContent>
                        {(topOpts.length > 0 ? topOpts : ['Net 14', 'Net 20', 'Net 30', 'Net 60', 'Net 90', 'Cash', 'Custom']).map(o => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Waktu Pengiriman (hari)</label>
                <Input type="number" min="1" placeholder="Contoh: 7" {...register('waktu_pengiriman')} />
              </div>
              {(termsOfPayment || waktuPengirimanVal) && (
                <div className="text-sm bg-blue-50 border border-blue-200 rounded-md px-4 py-3 space-y-1">
                  <p className="font-medium text-blue-800">📋 Estimasi Waktu</p>
                  {termsOfPayment && (
                    <p className="text-blue-700">
                      • {topDays === 'Cash'
                        ? 'Jatuh tempo pembayaran Invoice adalah Cash (lunas saat penerimaan invoice).'
                        : `Jatuh tempo pembayaran Invoice adalah ${topDays} hari setelah hardcopy invoice diterima Customer.`
                      }
                    </p>
                  )}
                  {waktuPengirimanVal && (
                    <p className="text-blue-700">
                      • Waktu pengiriman {waktuPengirimanVal} hari setelah PO terbit{deliveryDate ? `, maksimal pengiriman sampai ${deliveryDate}` : ''}.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="cancel"><Link href="/dashboard/customer-po">Batal</Link></Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? 'Menyimpan...' : 'Update'}
            </Button>
          </div>
        </form>

        {!!items.length && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-4 w-4" />Item Barang</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Picture</TableHead>
                    <TableHead>Barang</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.barang?.image_url
                          ? <img src={item.barang.image_url} alt={item.barang.nama} className="h-10 w-10 object-cover rounded" />
                          : <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">-</div>
                        }
                      </TableCell>
                      <TableCell className="font-medium">{item.barang?.nama}</TableCell>
                      <TableCell className="text-muted-foreground">{item.barang?.kode}</TableCell>
                      <TableCell>{item.barang?.satuan}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="1"
                          value={item.jumlah}
                          onChange={(e) => updateItem(item.id, 'jumlah', Math.max(1, Number(e.target.value)))}
                          className="w-20 text-right h-9"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          value={item.harga_satuan}
                          onChange={(e) => updateItem(item.id, 'harga_satuan', Math.max(0, Number(e.target.value)))}
                          className="w-28 text-right h-9"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(item.jumlah * item.harga_satuan).toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-right font-bold text-lg">
                Total: {items.reduce((sum, i) => sum + i.jumlah * i.harga_satuan, 0).toLocaleString("id-ID")}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Lampiran</h3>
            <FileUpload
              documents={documents}
              onUpload={handleUpload}
              onDelete={handleDeleteDocument}
              uploading={uploading}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={showBarangDialog} onOpenChange={setShowBarangDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Buat Barang Baru dari RFQ</DialogTitle>
            <DialogDescription>
              Item RFQ berikut belum terdaftar di master barang. Pilih kategori untuk setiap barang sebelum konfirmasi PO.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {unmappedItems.map((item) => (
              <div key={item.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.nama_barang || '(tanpa nama)'}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.jumlah} {item.satuan || 'pcs'}</p>
                  </div>
                </div>
                <Select
                  value={kategoriMap[item.id] || ''}
                  onValueChange={(v) => setKategoriMap(prev => ({ ...prev, [item.id]: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {kategoriOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setKategoriDialogOpen(true)}>
              <Settings2 className="h-3 w-3 mr-1" />
              Kelola Kategori
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="cancel" onClick={() => setShowBarangDialog(false)}>Batal</Button>
            <Button type="button" onClick={confirmWithBarang}>Konfirmasi & Buat Barang</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KelolaKategoriDialog open={kategoriDialogOpen} onOpenChange={setKategoriDialogOpen} onSuccess={handleKategoriSuccess} />
    </>
  )
}
