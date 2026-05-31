"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiFetch } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Pencil, Trash2, CheckCircle2, AlertCircle } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { StatusWorkflow } from "@/components/status-workflow"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { ActivityTimeline } from "@/components/activity-timeline"
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

const workflowSteps = [
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Terkirim" },
  { key: "responded", label: "Direspon" },
  { key: "closed", label: "Ditutup" },
]

interface RFQItem {
  id: string
  barang_id: string
  jumlah: number
  satuan: string
  harga_target: number
  harga_penawaran: number | null
  keterangan: string | null
  barang: { id: string; nama: string; kode: string; satuan: string; harga_beli_default: number | null }
}

interface RFQ {
  id: string
  nomor: string
  supplier_id: string
  tanggal: string
  status: string
  keterangan: string | null
  is_active: boolean
  created_at: string
  supplier: { id: string; nama: string; kode: string }
  sales_order: { id: string; nomor: string } | null
  items: RFQItem[]
}

export default function RfqDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [data, setData] = useState<RFQ | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!id) return
    apiFetch<RFQ>(`/api/v1/rfq-supplier/${id}`)
      .then((res) => { setData(res.data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!id) return
    apiFetch<DocumentFile[]>(`/api/v1/rfq-supplier/${id}/documents`)
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
      const r = await apiFetchFormData(`/api/v1/rfq-supplier/${id}/documents`, formData)
      setDocuments((prev) => [r.data as { id: string; file_name: string; file_url: string; uploaded_at: string; rfq_supplier_id: string }, ...prev].filter(Boolean))
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
      await apiFetch(`/api/v1/rfq-supplier/${id}/documents?docId=${docId}`, { method: "DELETE" })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast.success("File berhasil dihapus")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal hapus file")
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await apiFetch(`/api/v1/rfq-supplier/${id}`, { method: "DELETE" })
    router.push("/dashboard/rfq")
  }

  const handleApplyPrices = async () => {
    if (!id) return
    setApplying(true)
    try {
      await apiFetch(`/api/v1/rfq-supplier/${id}`, { method: 'POST', body: JSON.stringify({ action: 'apply_prices' }) })
      toast.success('Harga penawaran berhasil diterapkan ke master barang!')
      const res = await apiFetch<RFQ>(`/api/v1/rfq-supplier/${id}`)
      setData(res.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menerapkan harga')
    } finally {
      setApplying(false)
    }
  }

  const formatCurrency = (v: number | null | undefined) => {
    if (v == null) return "-"
    return `Rp ${Number(v).toLocaleString("id-ID")}`
  }

  const hasPenawaran = data?.items.some(i => i.harga_penawaran != null)
  const hasPriceGap = data?.items.some(i => i.harga_penawaran != null && i.barang?.harga_beli_default != null && i.harga_penawaran !== i.barang.harga_beli_default)

  if (loading) return <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8"><div className="min-h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><p className="ml-3 text-muted-foreground">Memuat data...</p></div></div>
  if (error || !data) return <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8"><EmptyState title="Gagal memuat data" description={error || "Data tidak ditemukan"} /></div>

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <PageHeader
        title="Detail RFQ"
        description={`${data.nomor} - ${data.supplier?.nama || ""}`}
        actions={
          <div className="flex gap-2">
            <Button variant="back" onClick={() => router.push("/dashboard/rfq")}>Kembali</Button>
            <Button variant="outline" onClick={() => router.push(`/dashboard/rfq/${id}/edit`)}><Pencil className="h-4 w-4 mr-2" />Edit</Button>
            <DeleteConfirmationDialog
              onConfirm={handleDelete}
              itemName={`RFQ ${data.nomor}`}
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
              <CopyButton text={data.nomor} />
            </div>
            <Badge variant={statusLabel[data.status]?.variant ?? "outline"}>
              {statusLabel[data.status]?.label ?? data.status}
            </Badge>
          </div>
          <StatusWorkflow steps={workflowSteps} current={data.status} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Supplier</p>
              <p className="font-medium">{data.supplier?.nama || "-"}</p>
              <p className="text-xs text-muted-foreground">{data.supplier?.kode || ""}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(data.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dibuat Pada</p>
              <p className="font-medium">{new Date(data.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
            {data.sales_order && (
              <div>
                <p className="text-sm text-muted-foreground">Referensi SO</p>
                <p className="font-medium">{data.sales_order.nomor}</p>
              </div>
            )}
            {data.keterangan && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Keterangan</p>
                <p className="font-medium whitespace-pre-wrap">{data.keterangan}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {hasPriceGap && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Harga penawaran berbeda dengan harga beli default</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Beberapa item memiliki harga penawaran supplier yang belum diterapkan ke master data barang.
            </p>
          </div>
          <Button size="sm" onClick={handleApplyPrices} disabled={applying}>
            {applying ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
            Terapkan Semua
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Item Barang</h3>
            {hasPenawaran && (
              <Button variant="default" size="sm" onClick={handleApplyPrices} disabled={applying}>
                {applying ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Terapkan Harga ke Master Barang
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead className="text-right">Harga Target</TableHead>
                  <TableHead className="text-right">Harga Penawaran</TableHead>
                  <TableHead className="text-right">Harga Beli Default</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => {
                  const gap = item.harga_penawaran != null && item.barang?.harga_beli_default != null
                    ? item.harga_penawaran - item.barang.harga_beli_default
                    : null
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.barang?.kode || "-"}</TableCell>
                      <TableCell className="font-medium">{item.barang?.nama || "-"}</TableCell>
                      <TableCell className="text-right">{item.jumlah}</TableCell>
                      <TableCell>{item.satuan || item.barang?.satuan || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.harga_target)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.harga_penawaran != null ? (
                          <span className={gap != null && gap < 0 ? 'text-green-600' : gap != null && gap > 0 ? 'text-amber-600' : ''}>
                            {formatCurrency(item.harga_penawaran)}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(item.barang?.harga_beli_default)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.keterangan || "-"}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <div className="border-t pt-4 mt-4 flex items-center justify-between">
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
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Aktivitas</h3>
          <ActivityTimeline tableName="rfq_supplier" recordId={id!} />
        </CardContent>
      </Card>
    </div>
  )
}
