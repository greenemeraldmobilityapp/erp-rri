"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiFetch } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, Download, Pencil, Trash2, FileText } from "lucide-react"
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
  barang_id: string
  harga_satuan: number
  diskon: number
  ppn_per_item: number
  jumlah: number
  keterangan: string | null
  barang: { id: string; nama: string; kode: string; satuan: string }
}

interface Quotation {
  id: string
  nomor: string
  customer_id: string
  tanggal: string
  status: string
  ppn_rate: number
  keterangan: string | null
  is_active: boolean
  created_at: string
  customer: { id: string; nama: string; kode: string }
  items: QuotationItem[]
}

export default function QuotationDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [data, setData] = useState<Quotation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8"><div className="min-h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><p className="ml-3 text-muted-foreground">Memuat data...</p></div></div>
  if (error || !data) return <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8"><EmptyState title="Gagal memuat data" description={error || "Data tidak ditemukan"} /></div>

  const subtotal = data.items.reduce((s, i) => s + i.jumlah * i.harga_satuan, 0)
  const totalDiskon = data.items.reduce((s, i) => s + (i.jumlah * i.harga_satuan * (i.diskon || 0)) / 100, 0)
  const totalPpn = data.items.reduce((s, i) => s + i.ppn_per_item, 0)
  const grandTotal = subtotal - totalDiskon + totalPpn

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6 print:space-y-4">
      <PageHeader
        title="Detail Quotation"
        description={`${data.nomor} - ${data.customer?.nama || ""}`}
        actions={
          <div className="flex gap-2">
            <Button className="bg-zinc-500/70 text-white hover:bg-zinc-500/90" onClick={() => router.push("/dashboard/quotation")}>Kembali</Button>
            <Button variant="outline" asChild>
              <a href={`/api/v1/quotation/${id}/pdf`} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-2" />Preview PDF
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`/api/v1/quotation/${id}/pdf`} download>
                <Download className="h-4 w-4 mr-2" />Download PDF
              </a>
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
              <p className="text-sm text-muted-foreground">PPN Rate</p>
              <p className="font-medium">{(data.ppn_rate * 100).toFixed(0)}%</p>
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
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right">Diskon</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => {
                  const subtotalItem = item.jumlah * item.harga_satuan
                  const diskonItem = subtotalItem * (item.diskon || 0) / 100
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.barang?.kode || "-"}</TableCell>
                      <TableCell className="font-medium">{item.barang?.nama || "-"}</TableCell>
                      <TableCell className="text-right">{item.jumlah} {item.barang?.satuan || ""}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.harga_satuan)}</TableCell>
                      <TableCell className="text-right">{item.diskon ? `${item.diskon}%` : "-"}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(subtotalItem - diskonItem)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <div className="border-t pt-4 mt-4 space-y-1">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {totalDiskon > 0 && <div className="flex justify-between text-sm text-muted-foreground"><span>Diskon</span><span>-{formatCurrency(totalDiskon)}</span></div>}
            <div className="flex justify-between text-sm"><span>PPN ({(data.ppn_rate * 100).toFixed(0)}%)</span><span>{formatCurrency(totalPpn)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Grand Total</span><span>{formatCurrency(grandTotal)}</span></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Aktivitas</h3>
          <ActivityTimeline tableName="quotation" recordId={id!} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" asChild>
          <a href={`/api/v1/quotation/${id}/pdf`} target="_blank" rel="noopener noreferrer">
            <FileText className="h-4 w-4 mr-2" />Cetak PDF
          </a>
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
