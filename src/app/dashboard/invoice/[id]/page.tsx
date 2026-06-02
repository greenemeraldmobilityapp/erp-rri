"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiFetch } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { ArrowLeft, FileText, Pencil, FileSpreadsheet, Wallet, Receipt, Loader2 } from "lucide-react"
import { InvoicePdfActions } from "@/components/invoice-pdf-actions"
import { TandaTerimaPdfActions } from "@/components/tanda-terima-pdf-actions"
import { FileUpload, type DocumentFile } from "@/components/file-upload"
import { toast } from "sonner"

const payStatus: Record<string, { label: string; v: "secondary" | "warning" | "success" | "destructive" | "outline" }> = {
  draft: { label: "Draft", v: "secondary" },
  sent: { label: "Belum Dibayar", v: "warning" },
  partial: { label: "Dibayar Sebagian", v: "warning" },
  paid: { label: "Lunas", v: "success" },
  overdue: { label: "Overdue", v: "destructive" },
}

const paySteps = ["draft", "sent", "partial", "paid"]
const stepLabels = ["Draft", "Dikirim", "Partial", "Lunas"]

interface Invoice {
  id: string
  nomor: string
  sales_order_id: string
  customer_id: string
  tanggal: string
  status: string
  top: number
  ppn_rate: number
  pph_rate: number | null
  sales_order: {
    nomor: string
    di: { nomor: string; nomor_di_customer: string | null; kontrak_id: string | null } | null
  } | null
  customer: { nama: string; kode: string } | null
  kontrak_nomor: string | null
  do_nomor: string | null
  pic_nama: string | null
  pic_jabatan: string | null
  grn_customer_nomor: string | null
}

interface InvoiceItem {
  id: string
  invoice_id: string
  barang_id: string
  harga: number
  jumlah: number
  diskon: number
  pph: number | null
  nama_barang: string | null
  kode_barang: string | null
  satuan: string | null
  barang: { nama: string; kode: string; satuan: string } | null
  created_at: string
}

