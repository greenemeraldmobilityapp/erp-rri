"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiFetch } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { ArrowLeft, ClipboardList, Undo2 } from "lucide-react"
import { DetailSkeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { CompactFileUpload, type DocumentFile } from "@/components/compact-file-upload"
import { toast } from "sonner"

const s: Record<string, { label: string; v: "secondary" | "success" | "outline" }> = {
  draft: { label: "Draft", v: "secondary" }, completed: { label: "Selesai", v: "success" },
}

interface GrnCustomer {
  id: string
  nomor: string
  retur_penjualan_id: string | null
  delivery_order_id: string | null
  customer_id: string | null
  gudang_id: string | null
  tanggal: string
  status: string
  keterangan: string | null
  customer: { nama: string; kode: string } | null
  gudang: { nama: string } | null
  delivery_order: { nomor: string } | null
  retur_penjualan: { nomor: string } | null
  items?: GrnCustomerItem[]
}

interface GrnCustomerItem {
  id: string
  jumlah: number
  keterangan: string | null
  nama_barang: string | null
  kode_barang: string | null
  satuan: string | null
  barang: { nama: string; kode: string; satuan: string } | null
}

export default function GrnCustomerDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [grn, setGrn] = useState<GrnCustomer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      apiFetch<GrnCustomer>(`/api/v1/grn-customer/${id}`),
      apiFetch<DocumentFile[]>(`/api/v1/grn-customer/${id}/documents`),
    ]).then(([grnRes, docRes]) => {
      setGrn(grnRes.data)
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
      const r = await apiFetchFormData(`/api/v1/grn-customer/${id}/documents`, formData)
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
      await apiFetch(`/api/v1/grn-customer/${id}/documents?docId=${docId}`, { method: "DELETE" })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast.success("File berhasil dihapus")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal hapus file")
    }
  }

  if (loading) return <DetailSkeleton />
  if (error || !grn) return <div className="text-center py-20 text-muted-foreground">Retur Barang tidak ditemukan</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/grn-customer")}><ArrowLeft className="h-5 w-5" /></Button>
        <div><h1 className="text-3xl font-heading font-bold">Detail Retur Barang (GRN)</h1><p className="text-muted-foreground mt-1">{grn.nomor}</p></div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Nomor</p>
              <p className="font-medium">{grn.nomor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={s[grn.status]?.v ?? "outline"}>{s[grn.status]?.label ?? grn.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(grn.tanggal).toLocaleDateString("id-ID")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{grn.customer?.nama ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gudang</p>
              <p className="font-medium">{grn.gudang?.nama ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">DO Reference</p>
              {grn.delivery_order ? (
                <Link href={`/dashboard/delivery-order/${grn.delivery_order_id}`} className="font-medium text-primary hover:underline">
                  {grn.delivery_order.nomor}
                </Link>
              ) : (
                <p className="text-muted-foreground">-</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retur Penjualan</p>
              {grn.retur_penjualan ? (
                <Link href={`/dashboard/retur-penjualan/${grn.retur_penjualan_id}`} className="font-medium text-primary hover:underline">
                  {grn.retur_penjualan.nomor}
                </Link>
              ) : (
                <p className="text-muted-foreground">-</p>
              )}
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Keterangan</p>
              <p className="font-medium">{grn.keterangan ?? "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {grn.items && grn.items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><ClipboardList className="h-4 w-4" />Item Barang</h3>
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
                {grn.items.map((item) => (
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
