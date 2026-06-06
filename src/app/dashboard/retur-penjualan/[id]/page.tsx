"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiFetch } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { ArrowLeft, Undo2, FileText } from "lucide-react"
import { DetailSkeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { CompactFileUpload, type DocumentFile } from "@/components/compact-file-upload"
import { toast } from "sonner"

const s: Record<string, { label: string; v: "secondary" | "warning" | "success" | "outline" }> = {
  draft: { label: "Draft", v: "secondary" }, processed: { label: "Diproses", v: "warning" }, closed: { label: "Selesai", v: "success" },
}

interface ReturPenjualan {
  id: string
  nomor: string
  customer_id: string
  tanggal: string
  status: string
  keterangan: string | null
  customer: { nama: string; kode: string } | null
  delivery_order?: { id: string; nomor: string } | null
  grn_customer?: { id: string; nomor: string; status: string } | null
  items?: ReturPenjualanItem[]
}

interface ReturPenjualanItem {
  id: string
  jumlah: number
  keterangan?: string | null
  nama_barang?: string | null
  kode_barang?: string | null
  satuan?: string | null
  barang?: { nama?: string; kode?: string; satuan?: string } | null
}

export default function ReturPenjualanDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [retur, setRetur] = useState<ReturPenjualan | null>(null)
  const [items, setItems] = useState<ReturPenjualanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      apiFetch<ReturPenjualan>(`/api/v1/retur-penjualan/${id}`),
      apiFetch<DocumentFile[]>(`/api/v1/retur-penjualan/${id}/documents`),
    ]).then(([returRes, docRes]) => {
      setRetur(returRes.data)
      setItems(returRes.data.items ?? [])
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
      const r = await apiFetchFormData(`/api/v1/retur-penjualan/${id}/documents`, formData)
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
      await apiFetch(`/api/v1/retur-penjualan/${id}/documents?docId=${docId}`, { method: "DELETE" })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast.success("File berhasil dihapus")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal hapus file")
    }
  }

  if (loading) return <DetailSkeleton />
  if (error || !retur) return <div className="text-center py-20 text-muted-foreground">Retur tidak ditemukan</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/retur-penjualan")}><ArrowLeft className="h-5 w-5" /></Button>
        <div><h1 className="text-3xl font-heading font-bold">Detail Retur Penjualan</h1><p className="text-muted-foreground mt-1">{retur.nomor}</p></div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Nomor</p>
              <p className="font-medium">{retur.nomor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={s[retur.status]?.v ?? "outline"}>{s[retur.status]?.label ?? retur.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(retur.tanggal).toLocaleDateString("id-ID")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{retur.customer?.nama} ({retur.customer?.kode})</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">DO Reference</p>
              {retur.delivery_order ? (
                <Link href={`/dashboard/delivery-order/${retur.delivery_order.id}`} className="font-medium text-primary hover:underline">
                  {retur.delivery_order.nomor}
                </Link>
              ) : (
                <p className="text-muted-foreground">-</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retur Barang (GRN)</p>
              {retur.grn_customer ? (
                <Link href={`/dashboard/grn-customer/${retur.grn_customer.id}`} className="font-medium text-primary hover:underline">
                  {retur.grn_customer.nomor}
                </Link>
              ) : (
                <p className="text-muted-foreground">-</p>
              )}
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Keterangan</p>
              <p className="font-medium">{retur.keterangan ?? "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!!items.length && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Undo2 className="h-4 w-4" />Item Barang</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barang</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nama_barang ?? item.barang?.nama}</TableCell>
                      <TableCell className="text-muted-foreground">{item.kode_barang ?? item.barang?.kode}</TableCell>
                      <TableCell className="text-right">{item.jumlah}</TableCell>
                      <TableCell>{item.satuan ?? item.barang?.satuan}</TableCell>
                      <TableCell className="text-muted-foreground">{item.keterangan ?? "-"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
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
