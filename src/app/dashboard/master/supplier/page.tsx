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
import { Eye, Pencil, Trash2 } from "lucide-react"
import { TableSkeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

const breadcrumbItems: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Master Data" },
  { label: "Supplier" },
]

interface Supplier {
  id: string
  nama: string
  kode: string
  nama_toko: string | null
  link_toko: string | null
  no_rekening: string | null
  kontak: string | null
  terms_of_payment: string | null
  is_marketplace: boolean
  is_active: boolean
  created_at: string
}

export default function SupplierPage() {
  const router = useRouter()
  const [data, setData] = useState<Supplier[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("supplier")
      .select(`
        id,
        nama,
        kode,
        nama_toko,
        link_toko,
        no_rekening,
        kontak,
        terms_of_payment,
        is_marketplace,
        is_active,
        created_at
      `)
      .order("created_at", { ascending: false })
      .then(({ data: result, error: err }) => {
        if (err) setError(err.message)
        else setData((result || []) as Supplier[])
        setLoading(false)
      })
  }, [])

  const handleDelete = (id: string) => async () => {
    await apiFetch(`/api/v1/master/supplier/${id}`, { method: "DELETE" })
    setData((prev) => prev.filter((item) => item.id !== id))
  }

  const statusBadge = (isActive: boolean) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      isActive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
    }`}>
      {isActive ? "Active" : "Non-Active"}
    </span>
  )

  const marketplaceBadge = (isMarketplace: boolean) => (
    <span className={`text-xs px-2 py-1 rounded-full ${
      isMarketplace ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
    }`}>
      {isMarketplace ? "Ya" : "Tidak"}
    </span>
  )

  const actionButtons = (id: string, name: string) => (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/master/supplier/${id}`)}
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
            onClick={() => router.push(`/dashboard/master/supplier/${id}/edit`)}
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
      <PageHeader title="Data Supplier" />
      <TableSkeleton 
        rows={5} 
        cols={7} 
        actionsCols={3}
        headerHidden
      />
    </div>
  )

  if (error) return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader title="Data Supplier" description="Error loading data" />
      <EmptyState title="Gagal memuat data" description={error} />
    </div>
  )

  const columns: Column<Supplier>[] = [
    { header: "Kode", accessor: (item) => item.kode, sortKey: "kode" },
    { header: "Nama Supplier", accessor: (item) => item.nama, sortKey: "nama" },
    { header: "Nama Toko", accessor: (item) => item.nama_toko || "-", sortKey: "nama_toko" },
    { header: "No. Rekening", accessor: (item) => item.no_rekening || "-", sortKey: "no_rekening" },
    { header: "Kontak", accessor: (item) => item.kontak || "-", sortKey: "kontak" },
    { header: "Marketplace", accessor: (item) => marketplaceBadge(item.is_marketplace), sortKey: "is_marketplace" },
    { header: "Status", accessor: (item) => statusBadge(item.is_active), sortKey: "is_active" },
    { header: "Aksi", accessor: (item) => actionButtons(item.id, item.nama), className: "text-right" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader
        title="Data Supplier"
        description={`${data.length} supplier terdaftar`}
        actions={
          <Link href="/dashboard/master/supplier/tambah">
            <Button>Tambah Supplier</Button>
          </Link>
        }
      />
      {!data.length ? (
        <EmptyState title="Belum ada data supplier" description="Tambahkan supplier pertama Anda untuk memulai." />
      ) : (
        <MasterDataTable
          data={data}
          columns={columns}
          searchFields={["nama", "kode", "nama_toko"]}
          searchPlaceholder="Cari supplier..."
        />
      )}
    </div>
  )
}
