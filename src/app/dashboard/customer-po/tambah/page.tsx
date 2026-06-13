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
import { ArrowLeft, Loader2, Trash2, FileText, Plus } from 'lucide-react'
import { toast } from 'sonner'

const fallbackTopOptions = ['Net 14', 'Net 20', 'Net 30', 'Net 60', 'Net 90', 'Cash', 'Custom']

interface ItemRow {
  key: string
  barang_id: string
  nama_barang: string
  satuan: string
  jumlah: number
  harga_satuan: number
  has_barang_id: boolean
  save_to_master: boolean
  image_url?: string | null
  spesifikasi?: string | null
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
  const [custOpts, setCustOpts] = useState<Array<{ value: string; label: string }>>([])
  const [qtnOpts, setQtnOpts] = useState<QtnOption[]>([])
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
  const [dynamicTopOpts, setDynamicTopOpts] = useState<string[]>([])
  const [picCustomerId, setPicCustomerId] = useState('')
  const [waktuPengiriman, setWaktuPengiriman] = useState('')
  const [nomorPrCustomer, setNomorPrCustomer] = useState('')
  const [namaPenandatangan, setNamaPenandatangan] = useState('')
  const [jabatanPenandatangan, setJabatanPenandatangan] = useState('')
  const [manualBarangId, setManualBarangId] = useState('')
  const [manualJumlah, setManualJumlah] = useState(1)
  const [manualHargaSatuan, setManualHargaSatuan] = useState(0)

  const effectiveTop = top === 'Custom' ? topCustom : top

  const hasQuotation = !!selectedQtnId && items.length > 0

  const topDays = useMemo(() => {
    if (!effectiveTop) return null
    if (effectiveTop === 'Cash') return 'Cash'
    const match = effectiveTop.match(/\d+/)
    return match ? Number(match[0]) : null
  }, [effectiveTop])

  const deliveryDate = useMemo(() => {
    if (!tanggal || !waktuPengiriman) return null
    const d = new Date(tanggal + 'T00:00:00')
    d.setDate(d.getDate() + Number(waktuPengiriman))
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
  }, [tanggal, waktuPengiriman])

  const total = useMemo(() =>
    items.reduce((sum, i) => sum + i.jumlah * i.harga_satuan, 0),
    [items],
  )

  const hasNewItems = items.some(i => !i.has_barang_id)

  interface QuotationItemData {
    barang_id?: string | null
    nama_barang?: string | null
    specification?: string | null
    satuan?: string | null
    jumlah: number
    harga_satuan: number
    image_url?: string | null
    barang?: { id: string; nama: string; kode: string; satuan?: string; image_url?: string | null } | null
  }
  interface QuotationFullData {
    id: string
    customer_id: string
    pic_customer_id?: string | null
    pic_customer?: { id: string; nama: string; jabatan: string | null } | null
    items?: QuotationItemData[]
    [key: string]: unknown
  }

