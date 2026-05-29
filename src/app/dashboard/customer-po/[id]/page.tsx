"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiFetch } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { ArrowLeft, FileText } from "lucide-react"
import { FileUpload, type DocumentFile } from "@/components/file-upload"
import { toast } from "sonner"

const s: Record<string, { label: string; v: "secondary" | "warning" | "success" | "outline" }> = {
  draft: { label: "Draft", v: "secondary" }, confirmed: { label: "Dikonfirmasi", v: "success" }, cancelled: { label: "Batal", v: "outline" },
}

interface CustomerPo {
  id: string
  nomor: string
  customer_id: string
  tanggal: string
  status: string
  nomor_po_customer: string | null
  terms_of_payment: string | null
  waktu_pengiriman: number | null
  pic_customer_id: string | null
  customer_pic: { nama: string; jabatan: string | null; no_hp: string | null } | null
  customer: { nama: string; kode: string } | null
  items: Array<{
    id: string
    jumlah: number
    harga_satuan: number
    barang: { nama: string; kode: string; satuan: string } | null
  }>
}

export default function CustomerPoDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [po, setPo] = useState<CustomerPo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      apiFetch<CustomerPo>(`/api/v1/customer-po/${id}`),
      apiFetch<DocumentFile[]>(`/api/v1/customer-po/${id}/documents`),
    ]).then(([poRes, docRes]) => {
      setPo(poRes.data)
      setDocuments(docRes.data ?? [])
      setLoading(false)
    }).catch((err) => {
      setError(err.message)
      setLoading(false)
    })
  }, [id])

  const handleUpload = async (file: File) => {
    if (!id) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const { apiFetchFormData } = await import("@/lib/api/client")
      const r = await apiFetchFormData(`/api/v1/customer-po/${id}/documents`, formData)
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
      await apiFetch(`/api/v1/customer-po/${id}/documents?docId=${docId}`, { method: "DELETE" })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast.success("File berhasil dihapus")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal hapus file")
    }
  }

  if (loading) return <div className="text-center py-20 text-muted-foreground">Memuat...</div>
  if (error || !po) return <div className="text-center py-20 text-muted-foreground">Customer PO tidak ditemukan</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/customer-po")}><ArrowLeft className="h-5 w-5" /></Button>
        <div><h1 className="text-3xl font-heading font-bold">Detail Customer PO</h1><p className="text-muted-foreground mt-1">{po.nomor}</p></div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Nomor</p>
              <p className="font-medium">{po.nomor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={s[po.status]?.v ?? "outline"}>{s[po.status]?.label ?? po.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(po.tanggal).toLocaleDateString("id-ID")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{po.customer?.nama} ({po.customer?.kode})</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PO Customer</p>
              <p className="font-medium">{po.nomor_po_customer ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Terms of Payment</p>
              <p className="font-medium">{po.terms_of_payment ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PIC Customer</p>
              <p className="font-medium">{po.customer_pic?.nama ?? "-"}</p>
              {po.customer_pic?.jabatan && <p className="text-xs text-muted-foreground">{po.customer_pic.jabatan}</p>}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Waktu Pengiriman</p>
              <p className="font-medium">{po.waktu_pengiriman ? `${po.waktu_pengiriman} hari` : "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jatuh Tempo</p>
              <p className="font-medium text-xs">Dihitung setelah invoice hardcopy diterima customer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!!po.items?.length && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-4 w-4" />Item Barang</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barang</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.barang?.nama}</TableCell>
                    <TableCell className="text-muted-foreground">{item.barang?.kode}</TableCell>
                    <TableCell className="text-right">{item.jumlah}</TableCell>
                    <TableCell>{item.barang?.satuan}</TableCell>
                    <TableCell className="text-right">{item.harga_satuan?.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right">{(item.jumlah * item.harga_satuan).toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-right font-bold text-lg">
              Total: {po.items.reduce((sum, i) => sum + i.jumlah * i.harga_satuan, 0).toLocaleString("id-ID")}
            </div>
          </CardContent>
        </Card>
      )}

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
