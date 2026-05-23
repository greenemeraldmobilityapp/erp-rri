"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/db/client"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { BreadcrumbNav, BreadcrumbItem } from "@/components/breadcrumb-nav"
import { PageHeader } from "@/components/page-header"
import { MasterDataTable, Column } from "@/components/master-data-table"
import { apiFetch } from "@/lib/api/client"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

const breadcrumbItems: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Master Data" },
  { label: "Barang" },
]

interface Barang {
  id: string
  nama: string
  kode: string
  kategori_barang: { nama: string }[]
  satuan: string | null
  spesifikasi: string | null
  harga_beli_default: number | null
  harga_jual_default: number | null
  stok_minimum: number | null
  is_active: boolean
  created_at: string
}

export default function BarangPage() {
  const router = useRouter()
  const [data, setData] = useState<Barang[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("barang")
      .select(`
        id,
        nama,
        kode,
        kategori_barang!inner(nama),
        satuan,
        spesifikasi,
        harga_beli_default,
        harga_jual_default,
        stok_minimum,
        is_active,
        created_at
      `)
      .order("created_at", { ascending: false })
      .then(({ data: result, error: err }) => {
        if (err) setError(err.message)
        else setData((result || []) as Barang[])
        setLoading(false)
      })
  }, [])

  const handleDelete = (id: string) => async () => {
    await apiFetch(`/api/v1/master/barang/${id}`, { method: "DELETE" })
    setData((prev) => prev.filter((item) => item.id !== id))
  }

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

  const actionButtons = (id: string, name: string) => (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/master/barang/${id}`)}
            className="hover:bg-accent"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Lihat Detail</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/master/barang/${id}/edit`)}
            className="hover:bg-accent"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit</TooltipContent>
      </Tooltip>
      <DeleteConfirmationDialog
        onConfirm={handleDelete(id)}
        itemName={name}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        }
      />
    </div>
  )

  if (loading) return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader title="Data Barang" />
      <TableSkeleton 
        rows={5} 
        cols={8} 
        actionsCols={3}
        headerHidden
      />
    </div>
  )

  if (error) return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader title="Data Barang" description="Error loading data" />
      <EmptyState title="Gagal memuat data" description={error} />
    </div>
  )

  const columns: Column<Barang>[] = [
    { header: "Kode", accessor: (item) => item.kode, sortKey: "kode" },
    { header: "Nama Barang", accessor: (item) => item.nama, sortKey: "nama" },
    { header: "Kategori", accessor: (item) => item.kategori_barang?.[0]?.nama || "-" },
    { header: "Satuan", accessor: (item) => item.satuan || "-", sortKey: "satuan" },
    { header: "Harga Beli", accessor: (item) => formatCurrency(item.harga_beli_default), sortKey: "harga_beli_default" },
    { header: "Harga Jual", accessor: (item) => formatCurrency(item.harga_jual_default), sortKey: "harga_jual_default" },
    { header: "Stok Min", accessor: (item) => item.stok_minimum ?? "-", sortKey: "stok_minimum" },
    { header: "Status", accessor: (item) => statusBadge(item.is_active), sortKey: "is_active" },
    { header: "Aksi", accessor: (item) => actionButtons(item.id, item.nama), className: "text-right" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader
        title="Data Barang"
        description={`${data.length} barang terdaftar`}
        actions={
          <Link href="/dashboard/master/barang/tambah">
            <Button>Tambah Barang</Button>
          </Link>
        }
      />
      {!data.length ? (
        <EmptyState title="Belum ada data barang" description="Tambahkan barang pertama Anda untuk memulai." />
      ) : (
        <MasterDataTable
          data={data}
          columns={columns}
          searchFields={["nama", "kode"]}
          searchPlaceholder="Cari barang..."
        />
      )}
    </div>
  )
}