  const populateFromQuotation = useCallback(async (qtnId: string) => {
    setPopulating(true)
    try {
      const res = await apiFetch<QuotationFullData>(`/api/v1/quotation/${qtnId}`)
      const qtn = res.data
      if (!qtn) { toast.error('Quotation tidak ditemukan'); return }
      if (qtn.pic_customer) {
        setPicOpts([{ value: qtn.pic_customer.id, label: qtn.pic_customer.jabatan ? `${qtn.pic_customer.nama} - ${qtn.pic_customer.jabatan}` : qtn.pic_customer.nama }])
        setPicCustomerId(qtn.pic_customer.id)
      }
      if (qtn.customer_id) {
        setCustomerId(qtn.customer_id)
        if (!qtn.pic_customer) {
          try {
            const picRes = await apiFetch<Array<{ id: string; nama: string; jabatan: string | null }>>(`/api/v1/master/pic-customer?customer_id=${qtn.customer_id}`)
            setPicOpts((picRes.data ?? []).map(x => ({ value: x.id, label: x.jabatan ? `${x.nama} - ${x.jabatan}` : x.nama })))
          } catch { /* ignore */ }
        }
      }
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
          image_url: i.image_url ?? i.barang?.image_url ?? null,
          spesifikasi: i.specification ?? null,
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
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/customer'),
      apiFetch<Array<{ id: string; nomor: string; status: string; revisi?: number; customer?: { id: string; nama: string } }>>('/api/v1/quotation'),
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/barang/dropdown'),
    ]).then(([cRes, qRes, bRes]) => {
      setCustOpts((cRes.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` })))
      const approved = (qRes.data ?? []).filter((x: { status: string }) => x.status === 'approved' || x.status === 'proses_negosiasi')
      setQtnOpts(approved.map((x: { id: string; nomor: string; revisi?: number; customer?: { nama: string } }) => ({
        value: x.id,
        label: `${x.nomor} - R${x.revisi ?? 0} - ${x.customer?.nama ?? ''}`,
      })))
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
      if (!hasQuotation) {
        apiFetch<Array<{ id: string; nama: string; jabatan: string | null }>>(`/api/v1/master/pic-customer?customer_id=${customerId}`)
          .then(res => {
            setPicCustomerId('')
            setPicOpts((res.data ?? []).map(x => ({ value: x.id, label: x.jabatan ? `${x.nama} - ${x.jabatan}` : x.nama })))
          })
          .catch(() => { setPicCustomerId(''); setPicOpts([]) })
      }
      apiFetch<Array<{ top: string }>>(`/api/v1/master/customer-top?customer_id=${customerId}`)
        .then(res => {
          const tops = res.data ?? []
          setDynamicTopOpts(tops.map(t => t.top))
          if (tops.length > 0 && !top) {
            setTop(tops[0].top)
          }
        })
        .catch(() => { setDynamicTopOpts([]) })
    }
  }, [customerId, hasQuotation, top])


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

    setSubmitting(true)
    try {
      const payload = {
        customer_id: customerId,
        quotation_id: selectedQtnId || undefined,
        tanggal,
        nomor_po_customer: nomorPoCustomer || undefined,
        nomor_pr_customer: nomorPrCustomer || undefined,
        nama_penandatangan: namaPenandatangan || undefined,
        jabatan_penandatangan: jabatanPenandatangan || undefined,
        terms_of_payment: effectiveTop || undefined,
        waktu_pengiriman: waktuPengiriman ? Number(waktuPengiriman) : undefined,
        pic_customer_id: picCustomerId || undefined,
        items: validItems.map(i => ({
          barang_id: i.has_barang_id ? i.barang_id : undefined,
          jumlah: i.jumlah,
          harga_satuan: i.harga_satuan,
          nama_barang: i.has_barang_id ? undefined : i.nama_barang,
          satuan: i.has_barang_id ? undefined : i.satuan,
          image_url: i.image_url ?? undefined,
          spesifikasi: i.spesifikasi ?? undefined,
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
            <Label>Quotation *</Label>
            <Select onValueChange={setSelectedQtnId} value={selectedQtnId} disabled={hasQuotation}>
              <SelectTrigger><SelectValue placeholder={hasQuotation ? undefined : 'Pilih quotation - auto isi data'} /></SelectTrigger>
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
              <Select onValueChange={setCustomerId} value={customerId} disabled={hasQuotation}>
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
                <SelectTrigger><SelectValue placeholder={customerId ? (dynamicTopOpts.length === 0 ? 'TOP belum diatur' : 'Pilih') : 'Pilih customer dulu'} /></SelectTrigger>
                <SelectContent>
                  {(customerId && dynamicTopOpts.length > 0 ? dynamicTopOpts : fallbackTopOptions).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
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
              <Label>PIC Customer *</Label>
              <Select onValueChange={setPicCustomerId} value={picCustomerId} disabled={hasQuotation || !customerId}>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>No. PR Customer</Label>
              <Input value={nomorPrCustomer} onChange={e => setNomorPrCustomer(e.target.value)} placeholder="Nomor PR dari customer" />
            </div>
            <div>
              <Label>Nama Penandatangan</Label>
              <Input value={namaPenandatangan} onChange={e => setNamaPenandatangan(e.target.value)} placeholder="Nama penandatangan PO" />
            </div>
          </div>
          <div>
            <Label>Jabatan Penandatangan</Label>
            <Input value={jabatanPenandatangan} onChange={e => setJabatanPenandatangan(e.target.value)} placeholder="Jabatan penandatangan PO" />
          </div>

          {(effectiveTop || waktuPengiriman) && (
            <div className="text-sm bg-blue-50 border border-blue-200 rounded-md px-4 py-3 space-y-1">
              <p className="font-medium text-blue-800">📋 Estimasi Waktu</p>
              {effectiveTop && (
                <p className="text-blue-700">
                  • {topDays === 'Cash'
                    ? 'Jatuh tempo pembayaran Invoice adalah Cash (lunas saat penerimaan invoice).'
                    : `Jatuh tempo pembayaran Invoice adalah ${topDays} hari setelah hardcopy invoice diterima Customer.`
                  }
                </p>
              )}
              {waktuPengiriman && deliveryDate && (
                <p className="text-blue-700">
                  • Waktu pengiriman {waktuPengiriman} hari setelah PO terbit, maksimal pengiriman sampai {deliveryDate}.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Item Barang</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

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
                  <TableHead className="w-14">Picture</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="text-right w-20">Jumlah</TableHead>
                  <TableHead>Satuan</TableHead>
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
                    <TableCell>
                      {item.image_url
                        ? <img src={item.image_url} alt={item.nama_barang} className="h-10 w-10 object-cover rounded" />
                        : <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">-</div>
                      }
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.has_barang_id
                        ? (barangOpts.find(b => b.value === item.barang_id)?.label ?? item.nama_barang)
                        : item.nama_barang
                      }
                    </TableCell>
                    <TableCell className="text-right">{item.jumlah}</TableCell>
                    <TableCell className="text-muted-foreground">{item.satuan}</TableCell>
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
