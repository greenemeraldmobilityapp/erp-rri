"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiFetch } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Pencil, Trash2, ImageIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { FileUpload, type DocumentFile } from "@/components/file-upload"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { toast } from "sonner"

const statusLabel: Record<string, { label: string; variant: "secondary" | "warning" | "success" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Terkirim", variant: "warning" },
  responded: { label: "Direspon", variant: "success" },
  closed: { label: "Ditutup", variant: "outline" },
}

interface RFQCustomerItem {
  id: string
  barang_id: string | null
  nama_barang: string | null
  jumlah: number
  satuan: string | null
  image_url: string | null
  keterangan: string | null
  barang: { id: string; nama: string; kode: string; satuan: string } | null
}

interface RFQCustomer {
  id: string
  nomor: string
  customer_id: string
  nomor_rfq_customer: string | null
  tanggal: string
  perihal: string | null
  status: string
  keterangan: string | null
  is_active: boolean
  created_at: string
  customer: { id: string; nama: string; kode: string }
  pic_customer: { id: string; nama: string; jabatan: string } | null
  items: RFQCustomerItem[]
}

export default function RfqCustomerDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [data, setData] = useState<RFQCustomer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!id) return
    apiFetch<RFQCustomer>(`/api/v1/rfq-customer/${id}`)
      .then((res) => { setData(res.data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!id) return
    apiFetch<DocumentFile[]>(`/api/v1/rfq-customer/${id}/documents`)
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
      const r = await apiFetchFormData(`/api/v1/rfq-customer/${id}/documents`, formData)
      setDocuments((prev) => [r.data as { id: string; file_name: string; file_url: string; uploaded_at: string; rfq_customer_id: string }, ...prev].filter(Boolean))
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
      await apiFetch(`/api/v1/rfq-customer/${id}/documents?docId=${docId}`, { method: "DELETE" })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast.success("File berhasil dihapus")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal hapus file")
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await apiFetch(`/api/v1/rfq-customer/${id}`, { method: "DELETE" })
    router.push("/dashboard/rfq-customer")
  }

  if (loading) return <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8"><div className="min-h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><p className="ml-3 text-muted-foreground">Memuat data...</p></div></div>
  if (error || !data) return <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8"><EmptyState title="Gagal memuat data" description={error || "Data tidak ditemukan"} /></div>

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <PageHeader
        title="Detail RFQ Customer"
        description={`${data.nomor} - ${data.customer?.nama || ""}`}
        actions={
          <div className="flex gap-2">
            <Button variant="back" onClick={() => router.push("/dashboard/rfq-customer")}>Kembali</Button>
            <Button variant="outline" onClick={() => router.push(`/dashboard/rfq-customer/${id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />Edit
            </Button>
            <DeleteConfirmationDialog
              onConfirm={handleDelete}
              itemName={`RFQ Customer ${data.nomor}`}
              trigger={<Button variant="outline" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-2" />Hapus</Button>}
            />
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold font-mono">{data.nomor}</h2>
            </div>
            <Badge variant={statusLabel[data.status]?.variant ?? "outline"}>
              {statusLabel[data.status]?.label ?? data.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{data.customer?.nama || "-"}</p>
              <p className="text-xs text-muted-foreground">{data.customer?.kode || ""}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(data.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nomor RFQ Customer</p>
              <p className="font-medium">{data.nomor_rfq_customer || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PIC Customer</p>
              <p className="font-medium">{data.pic_customer?.nama || "-"}</p>
              {data.pic_customer?.jabatan && (
                <p className="text-xs text-muted-foreground">{data.pic_customer.jabatan}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Perihal</p>
              <p className="font-medium">{data.perihal || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dibuat Pada</p>
              <p className="font-medium">{new Date(data.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
            {data.keterangan && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Keterangan</p>
                <p className="font-medium whitespace-pre-wrap">{data.keterangan}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Item Barang</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Gambar</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.barang?.kode || "-"}</TableCell>
                    <TableCell className="font-medium">{item.barang?.nama || item.nama_barang || "-"}</TableCell>
                    <TableCell className="text-right">{item.jumlah}</TableCell>
                    <TableCell>{item.satuan || item.barang?.satuan || "-"}</TableCell>
                    <TableCell>
                      {item.image_url ? (
                        <a href={item.image_url} target="_blank" rel="noopener noreferrer">
                          <img src={item.image_url} alt="Gambar barang" className="h-10 w-10 rounded object-cover border hover:opacity-80 transition-opacity" />
                        </a>
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.keterangan || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Total item: <span className="font-medium">{data.items.length}</span>
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Lampiran</h3>
          <FileUpload
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
