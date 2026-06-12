"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Pencil, FileText, Loader2 } from 'lucide-react'
import { KwitansiPdfActions } from "@/components/kwitansi-pdf-actions"
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
    harga: number
    barang: { nama: string; kode: string; satuan: string } | null
  } | null
}

interface KwitansiData {
  id: string
  nomor: string
  invoice: {
    nomor: string
    tanggal: string
    top: string
    customer: { nama: string; kode: string } | null
    sales_order?: {
      nomor: string
      di?: {
        nomor: string
        nomor_di_customer: string | null
      } | null
    } | null
  } | null
  tanggal: string
  status: string
  keterangan: string | null
  items: KwitansiItem[]
  kontrak_nomor: string | null
  pic_nama: string | null
  pic_jabatan: string | null
  cpo_ref: string | null
  cpo_cust_ref: string | null
}

export default function KwitansiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('')
  const [data, setData] = useState<KwitansiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    apiFetch<KwitansiData>(`/api/v1/kwitansi/${id}`)
      .then(r => { setData(r.data); setLoading(false); setError(null) })
      .catch((err) => { setError(err instanceof Error ? err.message : 'Gagal memuat data'); setLoading(false) })

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
        <Card>
          <CardContent className="py-12 text-center">
            {error ? (
              <div className="space-y-2">
                <p className="text-destructive font-medium">{error}</p>
                <Button variant="outline" size="sm" onClick={() => { setLoading(true); setError(null); apiFetch<KwitansiData>(`/api/v1/kwitansi/${id}`).then(r => { setData(r.data); setLoading(false) }).catch((err) => { setError(err instanceof Error ? err.message : 'Gagal memuat data'); setLoading(false) }) }}>
                  Coba Lagi
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">Kwitansi tidak ditemukan.</p>
            )}
          </CardContent>
        </Card>
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
            <h1 className="text-3xl font-heading font-bold">Detail Kwitansi</h1>
            <p className="text-muted-foreground mt-1">{data.nomor}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <KwitansiPdfActions kwtId={id} nomor={data.nomor} />
          {data.status === 'draft' && (
            <Button className="bg-primary text-primary-foreground hover:opacity-95" asChild>
              <Link href={`/dashboard/kwitansi/${id}/edit`}><Pencil className="h-4 w-4 mr-2" />Edit</Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Status Kwitansi</h3>
            <Badge variant={statusMap[data.status]?.variant ?? 'outline'} className="text-sm px-4 py-1">
              {statusMap[data.status]?.label ?? data.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {(() => {
            const invDate = (() => { try { return new Date(data.invoice?.tanggal ?? '') } catch { return null } })()
            const topDays = (() => { const m = String(data.invoice?.top ?? '').match(/\d+/); return m ? Number(m[0]) : NaN })()
            const jatuhTempoDate = (() => {
              if (!invDate || isNaN(invDate.getTime()) || isNaN(topDays)) return null
              const d = new Date(invDate)
              d.setDate(d.getDate() + topDays)
              return isNaN(d.getTime()) ? null : d
            })()
            const isValidDate = jatuhTempoDate !== null && !isNaN(jatuhTempoDate.getTime())
            const isOverdue = isValidDate ? new Date() > jatuhTempoDate : false
            return (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Ref</p>
                  <p className="font-medium">{data.invoice?.nomor ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{data.invoice?.customer?.nama ?? '-'}</p>
                  {data.invoice?.customer?.kode && (
                    <p className="text-xs text-muted-foreground">{data.invoice.customer.kode}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kontrak Ref</p>
                  <p className="font-medium">{data.kontrak_nomor ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DI Cust. Ref</p>
                  <p className="font-medium">{data.invoice?.sales_order?.di?.nomor_di_customer ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DI Ref</p>
                  <p className="font-medium">{data.invoice?.sales_order?.di?.nomor ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPO Ref</p>
                  <p className="font-medium">{data.cpo_ref ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPO Cust. Ref</p>
                  <p className="font-medium">{data.cpo_cust_ref ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">PIC Customer</p>
                  {data.pic_nama ? (
                    <>
                      <p className="font-medium">{data.pic_nama}</p>
                      {data.pic_jabatan && <p className="text-xs text-muted-foreground">{data.pic_jabatan}</p>}
                    </>
                  ) : (
                    <p className="font-medium">-</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{new Date(data.invoice?.tanggal ?? data.tanggal).toLocaleDateString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jatuh Tempo Pembayaran Invoice</p>
                  {isValidDate ? (
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${isOverdue ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"}`}>
                      {jatuhTempoDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  ) : (
                    <span className="mt-1 text-xs text-muted-foreground">-</span>
                  )}
                </div>
                {data.keterangan && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Keterangan</p>
                    <p className="font-medium">{data.keterangan}</p>
                  </div>
                )}
              </div>
            )
          })()}
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
