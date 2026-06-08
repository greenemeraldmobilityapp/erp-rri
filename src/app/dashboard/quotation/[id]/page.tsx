"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiFetch, getAuthToken } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, Download, Pencil, Trash2, FileText, Send, CheckCircle, XCircle, MessageSquare, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { CopyButton } from "@/components/copy-button"
import { StatusWorkflow } from "@/components/status-workflow"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { ActivityTimeline } from "@/components/activity-timeline"
import { formatDateTime } from "@/lib/utils/date"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { CompactFileUpload, type DocumentFile } from "@/components/compact-file-upload"

const statusLabel: Record<string, { label: string; variant: "secondary" | "warning" | "success" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Terkirim", variant: "warning" },
  proses_negosiasi: { label: "Proses Negosiasi", variant: "warning" },
  approved: { label: "Disetujui", variant: "success" },
  rejected: { label: "Ditolak", variant: "destructive" },
  closed: { label: "Ditutup", variant: "outline" },
}

const workflowSteps = [
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Terkirim" },
  { key: "proses_negosiasi", label: "Negosiasi" },
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
  pic_customer: { id: string; nama: string; jabatan: string; no_hp: string } | null
  alamat: string | null
  tanggal: string
  status: string
  revisi: number
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
  const [statusLoading, setStatusLoading] = useState(false)
  const [negoList, setNegoList] = useState<Array<{ id: string; nomor: string; status: string; tanggal: string; revision: number }>>([])
  const [negoLoading, setNegoLoading] = useState(true)
  const [poList, setPoList] = useState<Array<{ id: string; nomor: string; status: string; tanggal: string }>>([])
  const [poLoading, setPoLoading] = useState(true)
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!id) return
    apiFetch<Quotation>(`/api/v1/quotation/${id}`)
      .then((res) => { setData(res.data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })

    apiFetch<Array<{ id: string; nomor: string; status: string; tanggal: string; quotation_id: string; revision: number }>>('/api/v1/negoiasi')
      .then((res) => {
        const filtered = (res.data ?? []).filter((n) => n.quotation_id === id)
        setNegoList(filtered)
        setNegoLoading(false)
      })
      .catch(() => setNegoLoading(false))

    apiFetch<Array<{ id: string; nomor: string; status: string; tanggal: string; quotation_id: string }>>('/api/v1/customer-po')
      .then((res) => {
        const filtered = (res.data ?? []).filter((p: { quotation_id: string }) => p.quotation_id === id)
        setPoList(filtered)
        setPoLoading(false)
      })
      .catch(() => setPoLoading(false))

    apiFetch<DocumentFile[]>(`/api/v1/quotation/${id}/documents`)
      .then((res) => setDocuments(res.data ?? []))
      .catch(() => {})
  }, [id])

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return
    setStatusLoading(true)
    try {
      await apiFetch(`/api/v1/quotation/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success('Status berhasil diubah!')
      const res = await apiFetch<Quotation>(`/api/v1/quotation/${id}`)
      setData(res.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah status')
    } finally {
      setStatusLoading(false)
    }
  }

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
      a.download = `${data?.nomor ?? id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal download PDF')
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleUpload = async (file: File) => {
    if (!id) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const { apiFetchFormData } = await import("@/lib/api/client")
      const r = await apiFetchFormData(`/api/v1/quotation/${id}/documents`, formData)
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
      await apiFetch(`/api/v1/quotation/${id}/documents?docId=${docId}`, { method: "DELETE" })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast.success("File berhasil dihapus")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal hapus file")
    }
  }

  if (loading) return <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8"><div className="min-h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><p className="ml-3 text-muted-foreground">Memuat data...</p></div></div>
  if (error || !data) return <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8"><EmptyState title="Gagal memuat data" description={error || "Data tidak ditemukan"} /></div>

  const displayNomor = `${data.nomor}${data.revisi > 0 ? `-R${data.revisi}` : ''}`
  const subtotal = data.items.reduce((s, i) => s + i.jumlah * i.harga_satuan, 0)
  const totalDiskon = data.items.reduce((s, i) => s + (i.jumlah * i.harga_satuan * (i.diskon || 0)) / 100, 0)
  const totalPpn = data.ppn_enabled ? data.items.reduce((s, i) => s + i.ppn_per_item, 0) : 0
  const grandTotal = subtotal - totalDiskon + totalPpn

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6 print:space-y-4">
      <PageHeader
        title="Detail Quotation"
        description={`${displayNomor} - ${data.customer?.nama || ""}`}
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
            {data.status === 'draft' && (
              <>
                <Button variant="default" onClick={() => handleStatusChange('sent')} disabled={statusLoading}>
                  {statusLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Tandai Terkirim
                </Button>
                <Button variant="outline" onClick={() => router.push(`/dashboard/quotation/${id}/edit`)}><Pencil className="h-4 w-4 mr-2" />Edit</Button>
              </>
            )}
            {(data.status === 'sent' || data.status === 'proses_negosiasi') && (
              <>
                <Button variant="default" onClick={() => handleStatusChange('approved')} disabled={statusLoading}>
                  {statusLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Setujui
                </Button>
                <Button variant="destructive" onClick={() => handleStatusChange('rejected')} disabled={statusLoading}>
                  {statusLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Tolak
                </Button>
              </>
            )}
            {data.status === 'rejected' && (
              <>
                <Button variant="outline" onClick={() => handleStatusChange('draft')} disabled={statusLoading}>
                  {statusLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Pencil className="h-4 w-4 mr-2" />}
                  Revisi
                </Button>
                <Button variant="outline" onClick={() => router.push(`/dashboard/quotation/${id}/edit`)}><Pencil className="h-4 w-4 mr-2" />Edit</Button>
              </>
            )}
            {data.status === 'approved' && (
              <>
                <Button variant="default" onClick={() => router.push(`/dashboard/customer-po/tambah?quotation_id=${id}`)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />Buat PO Customer
                </Button>
                <Button variant="outline" onClick={() => handleStatusChange('sent')} disabled={statusLoading}>
                  {statusLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Kirim Ulang
                </Button>
                <Button variant="outline" onClick={() => handleStatusChange('closed')} disabled={statusLoading}>
                  {statusLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Tutup
                </Button>
              </>
            )}
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
              <h2 className="text-xl font-bold font-mono">{displayNomor}</h2>
              <CopyButton text={displayNomor} />
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
            {data.pic_customer && (
              <div>
                <p className="text-sm text-muted-foreground">PIC Customer</p>
                <p className="font-medium">{data.pic_customer.nama}</p>
                {data.pic_customer.jabatan && <p className="text-xs text-muted-foreground">{data.pic_customer.jabatan}</p>}
                {data.pic_customer.no_hp && <p className="text-xs text-muted-foreground">{data.pic_customer.no_hp}</p>}
              </div>
            )}
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
                  <TableHead className="w-20">#</TableHead>
                  <TableHead className="w-20">Picture</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Specification</TableHead>
                  <TableHead>Justification</TableHead>
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
                      <TableCell>
                        {(item.image_url || item.barang?.image_url) ? (
                          <img src={item.image_url || item.barang?.image_url || ''} alt="" className="w-10 h-10 rounded object-cover border" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                            <FileText className="h-4 w-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.barang?.nama || item.nama_barang || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{item.specification || item.barang?.spesifikasi || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{item.justification || item.barang?.justification || "-"}</TableCell>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Negosiasi</h3>
            {(data.status === 'sent' || data.status === 'proses_negosiasi') && (
              <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/negoiasi/tambah?quotation_id=${id}`)}>
                <MessageSquare className="h-4 w-4 mr-2" />Buat Negosiasi
              </Button>
            )}
          </div>
          {negoLoading ? (
            <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : negoList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada negosiasi untuk quotation ini.</p>
          ) : (
            <div className="space-y-2">
              {negoList.map((n) => (
                <div key={n.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/dashboard/negoiasi/${n.id}`)}>
                  <div>
                    <p className="font-medium text-sm">{n.nomor} <span className="text-xs text-muted-foreground">(Rev #{n.revision})</span></p>
                    <p className="text-xs text-muted-foreground">{new Date(n.tanggal).toLocaleDateString('id-ID')}</p>
                  </div>
                  <Badge variant={n.status === 'approved' ? 'success' : n.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {n.status === 'approved' ? 'Disetujui' : n.status === 'rejected' ? 'Ditolak' : 'Draft'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Customer PO</h3>
          </div>
          {poLoading ? (
            <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : poList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada PO Customer untuk quotation ini.</p>
          ) : (
            <div className="space-y-2">
              {poList.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/dashboard/customer-po/${p.id}`)}>
                  <div>
                    <p className="font-medium text-sm">{p.nomor}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.tanggal).toLocaleDateString('id-ID')}</p>
                  </div>
                  <Badge variant={p.status === 'confirmed' ? 'success' : p.status === 'cancelled' ? 'destructive' : 'secondary'}>
                    {p.status === 'confirmed' ? 'Dikonfirmasi' : p.status === 'cancelled' ? 'Batal' : 'Draft'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Aktivitas</h3>
          <ActivityTimeline tableName="quotation" recordId={id!} />
        </CardContent>
      </Card>

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
        Dicetak pada {formatDateTime(new Date(), { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
