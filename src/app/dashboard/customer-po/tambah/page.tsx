"use client"
import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Loader2, Trash2, FileText, Plus, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { KelolaKategoriDialog } from '@/components/kelola-kategori-dialog'

const topOptions = ['Net 14', 'Net 30', 'Net 60', 'Net 90', 'Cash', 'Custom']

interface ItemRow {
  key: string
  barang_id: string
  nama_barang: string
  satuan: string
  jumlah: number
  harga_satuan: number
  has_barang_id: boolean
  save_to_master: boolean
}

interface QtnOption {
  value: string
  label: string
}

export default function TambahPoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [nomorAuto, setNomorAuto] = useState('')
  const [custOpts, setCustOpts] = useState<Array<{ value: string; label: string }>>([])
  const [qtnOpts, setQtnOpts] = useState<QtnOption[]>([])
  const [kategoriOpts, setKategoriOpts] = useState<Array<{ value: string; label: string }>>([])
  const [barangOpts, setBarangOpts] = useState<Array<{ value: string; label: string }>>([])
  const [items, setItems] = useState<ItemRow[]>([])
  const [populating, setPopulating] = useState(false)
  const [selectedQtnId, setSelectedQtnId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [nomorPoCustomer, setNomorPoCustomer] = useState('')
  const [top, setTop] = useState('')
  const [topCustom, setTopCustom] = useState('')
  const [picOpts, setPicOpts] = useState<Array<{ value: string; label: string }>>([])
  const [picCustomerId, setPicCustomerId] = useState('')
  const [waktuPengiriman, setWaktuPengiriman] = useState('')
  const [kategoriBaruId, setKategoriBaruId] = useState('')
  const [kategoriDialogOpen, setKategoriDialogOpen] = useState(false)
  const [manualBarangId, setManualBarangId] = useState('')
  const [manualJumlah, setManualJumlah] = useState(1)
  const [manualHargaSatuan, setManualHargaSatuan] = useState(0)

  const effectiveTop = top === 'Custom' ? topCustom : top

  const total = useMemo(() =>
    items.reduce((sum, i) => sum + i.jumlah * i.harga_satuan, 0),
    [items],
  )

  const hasNewItems = items.some(i => !i.has_barang_id)

  interface QuotationItemData {
    barang_id?: string | null
    nama_barang?: string | null
    satuan?: string | null
    jumlah: number
    harga_satuan: number
    barang?: { id: string; nama: string; kode: string; satuan?: string } | null
  }
  interface QuotationFullData {
    id: string
    customer_id: string
    items?: QuotationItemData[]
    [key: string]: unknown
  }

  const populateFromQuotation = useCallback(async (qtnId: string) => {
    setPopulating(true)
    try {
      const res = await apiFetch<QuotationFullData>(`/api/v1/quotation/${qtnId}`)
      const qtn = res.data
      if (!qtn) { toast.error('Quotation tidak ditemukan'); return }
      if (qtn.customer_id) setCustomerId(qtn.customer_id)
      if (qtn.items?.length) {
        const rows: ItemRow[] = qtn.items.map((i, idx) => ({
          key: `qtn-${idx}`,
          barang_id: i.barang_id ?? '',
          nama_barang: i.nama_barang ?? i.barang?.nama ?? '',
          satuan: i.satuan ?? i.barang?.satuan ?? '',
          jumlah: i.jumlah,
          harga_satuan: i.harga_satuan,
          has_barang_id: !!i.barang_id,
          save_to_master: !i.barang_id,
        }))
        setItems(rows)
      }
      toast.success('Data dari quotation berhasil diisi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat quotation')
    } finally {
      setPopulating(false)
    }
  }, [])

  useEffect(() => {
    Promise.all([
      apiFetch<{ nomor: string }>('/api/v1/customer-po/next-number'),
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/customer'),
      apiFetch<Array<{ id: string; nomor: string; status: string; revisi?: number; customer?: { id: string; nama: string } }>>('/api/v1/quotation'),
      apiFetch<Array<{ id: string; nama: string }>>('/api/v1/master/kategori-barang'),
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/barang'),
    ]).then(([nomorRes, cRes, qRes, kRes, bRes]) => {
      if (nomorRes.data?.nomor) setNomorAuto(nomorRes.data.nomor)
      setCustOpts((cRes.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` })))
      const approved = (qRes.data ?? []).filter((x: { status: string }) => x.status === 'approved' || x.status === 'proses_negosiasi')
      setQtnOpts(approved.map((x: { id: string; nomor: string; revisi?: number; customer?: { nama: string } }) => ({
        value: x.id,
        label: `${x.nomor} - R${x.revisi ?? 0} - ${x.customer?.nama ?? ''}`,
      })))
      setKategoriOpts((kRes.data ?? []).map(x => ({ value: x.id, label: x.nama })))
      setBarangOpts((bRes.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` })))
      setLoading(false)
    }).catch(() => { setLoading(false); toast.error('Gagal memuat data awal') })
  }, [])

  const initializedRef = useRef(false)
  useEffect(() => {
    const preSelected = searchParams.get('quotation_id')
    if (preSelected && qtnOpts.length > 0 && !initializedRef.current) {
      initializedRef.current = true
      setSelectedQtnId(preSelected)
    }
  }, [searchParams, qtnOpts])

  const prevQtnRef = useRef('')
  useEffect(() => {
    if (selectedQtnId && selectedQtnId !== prevQtnRef.current) {
      prevQtnRef.current = selectedQtnId
      populateFromQuotation(selectedQtnId)
    }
  }, [selectedQtnId, populateFromQuotation])

  const prevCustomerRef = useRef('')
  useEffect(() => {
    if (customerId && customerId !== prevCustomerRef.current) {
      prevCustomerRef.current = customerId
      setPicCustomerId('')
      apiFetch<Array<{ id: string; nama: string; jabatan: string | null }>>(`/api/v1/master/pic-customer?customer_id=${customerId}`)
        .then(res => setPicOpts((res.data ?? []).map(x => ({ value: x.id, label: x.jabatan ? `${x.nama} - ${x.jabatan}` : x.nama }))))
        .catch(() => { setPicOpts([]) })
    }
  }, [customerId])

  const handleKategoriSuccess = useCallback(async () => {
    try {
      const res = await apiFetch<Array<{ id: string; nama: string }>>('/api/v1/master/kategori-barang')
      setKategoriOpts((res.data ?? []).map(x => ({ value: x.id, label: x.nama })))
    } catch { /* ignore */ }
  }, [])

  const toggleCheck = (key: string) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, save_to_master: !i.save_to_master } : i))
  }

  const removeItem = (key: string) => {
    setItems(prev => prev.filter(i => i.key !== key))
  }

  const addManualItem = () => {
    if (!manualBarangId) { toast.error('Pilih barang terlebih dahulu'); return }
    const barang = barangOpts.find(b => b.value === manualBarangId)
    setItems(prev => [...prev, {
      key: `manual-${Date.now()}`,
      barang_id: manualBarangId,
      nama_barang: barang?.label ?? '',
      satuan: '',
      jumlah: manualJumlah,
      harga_satuan: manualHargaSatuan,
      has_barang_id: true,
      save_to_master: false,
    }])
    setManualBarangId('')
    setManualJumlah(1)
    setManualHargaSatuan(0)
  }

  const handleSubmit = async () => {
    if (!customerId) { toast.error('Customer harus dipilih'); return }
    if (!tanggal) { toast.error('Tanggal harus diisi'); return }
    const validItems = items.filter(i => i.has_barang_id || i.save_to_master)
    if (validItems.length === 0) { toast.error('Minimal 1 item harus dipilih'); return }
    if (hasNewItems && !kategoriBaruId) { toast.error('Pilih kategori untuk barang baru'); return }

    setSubmitting(true)
    try {
      const payload = {
        customer_id: customerId,
        quotation_id: selectedQtnId || undefined,
        tanggal,
        nomor_po_customer: nomorPoCustomer || undefined,
        terms_of_payment: effectiveTop || undefined,
        waktu_pengiriman: waktuPengiriman ? Number(waktuPengiriman) : undefined,
        pic_customer_id: picCustomerId || undefined,
        kategori_baru_id: kategoriBaruId || undefined,
        items: validItems.map(i => ({
          barang_id: i.has_barang_id ? i.barang_id : undefined,
          jumlah: i.jumlah,
          harga_satuan: i.harga_satuan,
          nama_barang: i.has_barang_id ? undefined : i.nama_barang,
          satuan: i.has_barang_id ? undefined : i.satuan,
          create_barang: !i.has_barang_id,
        })),
      }
      const res = await apiFetch<{ id: string }>('/api/v1/customer-po', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      toast.success('PO berhasil dibuat')
      router.push(`/dashboard/customer-po/${res.data.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-muted-foreground">Memuat...</div>

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/customer-po"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold">Tambah Customer PO</h1>
          <p className="text-muted-foreground mt-1">Purchase Order dari customer</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Informasi PO</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nomor PO (Otomatis)</Label>
            <Input value={nomorAuto} disabled className="bg-muted" />
          </div>

          <div>
            <Label>Quotation (opsional)</Label>
            <Select onValueChange={setSelectedQtnId} value={selectedQtnId}>
              <SelectTrigger><SelectValue placeholder="Pilih quotation - auto isi data" /></SelectTrigger>
              <SelectContent>
                {qtnOpts.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {populating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />Mengisi data dari quotation...
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Customer *</Label>
              <Select onValueChange={setCustomerId} value={customerId}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {custOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tanggal *</Label>
              <DatePicker value={tanggal} onChange={setTanggal} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nomor PO Customer</Label>
              <Input value={nomorPoCustomer} onChange={e => setNomorPoCustomer(e.target.value)} placeholder="Dari customer" />
            </div>
            <div>
              <Label>Terms of Payment</Label>
              <Select onValueChange={setTop} value={top}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {topOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
              {top === 'Custom' && (
                <Input
                  className="mt-2"
                  value={topCustom}
                  onChange={e => setTopCustom(e.target.value)}
                  placeholder="Misal: Net 45"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>PIC Customer</Label>
              <Select onValueChange={setPicCustomerId} value={picCustomerId} disabled={!customerId}>
                <SelectTrigger><SelectValue placeholder={customerId ? 'Pilih PIC' : 'Pilih customer dulu'} /></SelectTrigger>
                <SelectContent>
                  {picOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Waktu Pengiriman (hari)</Label>
              <Input
                type="number" min="1" placeholder="Contoh: 7"
                value={waktuPengiriman}
                onChange={e => setWaktuPengiriman(e.target.value)}
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            Jatuh tempo dihitung setelah invoice hardcopy diterima customer, bukan saat PO dibuat.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Item Barang</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasNewItems && <>
            <div className="flex items-end gap-4 pb-2 border-b">
              <div className="flex-1">
                <Label>Kategori untuk barang baru</Label>
                <Select onValueChange={setKategoriBaruId} value={kategoriBaruId}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {kategoriOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setKategoriDialogOpen(true)}>
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
            <KelolaKategoriDialog open={kategoriDialogOpen} onOpenChange={setKategoriDialogOpen} onSuccess={handleKategoriSuccess} />
          </>}

          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Pilih quotation untuk mengisi item otomatis</p>
              <p className="text-xs mt-1">atau tambah manual di bawah</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {hasNewItems && <TableHead className="w-10">Simpan</TableHead>}
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead className="text-right w-20">Jumlah</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.key}>
                    {hasNewItems && (
                      <TableCell>
                        {!item.has_barang_id && (
                          <Checkbox
                            checked={item.save_to_master}
                            onCheckedChange={() => toggleCheck(item.key)}
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {item.has_barang_id
                        ? (barangOpts.find(b => b.value === item.barang_id)?.label ?? item.nama_barang)
                        : item.nama_barang
                      }
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.satuan}</TableCell>
                    <TableCell className="text-right">{item.jumlah}</TableCell>
                    <TableCell className="text-right">{item.harga_satuan.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right">{(item.jumlah * item.harga_satuan).toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      {item.has_barang_id && (
                        <Button variant="ghost" size="sm" onClick={() => removeItem(item.key)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="text-right font-bold text-lg">
            Total: Rp {total.toLocaleString('id-ID')}
          </div>

          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2">Tambah Barang Manual</div>
            <div className="flex gap-2 items-end flex-wrap">
              <div className="min-w-[200px] flex-1">
                <Label className="text-xs">Barang</Label>
                <Select onValueChange={setManualBarangId} value={manualBarangId}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    {barangOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20">
                <Label className="text-xs">Jumlah</Label>
                <Input type="number" min="1" value={manualJumlah} onChange={e => setManualJumlah(Number(e.target.value))} />
              </div>
              <div className="w-28">
                <Label className="text-xs">Harga</Label>
                <Input type="number" min="0" value={manualHargaSatuan} onChange={e => setManualHargaSatuan(Number(e.target.value))} />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addManualItem}>
                <Plus className="h-4 w-4 mr-1" />Tambah
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="cancel" asChild>
          <Link href="/dashboard/customer-po">Batal</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || populating}>
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitting ? 'Menyimpan...' : 'Simpan PO'}
        </Button>
      </div>
    </div>
  )
}
