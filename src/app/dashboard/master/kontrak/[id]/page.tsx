"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiFetch } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, FileText, ExternalLink, Trash2 } from "lucide-react"
import { BreadcrumbNav, BreadcrumbItem } from "@/components/breadcrumb-nav"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

export interface DocumentFile {
  id: string
  file_name: string
  file_url: string
  drive_file_id?: string | null
  uploaded_at: string
}

const breadcrumbItems: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Master Data" },
  { label: "Kontrak", href: "/dashboard/master/kontrak" },
  { label: "Detail Kontrak" },
]

interface Kontrak {
  id: string
  customer_id: string
  nomor_kontrak: string | null
  nama: string
  customer: { nama: string } | null
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  tanggal_tanda_tangan: string | null
  penandatangan_rri_nama: string | null
  penandatangan_rri_jabatan: string | null
  penandatangan_customer_nama: string | null
  penandatangan_customer_jabatan: string | null
  catatan: string | null
  is_active: boolean
  created_at: string
}

interface KontrakItem {
  id: string
  kode_barang: string | null
  nama_barang: string | null
  satuan: string | null
  harga_satuan: number
}

export default function DetailKontrakPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [data, setData] = useState<Kontrak | null>(null)
  const [items, setItems] = useState<KontrakItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    if (e.target) e.target.value = ""
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("jenis_dokumen", "kontrak")
      const { apiFetchFormData } = await import("@/lib/api/client")
      const r = await apiFetchFormData(`/api/v1/master/kontrak/${id}/documents`, formData)
      setDocuments(prev => [r.data as DocumentFile, ...prev])
      toast.success("File berhasil diupload")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal upload file")
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    apiFetch<Kontrak>(`/api/v1/master/kontrak/${id}`)
      .then((res) => { setData(res.data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!id) return
    apiFetch<DocumentFile[]>(`/api/v1/master/kontrak/${id}/documents?jenis=kontrak`)
      .then((res) => setDocuments(res.data ?? []))
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (!id) return
    apiFetch<KontrakItem[]>(`/api/v1/master/kontrak/${id}/items`)
      .then((res) => setItems(res.data ?? []))
      .catch(() => {})
  }, [id])

  const handleDeleteDocument = async (docId: string) => {
    if (!id) return
    try {
      await apiFetch(`/api/v1/master/kontrak/${id}/documents?docId=${docId}`, { method: "DELETE" })
      setDocuments(prev => prev.filter((d) => d.id !== docId))
      toast.success("File berhasil dihapus")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal hapus file")
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const statusBadge = (isActive: boolean) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      isActive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
    }`}>
      {isActive ? "Active" : "Non-Active"}
    </span>
  )

  if (loading) return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader title="Detail Kontrak" />
      <div className="min-h-[200px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader title="Error" />
      <EmptyState title="Data tidak ditemukan" description={error || "Kontrak tidak ditemukan"} />
    </div>
  )

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader
        title={data.nama || "Detail Kontrak"}
        description={data.nomor_kontrak ? `No: ${data.nomor_kontrak}` : "Informasi lengkap"}
        actions={
          <div className="flex gap-2">
            <Button variant="back" onClick={() => router.push("/dashboard/master/kontrak")}>Kembali</Button>
            <Button onClick={() => router.push(`/dashboard/master/kontrak/${id}/edit`)}>Edit</Button>
          </div>
        }
      />

      <div className="mt-6 flex items-center gap-3 rounded-lg border bg-card p-3">
        <span className="text-sm font-medium shrink-0">Dokumen Kontrak:</span>
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1 min-h-[36px]">
          {documents.length === 0 && !uploading && (
            <span className="text-xs text-muted-foreground">Belum ada file</span>
          )}
          {documents.map((doc) => (
            <span key={doc.id} className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs max-w-[200px] group">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate text-primary">{doc.file_name}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-green-600 hover:text-green-700 p-0.5">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>Buka file</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <button onClick={() => handleDeleteDocument(doc.id)} className="shrink-0 text-red-600 hover:text-red-700 p-0.5">
                <Trash2 className="h-4 w-4" />
              </button>
            </span>
          ))}
          {uploading && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Mengupload...
            </span>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileInput} />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="shrink-0">
          <Upload className="h-3 w-3 mr-1" /> Upload
        </Button>
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Nomor Kontrak</label>
              <p className="text-sm font-medium">{data.nomor_kontrak || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Nama Kontrak</label>
              <p className="text-sm font-medium">{data.nama}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Customer</label>
              <p className="text-sm font-medium">{data.customer?.nama || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
              <p>{statusBadge(data.is_active)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Tanggal Mulai</label>
              <p className="text-sm">{formatDate(data.tanggal_mulai)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Tanggal Selesai</label>
              <p className="text-sm">{formatDate(data.tanggal_selesai)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Tanggal Tanda Tangan</label>
              <p className="text-sm">{formatDate(data.tanggal_tanda_tangan)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Penandatangan RRI</p>
              <p className="text-sm font-medium">{data.penandatangan_rri_nama || "-"}</p>
              <p className="text-xs text-muted-foreground">{data.penandatangan_rri_jabatan || ""}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Penandatangan Customer</p>
              <p className="text-sm font-medium">{data.penandatangan_customer_nama || "-"}</p>
              <p className="text-xs text-muted-foreground">{data.penandatangan_customer_jabatan || ""}</p>
            </div>
          </div>

          {data.catatan && (
            <div className="mt-6 pt-6 border-t">
              <label className="block text-sm font-medium text-muted-foreground mb-1">Catatan</label>
              <p className="text-sm whitespace-pre-wrap">{data.catatan}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Barang</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, i) => {
                    const kode = item.kode_barang || '-'
                    const nama = item.nama_barang || '-'
                    const satuan = item.satuan || '-'
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{kode}</TableCell>
                        <TableCell>{nama}</TableCell>
                        <TableCell>{satuan}</TableCell>
                        <TableCell className="text-right">Rp {item.harga_satuan.toLocaleString('id-ID')}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
