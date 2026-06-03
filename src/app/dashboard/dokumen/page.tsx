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
import { Search, ExternalLink, FileText, Loader2, RotateCcw, Download } from 'lucide-react'

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
  'GRN Customer',
  'Invoice',
  'Kwitansi',
  'Tanda Terima',
  'Retur Penjualan',
  'Retur Pembelian',
  'Kontrak',
]

const modulColors: Record<string, 'secondary' | 'warning' | 'success' | 'outline' | 'destructive'> = {
  'RFQ Customer': 'secondary',
  'RFQ Supplier': 'secondary',
  Quotation: 'warning',
  'Sales Order': 'success',
  'Customer PO': 'success',
  DI: 'outline',
  'Delivery Order': 'outline',
  'Delivery Slip': 'outline',
  'Resi Pengiriman': 'outline',
  GRN: 'outline',
  'GRN Customer': 'outline',
  Invoice: 'destructive',
  Kwitansi: 'warning',
  'Tanda Terima': 'outline',
  'Retur Penjualan': 'warning',
  'Retur Pembelian': 'warning',
  Kontrak: 'outline',
}

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
    setLoading(true)
    apiFetch<Document[]>('/api/v1/dokumen')
      .then((res) => {
        setData(res.data ?? [])
        setCount((res as { data: Document[]; count: number }).count ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
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
                          <Badge variant={modulColors[doc.modul] ?? 'outline'}>
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
                              size="sm"
                              onClick={() => openFile(doc.fileurl, doc.filename)}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Buka
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadFile(doc.fileurl, doc.filename)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
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
