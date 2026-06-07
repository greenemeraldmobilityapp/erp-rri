"use client"
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import Link from 'next/link'
import { Trash2, ArrowLeft, Loader2, Info, Copy, Check, FileDown, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface KontrakItemData {
  id: string
  barang_id: string | null
  kode_barang: string | null
  nama_barang: string | null
  satuan: string | null
  harga_satuan: number
}

interface AddedItem {
  key: string
  barang_id: string
  kode_barang: string
  nama_barang: string
  satuan: string
  satuan_kontrak: string
  jumlah: number
  harga_satuan: number
  harga_satuan_kontrak: number
}

interface DiData {
  id: string
  customer_id: string
  kontrak_id: string | null
  pic_customer_id: string | null
  nomor: string
  nomor_di_customer: string | null
  terms_of_payment: string | null
  waktu_pengiriman: number | null
  tanggal: string
  status: string
  keterangan: string | null
  items: Array<{
    id: string
    barang_id: string
    jumlah: number
    harga_satuan: number
    nama_barang?: string
    kode_barang?: string
    satuan?: string
    barang: { nama: string; kode: string; satuan: string } | null
  }>
}

const GEMINI_PROMPT = `Extract delivery items from this contract PDF as a JSON array. Each item must have these exact fields:
- "kode": string (item code from the contract, e.g. "CBL-001")
- "nama": string (item name exactly as written in DI, e.g. "CLT006_Brush_Paint Brush_in Pcs")
- "satuan": string (item unit, e.g. "PCS", "METER", "ROLL")
- "jumlah": number (quantity to deliver, e.g. 10)
- "harga_satuan": number (unit price from the DI document, e.g. 15000)

CRITICAL — JSON string escaping rules:
1. If a product name contains double quotes (") around a brand or term, escape each " as \\"
   Example: "nama": "\\"Swallow\\" Kapur Barus 5 Ball" instead of "nama": ""Swallow" Kapur Barus 5 Ball"
2. Forward slash (/) and other symbols do NOT need escaping — they are valid in JSON as-is.
3. Every string value must be enclosed in double quotes (") that are part of the JSON syntax, not inside the text.

Return ONLY a valid JSON array, no markdown formatting, no explanation.
Example:
[{"kode":"CBL-001","nama":"Kabel NYA 2.5mm","satuan":"PCS","harga_satuan":15000,"jumlah":10}]`

export default function EditDiPage() {
  const router = useRouter()
  const params = useParams()
  const [custOpts, setCustOpts] = useState<Array<{ value: string; label: string }>>([])
  const [kontrakOpts, setKontrakOpts] = useState<Array<{ value: string; label: string }>>([])
  const [picOpts, setPicOpts] = useState<Array<{ value: string; label: string }>>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [populating, setPopulating] = useState(false)

  const [customerId, setCustomerId] = useState('')
  const [kontrakId, setKontrakId] = useState('')
  const [picCustomerId, setPicCustomerId] = useState('')
  const [nomorDiAuto, setNomorDiAuto] = useState('')
  const [nomorDiCustomer, setNomorDiCustomer] = useState('')
  const [top, setTop] = useState('')
  const [topCustom, setTopCustom] = useState('')
  const [dynamicTopOpts, setDynamicTopOpts] = useState<string[]>([])
  const [waktuPengiriman, setWaktuPengiriman] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [status, setStatus] = useState('draft')

  const [kontrakItemsMap, setKontrakItemsMap] = useState<KontrakItemData[]>([])
  const [addedItems, setAddedItems] = useState<AddedItem[]>([])
  const [jsonInput, setJsonInput] = useState('')
  const [manualKode, setManualKode] = useState('')
  const [manualJumlah, setManualJumlah] = useState(1)
  const [copied, setCopied] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [priceDiffDialogOpen, setPriceDiffDialogOpen] = useState(false)
  const [priceDiffs, setPriceDiffs] = useState<Array<{ kode: string; nama: string; harga: number; kontrak: number }>>([])
  const [satuanDiffs, setSatuanDiffs] = useState<Array<{ kode: string; nama: string; satuan: string; kontrak: string }>>([])
  const confirmedRef = useRef(false)

  const initialKontrakIdRef = useRef('')

  const effectiveTop = top === 'Custom' ? topCustom : top

  const topDays = useMemo(() => {
    const num = parseInt(effectiveTop)
    return isNaN(num) ? effectiveTop : num.toString()
  }, [effectiveTop])

  const deliveryDate = useMemo(() => {
    if (!tanggal || !waktuPengiriman) return null
    const d = new Date(tanggal)
    d.setDate(d.getDate() + parseInt(waktuPengiriman))
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
  }, [tanggal, waktuPengiriman])

  const statusOpts = [
    { value: 'draft', label: 'Draft' },
    { value: 'confirmed', label: 'Konfirmasi' },
    { value: 'cancelled', label: 'Batal' },
  ]

  useEffect(() => {
    ;(async () => {
      try {
        const [c, diRes] = await Promise.all([
          apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/customer'),
          apiFetch<DiData>(`/api/v1/di/${params.id}`),
        ])

        const di = diRes.data
        setCustOpts((c.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` })))
        setCustomerId(di.customer_id)
        setKontrakId(di.kontrak_id ?? '')
        setPicCustomerId(di.pic_customer_id ?? '')
        setNomorDiAuto(di.nomor)
        setNomorDiCustomer(di.nomor_di_customer ?? '')
        setTop(di.terms_of_payment ?? '')
        setTopCustom(di.terms_of_payment && !['Net 14', 'Net 30', 'Net 60', 'Net 90', 'Cash', 'Custom'].includes(di.terms_of_payment) ? di.terms_of_payment : '')
        setWaktuPengiriman(di.waktu_pengiriman?.toString() ?? '')
        setTanggal(di.tanggal?.split('T')[0] ?? '')
        setKeterangan(di.keterangan ?? '')
        setStatus(di.status)

        const existingItems: AddedItem[] = (di.items ?? []).map(i => ({
          key: `existing-${i.id}`,
          barang_id: i.barang_id,
          kode_barang: i.kode_barang ?? i.barang?.kode ?? '',
          nama_barang: i.nama_barang ?? i.barang?.nama ?? '',
          satuan: i.satuan ?? i.barang?.satuan ?? '',
          satuan_kontrak: i.barang?.satuan ?? '',
          jumlah: i.jumlah,
          harga_satuan: i.harga_satuan,
          harga_satuan_kontrak: i.harga_satuan,
        }))
        setAddedItems(existingItems)

        initialKontrakIdRef.current = di.kontrak_id ?? ''

        if (di.kontrak_id) {
          const kontrakRes = await apiFetch<{ items?: KontrakItemData[] }>(`/api/v1/master/kontrak/${di.kontrak_id}`)
          const kItems = kontrakRes.data?.items ?? []
          setKontrakItemsMap(kItems)
        }

        setLoaded(true)
        setLoading(false)
      } catch {
        setLoading(false)
        toast.error('Gagal memuat data')
      }
    })()
  }, [params.id])

  const prevCustomerRef = useRef('')
  useEffect(() => {
    if (customerId && customerId !== prevCustomerRef.current) {
      prevCustomerRef.current = customerId
      apiFetch<Array<{ id: string; nama: string; nomor_kontrak: string | null; tanggal_selesai: string | null }>>(`/api/v1/master/kontrak?customer_id=${customerId}`)
        .then(res => {
          const today = new Date().toISOString().split('T')[0]
          const aktif = (res.data ?? []).filter(k => !k.tanggal_selesai || k.tanggal_selesai >= today)
          setKontrakOpts(aktif.map(x => ({
            value: x.id,
            label: x.nomor_kontrak ? `${x.nama} (${x.nomor_kontrak})` : x.nama,
          })))
        })
        .catch(() => setKontrakOpts([]))
      apiFetch<Array<{ id: string; nama: string; jabatan: string | null }>>(`/api/v1/master/pic-customer?customer_id=${customerId}`)
        .then(res => setPicOpts((res.data ?? []).map(x => ({ value: x.id, label: x.jabatan ? `${x.nama} - ${x.jabatan}` : x.nama }))))
        .catch(() => setPicOpts([]))
      apiFetch<Array<{ top: string }>>(`/api/v1/master/customer-top?customer_id=${customerId}`)
        .then(res => {
          const tops = (res.data ?? []).map((x: { top: string }) => x.top)
          setDynamicTopOpts(tops)
        })
        .catch(() => setDynamicTopOpts([]))
    }
  }, [customerId])

  const populateFromKontrak = useCallback(async (kontrakId: string) => {
    setPopulating(true)
    try {
      const res = await apiFetch<{ items?: KontrakItemData[] }>(`/api/v1/master/kontrak/${kontrakId}`)
      const kItems = res.data?.items ?? []
      setKontrakItemsMap(kItems)
      if (kItems.length) {
        toast.success(`${kItems.length} item dari kontrak siap`)
      } else {
        toast.error('Kontrak tidak memiliki item')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat kontrak')
    } finally {
      setPopulating(false)
    }
  }, [])

  const kontrakChangeByUser = useRef(false)
  useEffect(() => {
    if (!loaded) return
    if (kontrakId && kontrakId !== initialKontrakIdRef.current) {
      if (!kontrakChangeByUser.current) {
        kontrakChangeByUser.current = true
      }
      initialKontrakIdRef.current = kontrakId
      setAddedItems([])
      setJsonInput('')
      populateFromKontrak(kontrakId)
    }
  }, [kontrakId, loaded, populateFromKontrak])

  const removeItem = (key: string) => setAddedItems(prev => prev.filter(i => i.key !== key))

  const handlePreviewAndAdd = () => {
    const trimmed = jsonInput.trim()
    if (!trimmed) {
      toast.error('Tempel JSON dari Chat GPT AI terlebih dahulu')
      return
    }
    let cleaned = trimmed
    // Remove markdown code fences (```json ... ``` or ``` ... ```)
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
    // Remove BOM character
    cleaned = cleaned.replace(/^\uFEFF/, '')
    let parsed: Array<Record<string, unknown>>
    try {
      parsed = JSON.parse(cleaned)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      const posMatch = msg.match(/position\s*(\d+)/i)
      let ctx = ''
      if (posMatch) {
        const pos = parseInt(posMatch[1])
        const start = Math.max(0, pos - 20)
        ctx = cleaned.substring(start, pos + 20)
      }
      toast.error(
        `Format JSON tidak valid dari Chat GPT AI.\n` +
        `Kemungkinan: nama barang mengandung tanda petik tak ter-escape.\n` +
        `Contoh: "nama":""Swallow"... → perbaiki jadi "nama":"\\"Swallow\\"...` +
        (ctx ? `\nKontek: ...${ctx}...` : ''),
        { duration: 8000 }
      )
      return
    }
    if (!Array.isArray(parsed)) {
      toast.error('JSON harus berupa array')
      return
    }
    if (parsed.length === 0) {
      toast.error('Array JSON kosong')
      return
    }
    const errors: string[] = []
    let added = 0
    parsed.forEach((item, i) => {
      if (!item.kode || typeof item.kode !== 'string') {
        errors.push(`Item ke-${i + 1}: field "kode" (string) wajib diisi`)
        return
      }
      if (!item.jumlah || typeof item.jumlah !== 'number' || item.jumlah < 1) {
        errors.push(`Item ke-${i + 1}: field "jumlah" (number, >= 1) wajib diisi`)
        return
      }
      if (item.harga_satuan !== undefined && (typeof item.harga_satuan !== 'number' || item.harga_satuan < 0)) {
        errors.push(`Item ke-${i + 1}: field "harga_satuan" (number, >= 0) tidak valid`)
        return
      }
      const match = kontrakItemsMap.find(k => k.kode_barang === item.kode)
      if (addedItems.some(a => a.kode_barang === item.kode)) {
        errors.push(`Item "${item.kode}" sudah ditambahkan`)
        return
      }
      const geminiHarga = item.harga_satuan !== undefined ? Number(item.harga_satuan) : 0
      const geminiSatuan = String(item.satuan ?? match?.satuan ?? '')
      setAddedItems(prev => [...prev, {
        key: `json-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        barang_id: match?.barang_id ?? '',
        kode_barang: String(item.kode),
        nama_barang: String(item.nama ?? match?.nama_barang ?? '(unknown)'),
        satuan: geminiSatuan,
        satuan_kontrak: match?.satuan ?? geminiSatuan,
        jumlah: Number(item.jumlah),
        harga_satuan: geminiHarga,
        harga_satuan_kontrak: match?.harga_satuan ?? geminiHarga,
      }])
      added++
    })
    if (errors.length > 0) {
      toast.warning(`${added} item ditambahkan, ${errors.length} error:\n${errors.slice(0, 3).join('\n')}`)
    } else if (added > 0) {
      toast.success(`${added} item ditambahkan`)
    }
    setJsonInput('')
  }

  const handleManualAdd = () => {
    if (!manualKode.trim()) {
      toast.error('Masukkan kode barang')
      return
    }
    const match = kontrakItemsMap.find(k => k.kode_barang === manualKode.trim())
    if (!match) {
      toast.error(`Kode "${manualKode}" tidak ditemukan di kontrak`)
      return
    }
    if (addedItems.some(a => a.kode_barang === manualKode.trim())) {
      toast.error('Item sudah ditambahkan')
      return
    }
    setAddedItems(prev => [...prev, {
      key: `manual-${Date.now()}`,
      barang_id: match.barang_id ?? '',
      kode_barang: match.kode_barang ?? '',
      nama_barang: match.nama_barang ?? '',
      satuan: match.satuan ?? '',
      satuan_kontrak: match.satuan ?? '',
      jumlah: manualJumlah,
      harga_satuan: match.harga_satuan,
      harga_satuan_kontrak: match.harga_satuan,
    }])
    setManualKode('')
    setManualJumlah(1)
  }

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(GEMINI_PROMPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin prompt')
    }
  }

  const doSubmit = async () => {
    const validItems = addedItems.filter(i => i.barang_id)
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        customer_id: customerId,
        kontrak_id: kontrakId || null,
        pic_customer_id: picCustomerId || null,
        nomor_di_customer: nomorDiCustomer || null,
        terms_of_payment: effectiveTop || null,
        waktu_pengiriman: waktuPengiriman ? parseInt(waktuPengiriman) : null,
        tanggal,
        keterangan: keterangan || null,
        status,
        items: validItems.map(i => ({
          barang_id: i.barang_id,
          jumlah: i.jumlah,
          harga_satuan: i.harga_satuan,
          nama_barang: i.nama_barang || undefined,
          kode_barang: i.kode_barang || undefined,
          satuan: i.satuan || undefined,
        })),
      }
      await apiFetch(`/api/v1/di/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      toast.success('DI berhasil diupdate!')
      router.push(`/dashboard/di/${params.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!customerId) { toast.error('Customer harus dipilih'); return }
    if (!tanggal) { toast.error('Tanggal harus diisi'); return }
    const validItems = addedItems.filter(i => i.barang_id)
    if (validItems.length === 0) { toast.error('Minimal 1 item harus ditambahkan'); return }

    if (!confirmedRef.current) {
      const hargaDiffs = validItems.filter(i => i.harga_satuan_kontrak && i.harga_satuan !== i.harga_satuan_kontrak)
      const satuanDiffsItems = validItems.filter(i => i.satuan_kontrak && i.satuan.toLowerCase() !== i.satuan_kontrak.toLowerCase())
      if (hargaDiffs.length > 0 || satuanDiffsItems.length > 0) {
        setPriceDiffs(hargaDiffs.map(i => ({ kode: i.kode_barang, nama: i.nama_barang, harga: i.harga_satuan, kontrak: i.harga_satuan_kontrak })))
        setSatuanDiffs(satuanDiffsItems.map(i => ({ kode: i.kode_barang, nama: i.nama_barang, satuan: i.satuan, kontrak: i.satuan_kontrak })))
        setPriceDiffDialogOpen(true)
        return
      }
    }
    confirmedRef.current = false
    await doSubmit()
  }

  const handleConfirmSubmit = () => {
    confirmedRef.current = true
    setPriceDiffDialogOpen(false)
    setTimeout(() => handleSubmit(), 0)
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/di/${params.id}`}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold">Edit DI</h1>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Informasi DI</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nomor DI (Otomatis)</Label>
            <Input value={nomorDiAuto} disabled />
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
              <Label>Kontrak</Label>
              <Select onValueChange={setKontrakId} value={kontrakId}>
                <SelectTrigger><SelectValue placeholder="Pilih kontrak" /></SelectTrigger>
                <SelectContent>
                  {kontrakOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {populating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Loader2 className="h-4 w-4 animate-spin" />Memuat item dari kontrak...
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>PIC Customer *</Label>
              <Select onValueChange={setPicCustomerId} value={picCustomerId}>
                <SelectTrigger><SelectValue placeholder="Pilih PIC" /></SelectTrigger>
                <SelectContent>
                  {picOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tanggal *</Label>
              <DatePicker value={tanggal} onChange={setTanggal} />
            </div>
          </div>

          <div>
            <Label>Nomor DI Customer</Label>
            <Input value={nomorDiCustomer} onChange={e => setNomorDiCustomer(e.target.value)} placeholder="Masukkan nomor dari customer" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Terms of Payment</Label>
              <Select onValueChange={setTop} value={top}>
                <SelectTrigger>
                  <SelectValue placeholder={dynamicTopOpts.length ? 'Pilih TOP' : 'TOP belum diatur'} />
                </SelectTrigger>
                <SelectContent>
                  {(dynamicTopOpts.length ? dynamicTopOpts : ['Net 14', 'Net 30', 'Net 60', 'Net 90', 'Cash', 'Custom']).map(o => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {top === 'Custom' && (
                <Input className="mt-2" value={topCustom} onChange={e => setTopCustom(e.target.value)} placeholder="Tulis TOP custom" />
              )}
            </div>
            <div>
              <Label>Waktu Pengiriman (hari)</Label>
              <Input type="number" min="1" value={waktuPengiriman}
                onChange={e => setWaktuPengiriman(e.target.value)} placeholder="Estimasi hari pengiriman" />
            </div>
          </div>

          {(effectiveTop || deliveryDate) && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              <Info className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                {effectiveTop && (
                  <p>Terms of payment: <strong>{effectiveTop}</strong> — {topDays === 'Cash' ? 'Pembayaran tunai' : `Jatuh tempo pembayaran Invoice adalah ${topDays} hari setelah hardcopy invoice diterima Customer.`}</p>
                )}
                {waktuPengiriman && deliveryDate && (
                  <p className="mt-1">Waktu pengiriman {waktuPengiriman} hari setelah DI terbit, maksimal pengiriman sampai <strong>{deliveryDate}</strong>.</p>
                )}
              </div>
            </div>
          )}

          <div>
            <Label>Status</Label>
            <Select onValueChange={setStatus} value={status}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Keterangan</Label>
            <Textarea value={keterangan} onChange={e => setKeterangan(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Item Barang</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {kontrakId && (
            <div className="text-sm text-muted-foreground">
              Kontrak dipilih: <strong>{kontrakOpts.find(o => o.value === kontrakId)?.label ?? kontrakId}</strong>
              {kontrakItemsMap.length > 0 && <span> — {kontrakItemsMap.length} item barang siap</span>}
            </div>
          )}
          {!kontrakId && (
            <div className="text-sm text-muted-foreground">Pilih kontrak di kartu Informasi DI untuk menambah item barang</div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Opsi 1: Import JSON dari Chat GPT AI</h3>
              <Button variant="outline" size="sm" onClick={handleCopyPrompt} disabled={!kontrakId}>
                {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied ? 'Tersalin' : 'Salin Prompt'}
              </Button>
            </div>

            <div className="relative">
              <Textarea
                readOnly
                value={GEMINI_PROMPT}
                rows={4}
                className="text-xs font-mono bg-muted resize-none pr-8"
              />
              <FileDown className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
            </div>

            <p className="text-xs text-muted-foreground">
              1. Upload PDF DI (Delivery Instruction) ke chat Chat GPT AI. 2. Kirim prompt di atas. 3. Copy JSON hasil ekstraksi.
            </p>

            <div className="space-y-2">
              <Label>Tempel JSON dari Chat GPT AI</Label>
              <Textarea
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder='[{"kode":"CBL-001","nama":"Kabel NYA 2.5mm","satuan":"PCS","harga_satuan":15000,"jumlah":10}]'
                rows={4}
                className="text-xs font-mono"
              />
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  onClick={handlePreviewAndAdd}
                  disabled={!jsonInput.trim() || !kontrakId}
                >
                  Preview &amp; Tambahkan
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-semibold">Opsi 2: Input Manual</h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-xs">Kode Barang</Label>
                <Input
                  value={manualKode}
                  onChange={e => setManualKode(e.target.value)}
                  placeholder="Ketik kode barang"
                  disabled={!kontrakId}
                  onKeyDown={e => { if (e.key === 'Enter') handleManualAdd() }}
                />
              </div>
              <div className="w-24">
                <Label className="text-xs">Jumlah</Label>
                <Input type="number" min="1" value={manualJumlah}
                  onChange={e => setManualJumlah(Number(e.target.value))}
                  disabled={!kontrakId} />
              </div>
              <Button variant="outline" size="sm" onClick={handleManualAdd} disabled={!kontrakId || !manualKode.trim()}>
                + Tambah
              </Button>
            </div>
            {kontrakId && kontrakItemsMap.length > 0 && manualKode.trim().length > 0 && (
              <div className="text-xs text-muted-foreground">
                {kontrakItemsMap.filter(k => (k.kode_barang ?? '').toLowerCase().includes(manualKode.toLowerCase())).length > 0
                  ? 'Kode ditemukan di kontrak'
                  : 'Kode tidak ditemukan di kontrak'}
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Daftar Item DI ({addedItems.length})</h3>
            {addedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Belum ada item. Gunakan Import JSON atau Input Manual di atas.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama Barang</TableHead>
                      <TableHead className="w-16">Satuan</TableHead>
                      <TableHead className="w-20 text-right">Qty</TableHead>
                      <TableHead className="w-28 text-right">Harga Satuan</TableHead>
                      <TableHead className="w-24 text-right">Subtotal</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addedItems.map((item, idx) => (
                      <TableRow key={item.key}>
                        <TableCell className="text-xs text-muted-foreground text-center">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{item.kode_barang}</TableCell>
                        <TableCell>{item.nama_barang}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Input type="text" value={item.satuan}
                              className={item.satuan.toLowerCase() !== item.satuan_kontrak.toLowerCase() ? 'text-black dark:text-black border-amber-400 bg-amber-50' : ''}
                              onChange={e => {
                                const val = e.target.value
                                setAddedItems(prev => prev.map(a =>
                                  a.key === item.key ? { ...a, satuan: val } : a
                                ))
                              }} />
                            {item.satuan.toLowerCase() !== item.satuan_kontrak.toLowerCase() && (
                              <span className="text-xs text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                ≠ kontrak: {item.satuan_kontrak}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input type="number" min="1" value={item.jumlah}
                            onChange={e => {
                              const qty = Number(e.target.value)
                              setAddedItems(prev => prev.map(a =>
                                a.key === item.key ? { ...a, jumlah: qty } : a
                              ))
                            }} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Input type="number" min="0" value={item.harga_satuan}
                              className={item.harga_satuan !== item.harga_satuan_kontrak ? 'text-black dark:text-black border-amber-400 bg-amber-50' : ''}
                              onChange={e => {
                                const hg = Number(e.target.value)
                                setAddedItems(prev => prev.map(a =>
                                  a.key === item.key ? { ...a, harga_satuan: hg } : a
                                ))
                              }} />
                            {item.harga_satuan !== item.harga_satuan_kontrak && (
                              <span className="text-xs text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                ≠ kontrak: Rp {item.harga_satuan_kontrak.toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          Rp {(item.jumlah * item.harga_satuan).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeItem(item.key)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {addedItems.length > 0 && (
              <div className="text-right font-bold text-lg mt-3">
                Total: Rp {addedItems.reduce((sum, i) => sum + i.jumlah * i.harga_satuan, 0).toLocaleString('id-ID')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="cancel" asChild>
          <Link href={`/dashboard/di/${params.id}`}>Batal</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || populating}>
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitting ? 'Menyimpan...' : 'Update DI'}
        </Button>
      </div>

      {priceDiffDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-slate-900">Perbedaan dengan Kontrak</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Ada perbedaan data antara DI dan kontrak:
            </p>
            {priceDiffs.length > 0 && (
              <>
                <p className="text-sm font-medium mb-2 text-slate-800">Harga Satuan:</p>
                <Table className="mb-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-slate-700">Kode</TableHead>
                      <TableHead className="text-slate-700">Nama</TableHead>
                      <TableHead className="text-right text-slate-700">Harga DI</TableHead>
                      <TableHead className="text-right text-slate-700">Harga Kontrak</TableHead>
                      <TableHead className="text-right text-slate-700">Selisih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceDiffs.map(d => (
                      <TableRow key={d.kode}>
                        <TableCell className="text-slate-800">{d.kode}</TableCell>
                        <TableCell className="text-slate-800">{d.nama}</TableCell>
                        <TableCell className="text-right text-slate-800">{d.harga.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-right text-slate-800">{d.kontrak.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-right font-medium text-amber-600">
                          {(d.harga - d.kontrak) > 0 ? '+' : ''}{(d.harga - d.kontrak).toLocaleString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
            {satuanDiffs.length > 0 && (
              <>
                <p className="text-sm font-medium mb-2 text-slate-800">Satuan:</p>
                <Table className="mb-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-slate-700">Kode</TableHead>
                      <TableHead className="text-slate-700">Nama</TableHead>
                      <TableHead className="text-slate-700">Satuan DI</TableHead>
                      <TableHead className="text-slate-700">Satuan Kontrak</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {satuanDiffs.map(d => (
                      <TableRow key={d.kode}>
                        <TableCell className="text-slate-800">{d.kode}</TableCell>
                        <TableCell className="text-slate-800">{d.nama}</TableCell>
                        <TableCell className="text-amber-600 font-medium">{d.satuan}</TableCell>
                        <TableCell className="text-slate-800">{d.kontrak}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="cancel" onClick={() => setPriceDiffDialogOpen(false)}>
                Kembali Edit
              </Button>
              <Button onClick={handleConfirmSubmit}>
                Lanjutkan Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
