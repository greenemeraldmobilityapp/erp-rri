"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiFetch } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { BreadcrumbNav, BreadcrumbItem } from "@/components/breadcrumb-nav"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { FileUpload, type DocumentFile } from "@/components/file-upload"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

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
  customer: { nama: string }[]
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
  barang: { kode: string; nama: string; satuan: string } | null
}

export default function DetailKontrakPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [data, setData] = useState<Kontrak | null>(null)
  const [items, setItems] = useState<KontrakItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Record<string, DocumentFile[]>>({
    kontrak: [],
    rfq_customer: [],
    di: [],
  })
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!id) return
    apiFetch<Kontrak>(`/api/v1/master/kontrak/${id}`)
      .then((res) => { setData(res.data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!id) return
    Promise.all([
      apiFetch<DocumentFile[]>(`/api/v1/master/kontrak/${id}/documents?jenis=kontrak`),
      apiFetch<DocumentFile[]>(`/api/v1/master/kontrak/${id}/documents?jenis=rfq_customer`),
      apiFetch<DocumentFile[]>(`/api/v1/master/kontrak/${id}/documents?jenis=di`),
    ]).then(([kontrak, rfq, di]) => {
      setDocuments({
        kontrak: kontrak.data ?? [],
        rfq_customer: rfq.data ?? [],
        di: di.data ?? [],
      })
    }).catch(() => {})
  }, [id])

  useEffect(() => {
    if (!id) return
    apiFetch<KontrakItem[]>(`/api/v1/master/kontrak/${id}/items`)
      .then((res) => setItems(res.data ?? []))
      .catch(() => {})
  }, [id])

  const handleUpload = (jenis: string) => async (file: File) => {
    if (!id) return
    setUploading(prev => ({ ...prev, [jenis]: true }))
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("jenis_dokumen", jenis)
      const { apiFetchFormData } = await import("@/lib/api/client")
      const r = await apiFetchFormData(`/api/v1/master/kontrak/${id}/documents`, formData)
      setDocuments(prev => ({
        ...prev,
        [jenis]: [r.data as DocumentFile, ...prev[jenis]],
      }))
      toast.success("File berhasil diupload")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal upload file")
    } finally {
      setUploading(prev => ({ ...prev, [jenis]: false }))
    }
  }

  const handleDeleteDocument = (jenis: string) => async (docId: string) => {
    if (!id) return
    try {
      await apiFetch(`/api/v1/master/kontrak/${id}/documents?docId=${docId}`, { method: "DELETE" })
      setDocuments(prev => ({
        ...prev,
        [jenis]: prev[jenis].filter((d) => d.id !== docId),
      }))
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

  const documentLabels: Record<string, string> = {
    kontrak: "Dokumen Kontrak",
    rfq_customer: "RFQ dari Customer",
    di: "Delivery Instruction (DI)",
  }

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

      <Card>
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
              <p className="text-sm font-medium">{data.customer?.[0]?.nama || "-"}</p>
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
                    const kode = item.kode_barang || item.barang?.kode || '-'
                    const nama = item.nama_barang || item.barang?.nama || '-'
                    const satuan = item.satuan || item.barang?.satuan || '-'
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

      <div className="mt-6">
        <Tabs defaultValue="kontrak">
          <TabsList>
            <TabsTrigger value="kontrak">Dokumen Kontrak</TabsTrigger>
            <TabsTrigger value="rfq_customer">RFQ Customer</TabsTrigger>
            <TabsTrigger value="di">Delivery Instruction</TabsTrigger>
          </TabsList>
          {['kontrak', 'rfq_customer', 'di'].map((jenis) => (
            <TabsContent key={jenis} value={jenis} className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-base font-semibold mb-4">{documentLabels[jenis]}</h3>
                  <FileUpload
                    documents={documents[jenis]}
                    onUpload={handleUpload(jenis)}
                    onDelete={handleDeleteDocument(jenis)}
                    uploading={uploading[jenis]}
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
