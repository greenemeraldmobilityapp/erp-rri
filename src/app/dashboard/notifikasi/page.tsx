"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, XCircle, Clock, Search, Eye, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { formatDateTimeShort } from '@/lib/utils/date'
import { apiFetch } from '@/lib/api/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface WhatsAppLog {
  id: string
  user_id: string | null
  recipient: string
  message: string
  status: string
  error_reason: string | null
  sent_at: string | null
  created_at: string
}

interface PageData {
  items: WhatsAppLog[]
  count: number
  page: number
  totalPages: number
}

export default function NotifikasiPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)

  const status = searchParams.get('status') || ''
  const cari = searchParams.get('cari') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const [filterStatus, setFilterStatus] = useState(status)
  const [filterCari, setFilterCari] = useState(cari)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (status) params.set('status', status)
        if (cari) params.set('cari', cari)
        params.set('page', String(page))
        params.set('limit', '50')

        const json = await apiFetch<PageData>(`/api/v1/whatsapp-log?${params}`)
        if (!cancelled) setData(json.data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [status, cari, page])

  function applyFilters() {
    const params = new URLSearchParams()
    if (filterStatus && filterStatus !== '_all') params.set('status', filterStatus)
    if (filterCari) params.set('cari', filterCari)
    params.set('page', '1')
    router.push(`/dashboard/notifikasi?${params.toString()}`)
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`/dashboard/notifikasi?${params.toString()}`)
  }

  const hasErrorReason = data?.items.some(i => i.error_reason) ?? false

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Notifikasi WhatsApp</h1>
          <p className="text-muted-foreground mt-1">Riwayat pengiriman notifikasi WhatsApp</p>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Notifikasi WhatsApp</h1>
        <p className="text-muted-foreground mt-1">Riwayat pengiriman notifikasi WhatsApp</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">Status</label>
          <Select value={filterStatus || '_all'} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Semua status</SelectItem>
              <SelectItem value="sent">Terkirim</SelectItem>
              <SelectItem value="delivered">Tersampaikan</SelectItem>
              <SelectItem value="failed">Gagal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">Cari Penerima</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="w-56 pl-8"
              placeholder="Nomor HP..."
              value={filterCari}
              onChange={(e) => setFilterCari(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyFilters() }}
            />
          </div>
        </div>
        <Button onClick={applyFilters}>Cari</Button>
      </div>

      {!data?.items.length ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">Notifikasi tidak ditemukan.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Pesan</TableHead>
                  <TableHead>Status</TableHead>
                  {hasErrorReason && <TableHead>Keterangan</TableHead>}
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {formatDateTimeShort(item.sent_at || item.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.recipient}</TableCell>
                    <TableCell className="max-w-md truncate text-sm">{item.message}</TableCell>
                    <TableCell>
                      {item.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="h-3.5 w-3.5" /> Terkirim
                        </span>
                      ) : item.status === 'delivered' ? (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          <Clock className="h-3.5 w-3.5" /> Tersampaikan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <XCircle className="h-3.5 w-3.5" /> Gagal
                        </span>
                      )}
                    </TableCell>
                    {hasErrorReason && (
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                        {item.error_reason || '-'}
                      </TableCell>
                    )}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Lihat pesan lengkap"
                        onClick={() => setSelectedMessage(item.message)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {data.page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => goToPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Total: {data.count} notifikasi
          </p>
        </>
      )}

      <Dialog open={!!selectedMessage} onOpenChange={(open) => { if (!open) setSelectedMessage(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pesan Lengkap</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm rounded-lg bg-muted p-4 font-mono">
            {selectedMessage}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
