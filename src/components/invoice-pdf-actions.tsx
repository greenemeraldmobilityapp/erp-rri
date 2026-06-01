"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Download, Loader2 } from 'lucide-react'
import { getAuthToken } from '@/lib/api/client'
import { toast } from 'sonner'

interface Props {
  invId: string
  nomor: string
}

export function InvoicePdfActions({ invId, nomor }: Props) {
  const [previewLoading, setPreviewLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)

  const fetchPdfBlob = async () => {
    const token = await getAuthToken()
    const res = await fetch(`/api/v1/invoice/${invId}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.error || 'Gagal memuat PDF')
    }
    return res.blob()
  }

  const handlePreview = async () => {
    setPreviewLoading(true)
    try {
      const blob = await fetchPdfBlob()
      window.open(URL.createObjectURL(blob), '_blank')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat PDF')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloadLoading(true)
    try {
      const blob = await fetchPdfBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${nomor}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal download PDF')
    } finally {
      setDownloadLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handlePreview} disabled={previewLoading}>
        {previewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
        Preview Invoice
      </Button>
      <Button className="bg-primary text-primary-foreground hover:opacity-95" onClick={handleDownload} disabled={downloadLoading}>
        {downloadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </Button>
    </div>
  )
}
