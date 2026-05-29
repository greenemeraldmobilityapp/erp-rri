"use client"
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ArrowLeft, Loader2, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { KelolaKategoriDialog } from '@/components/kelola-kategori-dialog'

const schema = z.object({ status: z.string().optional(), nomor_po_customer: z.string().optional(), terms_of_payment: z.string().optional(), waktu_pengiriman: z.coerce.number().int().positive().optional(), pic_customer_id: z.string().optional() })
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

  const { register, handleSubmit, reset } = useForm<FV>({ resolver: zodResolver(schema) })
  const [picOpts, setPicOpts] = useState<Array<{ value: string; label: string }>>([])

  useEffect(() => {
    apiFetch<{ status: string; nomor_po_customer: string | null; terms_of_payment: string | null; waktu_pengiriman: number | null; pic_customer_id: string | null; customer_id: string }>(`/api/v1/customer-po/${params.id}`)
      .then(async r => {
        reset({
          status: r.data.status,
          nomor_po_customer: r.data.nomor_po_customer ?? '',
          terms_of_payment: r.data.terms_of_payment ?? '',
          waktu_pengiriman: r.data.waktu_pengiriman ?? undefined,
          pic_customer_id: r.data.pic_customer_id ?? '',
        })
        if (r.data.customer_id) {
          try {
            const picRes = await apiFetch<Array<{ id: string; nama: string; jabatan: string | null }>>(`/api/v1/master/pic-customer?customer_id=${r.data.customer_id}`)
            setPicOpts((picRes.data ?? []).map(x => ({ value: x.id, label: x.jabatan ? `${x.nama} - ${x.jabatan}` : x.nama })))
          } catch { /* ignore */ }
        }
        setLoading(false)
      })
      .catch(() => { toast.error('Gagal memuat data'); router.push('/dashboard/customer-po') })
  }, [params.id, reset, router])

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

  const submitForm = async (data: FV, barangAutoCreate?: Array<Record<string, unknown>>) => {
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = { ...data }
      if (body.waktu_pengiriman === '' || body.waktu_pengiriman === undefined || body.waktu_pengiriman === null) delete body.waktu_pengiriman
      if (barangAutoCreate) body.barang_auto_create = barangAutoCreate

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
      <div className="max-w-xl space-y-6">
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
                <label className="text-sm font-medium">Nomor PO Customer</label>
                <Input {...register('nomor_po_customer')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Terms of Payment</label>
                <Input {...register('terms_of_payment')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">PIC Customer</label>
                <select {...register('pic_customer_id')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring">
                  <option value="">Pilih PIC</option>
                  {picOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Waktu Pengiriman (hari)</label>
                <Input type="number" min="1" placeholder="Contoh: 7" {...register('waktu_pengiriman')} />
              </div>
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
