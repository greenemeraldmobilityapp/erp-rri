"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Pencil, FileText, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { KwitansiPdfActions } from "@/components/kwitansi-pdf-actions"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { CompactFileUpload, type DocumentFile } from "@/components/compact-file-upload"
import { toast } from "sonner"

const statusMap: Record<string, { label: string; variant: 'secondary' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  completed: { label: 'Selesai', variant: 'success' },
}

interface KwitansiItem {
  id: string
  invoice_item_id: string
  jumlah: number
  invoice_item: {
    barang_id: string
    harga_satuan: number
    harga: number
    barang: { nama: string; kode: string; satuan: string } | null
  } | null
}

interface KwitansiData {
  id: string
  nomor: string
  invoice: { nomor: string } | null
  tanggal: string
  status: string
  keterangan: string | null
  items: KwitansiItem[]
}

export default function KwitansiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('')
  const [data, setData] = useState<KwitansiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    apiFetch<KwitansiData>(`/api/v1/kwitansi/${id}`)
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))

    apiFetch<DocumentFile[]>(`/api/v1/kwitansi/${id}/documents`)
      .then((res) => setDocuments(res.data ?? []))
      .catch(() => {})
  }, [id])

  const handleUpload = async (file: File) => {
    if (!id) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const { apiFetchFormData } = await import("@/lib/api/client")
      const r = await apiFetchFormData(`/api/v1/kwitansi/${id}/documents`, formData)
      setDocuments((prev) => [r.data as DocumentFile, ...prev].filter(Boolean))
      toast.success("File berhasil diupload")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal upload file")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!id) return
    try {
      await apiFetch(`/api/v1/kwitansi/${id}/documents?docId=${docId}`, { method: "DELETE" })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast.success("File berhasil dihapus")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal hapus file")
    }
  }

  const handleComplete = async () => {
    if (!id) return
    setStatusLoading(true)
    try {
      await apiFetch(`/api/v1/kwitansi/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' }),
      })
      toast.success('Kwitansi diselesaikan!')
      const r = await apiFetch<KwitansiData>(`/api/v1/kwitansi/${id}`)
      if (r.data) setData(r.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah status')
    } finally {
      setStatusLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2" />Memuat...</div>
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/dashboard/kwitansi"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div><h1 className="text-3xl font-heading font-bold">Kwitansi</h1></div>
        </div>
        <Card><CardContent className="py-12 text-center text-muted-foreground">Kwitansi tidak ditemukan.</CardContent></Card>
      </div>
    )
  }

  const totalItems = data.items.reduce((sum, i) => sum + i.jumlah, 0)

  const getBarangInfo = (item: KwitansiItem) => {
    if (!item.invoice_item?.barang) return { nama: '-', kode: '', satuan: '' }
    return { nama: item.invoice_item.barang.nama, kode: item.invoice_item.barang.kode, satuan: item.invoice_item.barang.satuan }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/dashboard/kwitansi"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-heading font-bold">{data.nomor}</h1>
              <Badge variant={statusMap[data.status]?.variant ?? 'outline'}>
                {statusMap[data.status]?.label ?? data.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">Tanda terima pembayaran</p>
          </div>
        </div>
        <div className="flex gap-2">
          {data.status === 'draft' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={statusLoading} className="bg-[#22C55E] text-white hover:bg-[#16A34A] dark:bg-[#15803D] dark:hover:bg-[#166534]">
                  {statusLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Selesaikan
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Konfirmasi Selesaikan Kwitansi
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menyelesaikan kwitansi <span className="font-medium text-foreground">{data.nomor}</span>?
                    Setelah diselesaikan, status tidak dapat dikembalikan ke draft.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={statusLoading}>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault()
                      handleComplete()
                    }}
                    className="bg-[#22C55E] text-white hover:bg-[#16A34A]"
                    disabled={statusLoading}
                  >
                    {statusLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Ya, Selesaikan
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <KwitansiPdfActions kwtId={id} nomor={data.nomor} />
          {data.status === 'draft' && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/kwitansi/${id}/edit`}><Pencil className="h-4 w-4 mr-2" />Edit</Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Ref</p>
              <p className="font-medium">{data.invoice?.nomor ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(data.tanggal).toLocaleDateString('id-ID')}</p>
            </div>
            {data.keterangan && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Keterangan</p>
                <p className="font-medium">{data.keterangan}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {data.items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-4 w-4" />Item Kwitansi</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right">Jumlah (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item, i) => {
                  const { nama, kode } = getBarangInfo(item)
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{nama}</TableCell>
                      <TableCell className="text-muted-foreground">{kode}</TableCell>
                      <TableCell className="text-right">{item.invoice_item?.harga ? item.invoice_item.harga.toLocaleString('id-ID') : '-'}</TableCell>
                      <TableCell className="text-right font-medium">{item.jumlah.toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4 pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{totalItems.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Lampiran</h3>
          <CompactFileUpload
            documents={documents}
            onUpload={handleUpload}
            onDelete={handleDeleteDocument}
            uploading={uploading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