export default function InvoiceDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [inv, setInv] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [kwitansiList, setKwitansiList] = useState<Array<{ id: string; nomor: string; invoice_id: string; status: string }>>([])
  const [payments, setPayments] = useState<Array<{ id: string; amount: number; metode: string; tanggal: string; keterangan: string | null }>>([])
  const [grnCustomerNomor, setGrnCustomerNomor] = useState("")
  const [savingGrn, setSavingGrn] = useState(false)
  const [payAmount, setPayAmount] = useState("")
  const [payMetode, setPayMetode] = useState("transfer")
  const [payTanggal, setPayTanggal] = useState("")
  const [showFpDialog, setShowFpDialog] = useState(false)
  const [nomorFaktur, setNomorFaktur] = useState("")
  const [fpCreating, setFpCreating] = useState(false)
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      apiFetch<Invoice & { items: InvoiceItem[] }>(`/api/v1/invoice/${id}`),
      apiFetch<DocumentFile[]>(`/api/v1/invoice/${id}/documents`),
      apiFetch<Array<{ id: string; nomor: string; invoice_id: string; status: string }>>(`/api/v1/kwitansi`),
      apiFetch<Array<{ id: string; amount: number; metode: string; tanggal: string; keterangan: string | null }>>(`/api/v1/invoice/${id}/payment`),
    ]).then(([invRes, docRes, kwtRes, payRes]) => {
      const invData = invRes.data
      setInv(invData)
      setItems(invData?.items ?? [])
      setDocuments(docRes.data ?? [])
      setKwitansiList((kwtRes.data ?? []).filter((k: { invoice_id: string }) => k.invoice_id === id))
      setPayments(payRes.data ?? [])
      setGrnCustomerNomor(invData?.grn_customer_nomor ?? "")
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
      const r = await apiFetchFormData(`/api/v1/invoice/${id}/documents`, formData)
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
      await apiFetch(`/api/v1/invoice/${id}/documents?docId=${docId}`, { method: "DELETE" })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast.success("File berhasil dihapus")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal hapus file")
    }
  }

  const handleRecordPayment = async () => {
    if (!id) return
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) { toast.error("Jumlah pembayaran harus lebih dari 0"); return }
    if (!payMetode) { toast.error("Metode pembayaran harus diisi"); return }
    setRecording(true)
    try {
      const r = await apiFetch<{ id: string }>(`/api/v1/invoice/${id}/payment`, {
        method: "POST",
        body: JSON.stringify({
          amount,
          metode: payMetode,
          tanggal: payTanggal || undefined,
        }),
      })
      setPayments((prev) => [r.data as { id: string; amount: number; metode: string; tanggal: string; keterangan: string | null }, ...prev])
      setPayAmount("")
      setPayTanggal("")
      toast.success("Pembayaran berhasil dicatat")
      // Re-fetch invoice to update status
      const invRes = await apiFetch<Invoice>(`/api/v1/invoice/${id}`)
      if (invRes.data) setInv(invRes.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mencatat pembayaran")
    } finally {
      setRecording(false)
    }
  }

  const handleSaveGrnNomor = async () => {
    if (!id) return
    setSavingGrn(true)
    try {
      await apiFetch(`/api/v1/invoice/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ grn_customer_nomor: grnCustomerNomor || null }),
      })
      toast.success('Nomor GRN Customer disimpan')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal simpan')
    } finally {
      setSavingGrn(false)
    }
  }

  const handleBuatFakturPajak = async () => {
    if (!nomorFaktur.trim()) { toast.error('Nomor Faktur Pajak wajib diisi'); return }
    setFpCreating(true)
    try {
      const res = await apiFetch<{ id: string }>(`/api/v1/invoice/${id}/auto-faktur-pajak`, {
        method: 'POST',
        body: JSON.stringify({ nomor_faktur: nomorFaktur.trim() }),
      })
      toast.success('Faktur Pajak berhasil dibuat')
      setShowFpDialog(false)
      setNomorFaktur('')
      router.push(`/dashboard/faktur-pajak/${res.data.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat Faktur Pajak')
    } finally {
      setFpCreating(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-muted-foreground">Memuat...</div>
  if (error || !inv) return <div className="text-center py-20 text-muted-foreground">Invoice tidak ditemukan</div>

  const currentIdx = paySteps.indexOf(inv.status)
  const isOverdue = inv.status === "overdue"

  const totalDpp = items.reduce((s, i) => s + (i.harga * i.jumlah - (i.diskon ?? 0)), 0)
  const totalPPh = items.reduce((s, i) => s + (i.pph ?? 0), 0)
  const grandTotal = totalDpp - totalPPh

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/invoice")}><ArrowLeft className="h-5 w-5" /></Button>
          <div><h1 className="text-3xl font-heading font-bold">Detail Invoice</h1><p className="text-muted-foreground mt-1">{inv.nomor}</p></div>
        </div>
        <div className="flex gap-2 items-center">
          <InvoicePdfActions invId={id!} nomor={inv.nomor} />
          <TandaTerimaPdfActions invId={id!} nomor={inv.nomor} />
          <Button className="bg-primary text-primary-foreground hover:opacity-95" asChild>
            <a href={`/dashboard/invoice/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />Edit
            </a>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Status Pembayaran</h3>
            {isOverdue ? (
              <Badge variant="destructive" className="text-sm px-4 py-1">Overdue</Badge>
            ) : (
              <Badge variant={payStatus[inv.status]?.v ?? "outline"} className="text-sm px-4 py-1">
                {payStatus[inv.status]?.label ?? inv.status}
              </Badge>
            )}
          </div>
          {!isOverdue ? (
            <div className="relative flex items-center gap-0">
              {stepLabels.map((label, i) => {
                const done = i <= currentIdx
                const current = i === currentIdx
                return (
                  <div key={label} className="relative flex-1 flex flex-col items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 ${
                      done ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground/50"
                    } ${current ? "ring-3 ring-primary/30" : ""}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <p className={`text-xs mt-1.5 ${done ? "font-medium text-foreground" : "text-muted-foreground/50"}`}>{label}</p>
                    {i < stepLabels.length - 1 && (
                      <div className={`absolute mt-4 h-0.5 w-full left-1/2 top-0 ${done && i < currentIdx ? "bg-primary" : "bg-muted"}`}
                        style={{ width: "calc(100% - 2rem)", marginLeft: "1rem" }} />
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-destructive">Invoice ini telah melewati jatuh tempo.</p>
          )}
        </CardContent>
      </Card>

      {inv && (() => {
        const invDate = (() => { try { return new Date(inv.tanggal) } catch { return null } })()
        const topDays = (() => { const m = String(inv.top ?? '').match(/\d+/); return m ? Number(m[0]) : NaN })()
        const jatuhTempoDate = (() => {
          if (!invDate || isNaN(invDate.getTime()) || isNaN(topDays)) return null
          const d = new Date(invDate)
          d.setDate(d.getDate() + topDays)
          return isNaN(d.getTime()) ? null : d
        })()
        const isValidDate = jatuhTempoDate !== null && !isNaN(jatuhTempoDate.getTime())
        const isOverdue = isValidDate ? new Date() > jatuhTempoDate : false
        return (
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Informasi Invoice</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{inv.customer?.nama ?? "-"}</p>
                <p className="text-xs text-muted-foreground">{inv.customer?.kode ?? ""}</p>
              </div>
              {inv.pic_nama ? (
              <div>
                <p className="text-sm text-muted-foreground">PIC Customer</p>
                <p className="font-medium">{inv.pic_nama}</p>
                {inv.pic_jabatan && <p className="text-xs text-muted-foreground">{inv.pic_jabatan}</p>}
              </div>
              ) : <div />}
              <div>
                <p className="text-sm text-muted-foreground">Kontrak Ref</p>
                <p className="font-medium">{inv.kontrak_nomor ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">DI Cust. Ref</p>
                <p className="font-medium">{inv.sales_order?.di?.nomor_di_customer ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">DI Ref</p>
                <p className="font-medium">{inv.sales_order?.di?.nomor ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sales Order</p>
                <p className="font-medium">{inv.sales_order?.nomor ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">DO Ref</p>
                <p className="font-medium">{inv.do_nomor ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tanggal</p>
                <p className="font-medium">{invDate ? invDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">TOP</p>
                <p className="font-medium">{isNaN(topDays) ? inv.top : `${topDays} Hari`}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jatuh Tempo Pembayaran Invoice</p>
                {isValidDate ? (
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${isOverdue ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"}`}>
                    {jatuhTempoDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                ) : (
                  <span className="mt-1 text-xs text-muted-foreground">-</span>
                )}
              </div>
            </div>
        </CardContent>
      </Card>
        )
      })()}

      {kwitansiList.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Kwitansi</h3>
            {kwitansiList.map((kwt) => (
              <div key={kwt.id} className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <a href={`/dashboard/kwitansi/${kwt.id}`} className="text-primary hover:underline font-medium">
                  {kwt.nomor}
                </a>
                <Badge variant="outline" className="text-xs">{kwt.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />GRN Customer
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Input nomor GRN dari customer dan upload dokumen GRN.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Nomor GRN Customer</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Input nomor GRN dari customer"
                  value={grnCustomerNomor}
                  onChange={(e) => setGrnCustomerNomor(e.target.value)}
                />
                <Button onClick={handleSaveGrnNomor} disabled={savingGrn} size="sm">
                  {savingGrn ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Dokumen GRN</p>
              <FileUpload
                documents={documents.filter(d => d.file_name?.includes('GRN') || documents.length === 0)}
                onUpload={handleUpload}
                onDelete={handleDeleteDocument}
                uploading={uploading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 mb-4">
        <Button className="bg-[#22C55E] text-white hover:bg-[#16A34A] dark:bg-[#15803D] dark:hover:bg-[#166534]" onClick={() => setShowFpDialog(true)}>
          <Receipt className="h-4 w-4 mr-2" />Buat Faktur Pajak
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Wallet className="h-4 w-4" />Pembayaran</h3>
          {payments.length > 0 ? (
            <div className="mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.tanggal).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell className="capitalize">{p.metode}</TableCell>
                      <TableCell className="text-right font-medium">{p.amount.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-muted-foreground">{p.keterangan ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end items-center gap-8 border-t mt-2 pt-2">
                <span className="text-muted-foreground">Total Dibayar</span>
                <span className="font-bold text-lg w-32 text-right text-green-600">
                  {payments.reduce((s, p) => s + p.amount, 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">Belum ada pembayaran</p>
          )}

          {inv.status !== "paid" && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Catat Pembayaran Baru</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Jumlah</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Metode</label>
                  <Select value={payMetode} onValueChange={setPayMetode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transfer Bank</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="giro">Giro</SelectItem>
                      <SelectItem value="cek">Cek</SelectItem>
                      <SelectItem value="lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Tanggal</label>
                  <DatePicker value={payTanggal} onChange={setPayTanggal} />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleRecordPayment} disabled={recording} className="w-full bg-[#22C55E] text-white hover:bg-[#16A34A] dark:bg-[#15803D] dark:hover:bg-[#166534]">
                    {recording ? "Menyimpan..." : "Catat Pembayaran"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!!items.length && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" />Item Barang</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Diskon</TableHead>
                  <TableHead className="text-right">DPP</TableHead>
                  {totalPPh > 0 && <TableHead className="text-right">PPh</TableHead>}
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {items.map((item, i) => {
                  const brg = item.barang as { nama: string; kode: string; satuan: string } | null
                  const diskon = item.diskon ?? 0
                  const pph = item.pph ?? 0
                  const dpp = item.harga * item.jumlah - diskon
                  const subtotal = dpp - pph
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{item.nama_barang ?? brg?.nama ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">{item.kode_barang ?? brg?.kode} — {item.satuan ?? brg?.satuan}</div>
                      </TableCell>
                      <TableCell className="text-right">{item.harga.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right">{item.jumlah}</TableCell>
                      <TableCell className="text-right">{diskon > 0 ? diskon.toLocaleString("id-ID") : "-"}</TableCell>
                      <TableCell className="text-right">{dpp.toLocaleString("id-ID")}</TableCell>
                      {totalPPh > 0 && <TableCell className="text-right">{pph > 0 ? pph.toLocaleString("id-ID") : "-"}</TableCell>}
                      <TableCell className="text-right font-medium">{subtotal.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <div className="border-t mt-4 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-end items-center gap-8">
                <span className="text-muted-foreground">DPP</span>
                <span className="font-medium w-32 text-right">{totalDpp.toLocaleString("id-ID")}</span>
              </div>
              {totalPPh > 0 && (
                <div className="flex justify-end items-center gap-8">
                  <span className="text-muted-foreground">PPh {inv.pph_rate ? `(${(inv.pph_rate * 100).toFixed(0)}%)` : ""}</span>
                  <span className="font-medium w-32 text-right">-{totalPPh.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-end items-center gap-8 border-t pt-2 mt-2">
                <span className="font-bold">Grand Total</span>
                <span className="font-bold text-lg w-32 text-right">{grandTotal.toLocaleString("id-ID")}</span>
              </div>
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

      {showFpDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowFpDialog(false)}>
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Buat Faktur Pajak</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Faktur Pajak akan dibuat dengan data dari Invoice ini. DPP, PPN, dan PPh akan diisi otomatis.
            </p>
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium">Nomor Faktur Pajak</label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="010.000-24.00000000"
                value={nomorFaktur}
                onChange={e => setNomorFaktur(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFpDialog(false)}>Batal</Button>
              <Button onClick={handleBuatFakturPajak} disabled={fpCreating}>
                {fpCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Buat Faktur Pajak
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
