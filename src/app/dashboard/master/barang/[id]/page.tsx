"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/db/client"
import { Button } from "@/components/ui/button"
import { ImageLightbox } from "@/components/image-lightbox"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { Loader2, ShoppingBag } from "lucide-react"
import { apiFetch } from "@/lib/api/client"
import { BreadcrumbNav, BreadcrumbItem } from "@/components/breadcrumb-nav"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
const breadcrumbItems: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Master Data" },
  { label: "Barang", href: "/dashboard/master/barang" },
  { label: "Detail Barang" },
]

interface HistoryItem {
  invoice_id: string
  invoice_nomor: string
  invoice_tanggal: string
  invoice_status: string
  customer_nama: string | null
  customer_kode: string | null
  so_nomor: string
  di_nomor: string | null
  di_nomor_customer: string | null
  kontrak_nomor: string | null
  cpo_nomor: string | null
  cpo_nomor_customer: string | null
  harga_satuan: number
  jumlah: number
  diskon: number
  total: number
  path: string | null
}

interface Barang {
  id: string
  nama: string
  kode: string
  barcode: string | null
  kategori_barang: { nama: string }[]
  satuan: string | null
  spesifikasi: string | null
  justification: string | null
  image_url: string | null
  harga_beli_default: number | null
  harga_jual_default: number | null
  stok_minimum: number | null
  is_active: boolean
  created_at: string
  kontrak: { nomor_kontrak: string; nama: string; tanggal_mulai: string | null; tanggal_selesai: string | null }[]
}

export default function DetailBarangPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [data, setData] = useState<Barang | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from("barang")
      .select(`
        id,
        nama,
        kode,
        barcode,
        kategori_barang!inner(nama),
        kontrak!left(nomor_kontrak, nama, tanggal_mulai, tanggal_selesai),
        satuan,
        spesifikasi,
        justification,
        image_url,
        harga_beli_default,
        harga_jual_default,
        stok_minimum,
        is_active,
        created_at
      `)
      .eq("id", id)
      .single()
      .then(({ data: result, error: err }) => {
        if (err) setError(err.message)
        else setData(result as Barang)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!id) return
    apiFetch<HistoryItem[]>(`/api/v1/master/barang/${id}/history`)
      .then((r) => { setHistory(r.data ?? []); setHistoryLoading(false) })
      .catch(() => setHistoryLoading(false))
  }, [id])

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-"
    return `Rp ${Number(value).toLocaleString("id-ID")}`
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
      <div className="min-h-[200px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-3 text-muted-foreground">Memuat data...</p>
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <EmptyState title="Gagal memuat data" description={error || "Data tidak ditemukan"} />
    </div>
  )

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader
        title={data.nama || "Detail Barang"}
        description="Informasi lengkap"
        actions={
          <div className="flex gap-2">
            <Button variant="back" onClick={() => router.push("/dashboard/master/barang")}>
              Kembali
            </Button>
            <Button onClick={() => router.push(`/dashboard/master/barang/${id}/edit`)}>
              Edit
            </Button>
          </div>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Kode</label>
              <p className="text-sm font-medium">{data.kode}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Barcode</label>
              <p className="text-sm font-medium">{data.barcode || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Nama Barang</label>
              <p className="text-sm font-medium">{data.nama}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Kategori</label>
              <p className="text-sm font-medium">{data.kategori_barang?.[0]?.nama || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Satuan</label>
              <p className="text-sm font-medium">{data.satuan || "-"}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">Spesifikasi</label>
              <p className="text-sm font-medium">{data.spesifikasi || "-"}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">Justification</label>
              <p className="text-sm font-medium">{data.justification || "-"}</p>
            </div>
            {data.image_url && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Image</label>
                <ImageLightbox src={data.image_url} alt={data.nama}>
                  <img src={data.image_url} alt={data.nama} className="h-24 w-24 object-contain rounded border" />
                </ImageLightbox>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Harga Beli Default</label>
              <p className="text-sm font-medium">{formatCurrency(data.harga_beli_default)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Harga Jual Default</label>
              <p className="text-sm font-medium">{formatCurrency(data.harga_jual_default)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Stok Minimum</label>
              <p className="text-sm font-medium">{data.stok_minimum ?? "-"}</p>
            </div>
            {(() => {
              const k = data.kontrak?.[0]
              if (!k?.nomor_kontrak) return null
              const tglMulai = k.tanggal_mulai ? new Date(k.tanggal_mulai).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"
              const tglSelesai = k.tanggal_selesai ? new Date(k.tanggal_selesai).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"
              return (
                <>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Nama Kontrak</label>
                    <p className="text-sm font-medium">{k.nama || "-"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">No. Kontrak</label>
                    <p className="text-sm font-medium">{k.nomor_kontrak}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Periode Kontrak</label>
                    <p className="text-sm font-medium">{tglMulai} — {tglSelesai}</p>
                  </div>
                </>
              )
            })()}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
              <p className="text-sm">{statusBadge(data.is_active)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Dibuat Pada</label>
              <p className="text-sm font-medium">
                {new Date(data.created_at).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><ShoppingBag className="h-4 w-4" />Riwayat Pembelian</h3>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />Memuat riwayat...
            </div>
          ) : history.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Belum ada riwayat pembelian.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Jalur</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>DI / CPO</TableHead>
                    <TableHead>Kontrak</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h, i) => {
                    const margin = data.harga_beli_default != null ? h.harga_satuan - data.harga_beli_default : null
                    const ref = h.di_nomor ?? h.cpo_nomor ?? '-'
                    const kontrak = h.kontrak_nomor ?? '-'
                    return (
                      <TableRow key={`${h.invoice_id}-${i}`}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(h.invoice_tanggal).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="font-medium">{h.customer_nama ?? '-'}</TableCell>
                        <TableCell>
                          {h.path ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              h.path === 'Kontrak → DI'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            }`}>
                              {h.path}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{h.invoice_nomor}</TableCell>
                        <TableCell className="font-mono text-xs">{ref}</TableCell>
                        <TableCell className="font-mono text-xs">{kontrak}</TableCell>
                        <TableCell className="text-right">{h.harga_satuan.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-right">{h.jumlah}</TableCell>
                        <TableCell className="text-right font-medium">{h.total.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-right">
                          {margin != null ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              margin >= 0
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {margin >= 0 ? '+' : ''}{margin.toLocaleString('id-ID')}
                            </span>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
