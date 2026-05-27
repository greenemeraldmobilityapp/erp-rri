"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiFetch, getAuthToken } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, Download, Pencil, Trash2, FileText } from "lucide-react"
import { toast } from "sonner"
import { CopyButton } from "@/components/copy-button"
import { StatusWorkflow } from "@/components/status-workflow"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { ActivityTimeline } from "@/components/activity-timeline"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"

const statusLabel: Record<string, { label: string; variant: "secondary" | "warning" | "success" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Terkirim", variant: "warning" },
  approved: { label: "Disetujui", variant: "success" },
  rejected: { label: "Ditolak", variant: "destructive" },
  closed: { label: "Ditutup", variant: "outline" },
}

const workflowSteps = [
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Terkirim" },
  { key: "approved", label: "Disetujui" },
]

interface QuotationItem {
  id: string
  barang_id: string | null
  specification: string | null
  justification: string | null
  image_url: string | null
  satuan: string | null
  harga_satuan: number
  diskon: number
  ppn_per_item: number
  jumlah: number
  total_harga: number | null
  keterangan: string | null
  nama_barang: string | null
  barang: { id: string; nama: string; kode: string; satuan: string; spesifikasi?: string; justification?: string; image_url?: string } | null
}

interface Quotation {
  id: string
  nomor: string
  customer_id: string
  rfq_id: string | null
  referensi: string | null
  lampiran: string | null
  perihal: string | null
  pic_customer_id: string | null
  alamat: string | null
  tanggal: string
  status: string
  masa_berlaku: string | null
  tanggal_berlaku_sampai: string | null
  ppn_rate: number
  ppn_enabled: boolean
  total_harga: number | null
  keterangan: string | null
  is_active: boolean
  created_at: string
  customer: { id: string; nama: string; kode: string }
  rfq_customer: { nomor: string } | null
  items: QuotationItem[]
}

export default function QuotationDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [data, setData] = useState<Quotation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    apiFetch<Quotation>(`/api/v1/quotation/${id}`)
      .then((res) => { setData(res.data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [id])

  const handleDelete = async () => {
    if (!id) return
    await apiFetch(`/api/v1/quotation/${id}`, { method: "DELETE" })
    router.push("/dashboard/quotation")
  }

  const formatCurrency = (v: number | null | undefined) => {
    if (v == null) return "-"
    return `Rp ${Number(v).toLocaleString("id-ID")}`
  }

  const handlePreviewPDF = async () => {
    if (!id) return
    setPreviewLoading(true)
    try {
      const token = await getAuthToken()
      const res = await fetch(`/api/v1/quotation/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Gagal memuat PDF')
      const blob = await res.blob()
      window.open(URL.createObjectURL(blob), '_blank')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat PDF')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!id) return
    setDownloadLoading(true)
    try {
      const token = await getAuthToken()
      const res = await fetch(`/api/v1/quotation/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Gagal download PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SPH-${data?.nomor ?? id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal download PDF')
    } finally {
      setDownloadLoading(false)
    }
  }

  if (loading) return <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8"><div className="min-h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><p className="ml-3 text-muted-foreground">Memuat data...</p></div></div>
  if (error || !data) return <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8"><EmptyState title="Gagal memuat data" description={error || "Data tidak ditemukan"} /></div>

  const subtotal = data.items.reduce((s, i) => s + i.jumlah * i.harga_satuan, 0)
  const totalDiskon = data.items.reduce((s, i) => s + (i.jumlah * i.harga_satuan * (i.diskon || 0)) / 100, 0)
  const totalPpn = data.ppn_enabled ? data.items.reduce((s, i) => s + i.ppn_per_item, 0) : 0
  const grandTotal = subtotal - totalDiskon + totalPpn

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6 print:space-y-4">
      <PageHeader
        title="Detail Quotation"
        description={`${data.nomor} - ${data.customer?.nama || ""}`}
        actions={
          <div className="flex gap-2">
            <Button variant="back" onClick={() => router.push("/dashboard/quotation")}>Kembali</Button>
            <Button variant="outline" onClick={handlePreviewPDF} disabled={previewLoading}>
              {previewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Preview PDF
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF} disabled={downloadLoading}>
              {downloadLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Download PDF
            </Button>
            <Button variant="outline" onClick={() => router.push(`/dashboard/quotation/${id}/edit`)}><Pencil className="h-4 w-4 mr-2" />Edit</Button>
            <DeleteConfirmationDialog
              onConfirm={handleDelete}
              itemName={`Quotation ${data.nomor}`}
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
          <h3 className="text-lg font-semibold mb-4">Informasi Surat</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">No. Referensi</p>
              <p className="font-medium">{data.referensi || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lampiran</p>
              <p className="font-medium">{data.lampiran || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Perihal</p>
              <p className="font-medium">{data.perihal || "Penawaran Harga"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(data.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
            {data.tanggal_berlaku_sampai && (
              <div>
                <p className="text-sm text-muted-foreground">Masa Berlaku</p>
                <p className="font-medium">{data.masa_berlaku} (sampai {new Date(data.tanggal_berlaku_sampai).toLocaleDateString("id-ID")})</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">PPN</p>
              <p className="font-medium">{data.ppn_enabled ? `${(data.ppn_rate * 100).toFixed(0)}%` : "Non-PPN"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Kepada Yth.</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{data.customer?.nama || "-"}</p>
              <p className="text-xs text-muted-foreground">{data.customer?.kode || ""}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alamat</p>
              <p className="font-medium whitespace-pre-wrap">{data.alamat || "-"}</p>
            </div>
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
                  <TableHead>#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Specification</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead>UoM</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item, i) => {
                  const totalPrice = item.jumlah * item.harga_satuan
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{item.barang?.nama || item.nama_barang || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{item.specification || item.barang?.spesifikasi || "-"}</TableCell>
                      <TableCell className="text-center">{item.jumlah}</TableCell>
                      <TableCell>{item.satuan || item.barang?.satuan || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.harga_satuan)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(totalPrice)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <div className="border-t pt-4 mt-4 space-y-1">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {totalDiskon > 0 && <div className="flex justify-between text-sm text-muted-foreground"><span>Diskon</span><span>-{formatCurrency(totalDiskon)}</span></div>}
            {data.ppn_enabled && <div className="flex justify-between text-sm"><span>PPN ({(data.ppn_rate * 100).toFixed(0)}%)</span><span>{formatCurrency(totalPpn)}</span></div>}
            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Grand Total</span><span>{formatCurrency(grandTotal)}</span></div>
          </div>
        </CardContent>
      </Card>

      {data.keterangan && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Keterangan</h3>
            <p className="font-medium whitespace-pre-wrap">{data.keterangan}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Aktivitas</h3>
          <ActivityTimeline tableName="quotation" recordId={id!} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={handlePreviewPDF} disabled={previewLoading}>
          {previewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
          Cetak PDF
        </Button>
        <Button asChild>
          <a href={`/dashboard/quotation/${id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />Edit Quotation
          </a>
        </Button>
      </div>

      <div className="hidden print:block text-xs text-muted-foreground text-center pt-4 border-t mt-8">
        Dicetak pada {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
