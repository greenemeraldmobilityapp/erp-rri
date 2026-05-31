"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/db/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { BreadcrumbNav, BreadcrumbItem } from "@/components/breadcrumb-nav"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
const breadcrumbItems: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Master Data" },
  { label: "Barang", href: "/dashboard/master/barang" },
  { label: "Detail Barang" },
]

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
}

export default function DetailBarangPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [data, setData] = useState<Barang | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
                <img src={data.image_url} alt={data.nama} className="h-24 w-24 object-contain rounded border" />
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
    </div>
  )
}
