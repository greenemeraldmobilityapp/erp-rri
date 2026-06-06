"use client"

import { useState, useEffect } from 'react'
import { apiFetch, getAuthToken } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DocumentSearchCombobox } from '@/components/ui/document-search-combobox'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { Search, ExternalLink, FileText, Loader2, RotateCcw, Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Document {
  id: string
  filename: string
  fileurl: string
  uploadedat: string
  modul: string
  nomordokumen: string
  customerid: string
  customernama: string
}

interface Customer {
  id: string
  nama: string
  kode: string
}

const modulOptions = [
  'RFQ Customer',
  'RFQ Supplier',
  'Quotation',
  'Sales Order',
  'Customer PO',
  'DI',
  'Delivery Order',
  'Delivery Slip',
  'Resi Pengiriman',
  'GRN',
  'Retur Barang (GRN)',
  'Invoice',
  'Kwitansi',
  'Tanda Terima',
  'Retur Penjualan',
  'Retur Pembelian',
  'Kontrak',
]

const modulBadgeClasses: Record<string, string> = {
  // Early Stage - Biru
  'RFQ Customer': 'bg-primary/10 text-primary font-medium',
  'RFQ Supplier': 'bg-blue-500/10 text-blue-500 font-medium',
  
  // Mid Stage - Kuning/Orange
  'Quotation': 'bg-warning/10 text-warning font-medium',
  'Customer PO': 'bg-orange-500/10 text-orange-500 font-medium',
  'Sales Order': 'bg-amber-500/10 text-amber-500 font-medium',
  
  // Active/Shipping - Hijau
  'DI': 'bg-emerald-500/10 text-emerald-500 font-medium',
  'Delivery Order': 'bg-green-500/10 text-green-500 font-medium',
  'Delivery Slip': 'bg-teal-500/10 text-teal-500 font-medium',
  'Resi Pengiriman': 'bg-cyan-500/10 text-cyan-500 font-medium',
  
  // Financial - Merah/Merah Muda
  'Invoice': 'bg-destructive/10 text-destructive font-medium',
  'Kwitansi': 'bg-rose-500/10 text-rose-500 font-medium',
  'Tanda Terima': 'bg-pink-500/10 text-pink-500 font-medium',
  
  // Return - Kuning/Lime
  'Retur Penjualan': 'bg-yellow-500/10 text-yellow-500 font-medium',
  'Retur Pembelian': 'bg-lime-500/10 text-lime-500 font-medium',
  
  // Inventory - Abu
  'GRN': 'bg-slate-500/10 text-slate-500 font-medium',
  'Retur Barang (GRN)': 'bg-zinc-500/10 text-zinc-500 font-medium',
  
  // Legal - Ungu
  'Kontrak': 'bg-violet-500/10 text-violet-500 font-medium',
}

const getBadgeClass = (modul: string) => modulBadgeClasses[modul] || 'bg-muted text-muted-foreground font-medium'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function DokumenPage() {
  const [data, setData] = useState<Document[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState('')
  const [modul, setModul] = useState('')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [diNomor, setDiNomor] = useState('')
  const [poNomor, setPoNomor] = useState('')
  const [diOptions, setDiOptions] = useState<Map<string, { customer_id: string; customer_nama: string }>>(new Map())
  const [poOptions, setPoOptions] = useState<Map<string, { customer_id: string; customer_nama: string }>>(new Map())
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    apiFetch<Customer[]>('/api/v1/master/customer')
      .then((res) => setCustomerOptions(res.data ?? []))
      .catch(() => {})

    apiFetch<Document[]>('/api/v1/dokumen')
      .then((res) => {
        setData(res.data ?? [])
        setCount((res as { data: Document[]; count: number }).count ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const loadData = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (customerId) params.set('customerId', customerId)
    if (modul) params.set('modul', modul)
    if (search) params.set('search', search)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (diNomor) params.set('diNomor', diNomor)
    if (poNomor) params.set('poNomor', poNomor)

    apiFetch<Document[]>(`/api/v1/dokumen?${params.toString()}`)
      .then((res) => {
        setData(res.data ?? [])
        setCount((res as { data: Document[]; count: number }).count ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleFilter = () => loadData()

  const handleReset = () => {
    setCustomerId('')
    setModul('')
    setSearch('')
    setStartDate('')
    setEndDate('')
    setDiNomor('')
    setPoNomor('')
    setDiOptions(new Map())
    setPoOptions(new Map())
    setLoading(true)
    apiFetch<Document[]>('/api/v1/dokumen')
      .then((res) => {
        setData(res.data ?? [])
        setCount((res as { data: Document[]; count: number }).count ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleDelete = async (docId: string) => {
    setDeleteLoading(true)
    try {
      await apiFetch(`/api/v1/dokumen/${docId}`, { method: 'DELETE' })
      toast.success('Dokumen berhasil dihapus')
      loadData()
    } catch {
      toast.error('Gagal menghapus dokumen')
    } finally {
      setDeleteLoading(false)
    }
  }

  const officeExts = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']

  const openFile = async (url: string, filename: string) => {
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
    if (officeExts.includes(ext)) {
      window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`, '_blank', 'noopener,noreferrer')
      return
    }
    if (url.startsWith('/api/')) {
      const win = window.open('', '_blank')
      if (!win) return
      const token = await getAuthToken()
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { win.close(); return }
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      win.location.href = blobUrl
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const downloadFile = async (url: string, filename: string) => {
    const token = url.startsWith('/api/') ? await getAuthToken() : null
    const res = await fetch(url, {
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    })
    if (!res.ok) return
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Manajemen Dokumen</h1>
        <p className="text-muted-foreground mt-1">Kelola semua file dokumen dari seluruh modul</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Customer</label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      [{c.kode}] {c.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Modul</label>
              <Select value={modul} onValueChange={setModul}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Modul" />
                </SelectTrigger>
                <SelectContent>
                  {modulOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Cari File</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nama file..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Dari Tanggal</label>
              <DatePicker value={startDate} onChange={setStartDate} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sampai Tanggal</label>
              <DatePicker value={endDate} onChange={setEndDate} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Nomor DI
                {diNomor && (
                  <button
                    className="ml-2 text-destructive hover:text-destructive/80"
                    onClick={() => { setDiNomor(''); setDiOptions(new Map()) }}
                    title="Hapus filter DI"
                  >
                    &times;
                  </button>
                )}
              </label>
              <DocumentSearchCombobox
                placeholder="Cari nomor DI..."
                value={diNomor}
                onChange={setDiNomor}
                onSearch={async (q) => {
                  const res = await apiFetch<Array<{ nomor: string; nomor_di_customer: string; customer_nama: string; customer_id: string; id: string }>>(`/api/v1/dokumen/autocomplete/di?q=${encodeURIComponent(q)}`)
                  return (res.data ?? []).map((item) => ({
                    id: item.id,
                    value: item.nomor_di_customer,
                    label: item.nomor_di_customer,
                    sublabel: `${item.nomor} | ${item.customer_nama}`,
                    raw: { customer_id: item.customer_id, customer_nama: item.customer_nama },
                  }))
                }}
                onSelectOption={(option) => {
                  const raw = option.raw as { customer_id: string; customer_nama: string } | undefined
                  if (raw?.customer_id) {
                    setDiOptions(new Map([[option.value, { customer_id: raw.customer_id, customer_nama: raw.customer_nama }]]))
                    setCustomerId(raw.customer_id)
                  }
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Nomor PO Customer
                {poNomor && (
                  <button
                    className="ml-2 text-destructive hover:text-destructive/80"
                    onClick={() => { setPoNomor(''); setPoOptions(new Map()) }}
                    title="Hapus filter PO"
                  >
                    &times;
                  </button>
                )}
              </label>
              <DocumentSearchCombobox
                placeholder="Cari nomor PO Customer..."
                value={poNomor}
                onChange={setPoNomor}
                onSearch={async (q) => {
                  const res = await apiFetch<Array<{ nomor: string; nomor_po_customer: string; customer_nama: string; customer_id: string; id: string }>>(`/api/v1/dokumen/autocomplete/po?q=${encodeURIComponent(q)}`)
                  return (res.data ?? []).map((item) => ({
                    id: item.id,
                    value: item.nomor_po_customer,
                    label: item.nomor_po_customer,
                    sublabel: `${item.nomor} | ${item.customer_nama}`,
                    raw: { customer_id: item.customer_id, customer_nama: item.customer_nama },
                  }))
                }}
                onSelectOption={(option) => {
                  const raw = option.raw as { customer_id: string; customer_nama: string } | undefined
                  if (raw?.customer_id) {
                    setPoOptions(new Map([[option.value, { customer_id: raw.customer_id, customer_nama: raw.customer_nama }]]))
                    setCustomerId(raw.customer_id)
                  }
                }}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleFilter} size="sm">
              <Search className="h-4 w-4 mr-2" />
              Cari
            </Button>
            <Button variant="outline" onClick={handleReset} size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-3">Tidak ada dokumen ditemukan</p>
              <p className="text-xs text-muted-foreground mt-1">Sesuaikan filter untuk mencari dokumen</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Menampilkan <span className="font-medium text-foreground">{count}</span> dokumen
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama File</TableHead>
                      <TableHead>Modul</TableHead>
                      <TableHead>Nomor Dokumen</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Tanggal Upload</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="max-w-[250px]">
                          <span className="truncate block text-sm font-medium">{doc.filename}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getBadgeClass(doc.modul)}>
                            {doc.modul}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{doc.nomordokumen || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{doc.customernama}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(doc.uploadedat)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-primary hover:bg-primary/10"
                              onClick={() => openFile(doc.fileurl, doc.filename)}
                              title="Buka dokumen"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-success hover:bg-success/10"
                              onClick={() => downloadFile(doc.fileurl, doc.filename)}
                              title="Download dokumen"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <DeleteConfirmationDialog
                              title="Konfirmasi Hapus Dokumen"
                              description="Apakah Anda yakin ingin menghapus file dokumen ini? Tindakan ini tidak dapat dibatalkan."
                              itemName={doc.filename}
                              isLoading={deleteLoading}
                              onConfirm={() => handleDelete(doc.id)}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10"
                                  title="Hapus dokumen"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
