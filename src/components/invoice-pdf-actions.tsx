"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Eye, Download, Loader2 } from 'lucide-react'
import { getAuthToken, apiFetch } from '@/lib/api/client'
import { toast } from 'sonner'

interface Props {
  invId: string
  nomor: string
}

function getDistribution(total: number): { page: number; count: number }[] {
  const pages: { page: number; count: number }[] = []
  let remaining = total
  let idx = 0
  while (remaining > 0) {
    const limit = idx === 0 ? 16 : 24
    const count = Math.min(limit, remaining)
    pages.push({ page: idx + 1, count })
    remaining -= count
    idx++
  }
  return pages
}

export function InvoicePdfActions({ invId, nomor }: Props) {
  const [previewLoading, setPreviewLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [itemsCount, setItemsCount] = useState<number | null>(null)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    if (!open) return
    apiFetch<{ items: unknown[] }>(`/api/v1/invoice/${invId}`).then(res => {
      const n = res.data?.items?.length ?? 0
      setTotalItems(n)
      setItemsCount(n)
    }).catch(() => {
      setTotalItems(0)
      setItemsCount(null)
    })
  }, [open, invId])

  const fetchPdfBlob = async (count?: number | null) => {
    const token = await getAuthToken()
    const url = count != null && count > 0
      ? `/api/v1/invoice/${invId}/pdf?itemsCount=${count}`
      : `/api/v1/invoice/${invId}/pdf`
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.error || 'Gagal memuat PDF')
    }
    return res.blob()
  }

  const handlePreview = async (count?: number | null) => {
    setPreviewLoading(true)
    try {
      const blob = await fetchPdfBlob(count)
      window.open(URL.createObjectURL(blob), '_blank')
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat PDF')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleDownload = async (count?: number | null) => {
    setDownloadLoading(true)
    try {
      const blob = await fetchPdfBlob(count)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${nomor}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal download PDF')
    } finally {
      setDownloadLoading(false)
    }
  }

  const distribution = itemsCount != null ? getDistribution(itemsCount) : []

  return (
    <div className="flex gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview Invoice
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atur Items Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tentukan jumlah items barang yang akan tampil di PDF Invoice.
            </p>
            <div>
              <label className="text-sm font-medium block mb-1">Jumlah Items</label>
              <Input
                type="number"
                min={1}
                max={totalItems}
                value={itemsCount ?? ''}
                onChange={e => setItemsCount(e.target.value ? parseInt(e.target.value, 10) : null)}
              />
              <p className="text-xs text-muted-foreground mt-1">Maksimal {totalItems} items</p>
            </div>
            {distribution.length > 0 && (
              <div className="bg-muted/50 rounded-md p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Distribusi halaman:</p>
                {distribution.map(({ page, count }) => (
                  <div key={page} className="flex items-center gap-2 text-sm">
                    <span className="w-24 font-medium">Halaman {page}</span>
                    <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-primary/20 rounded-sm flex items-center justify-end pr-1 text-xs text-muted-foreground"
                        style={{ width: `${(count / itemsCount!) * 100}%`, minWidth: count > 0 ? '20px' : '0' }}
                      >
                        {count}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{count} item{count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:opacity-95"
                onClick={() => handlePreview(itemsCount)}
                disabled={previewLoading}
              >
                {previewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                Preview
              </Button>
              <Button
                onClick={() => handleDownload(itemsCount)}
                disabled={downloadLoading}
              >
                {downloadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
