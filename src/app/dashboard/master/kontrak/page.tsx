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
  { label: "Kontrak" },
]

interface Kontrak {
  id: string
  nomor_kontrak: string | null
  nama: string
  customer: { nama: string } | null
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  is_active: boolean
  created_at: string
}

export default function KontrakPage() {
  const router = useRouter()
  const [data, setData] = useState<Kontrak[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("kontrak")
      .select(`
        id,
        nomor_kontrak,
        nama,
        customer!customer_id(nama),
        tanggal_mulai,
        tanggal_selesai,
        is_active,
        created_at
      `)
      .order("created_at", { ascending: false })
      .then(({ data: result, error: err }) => {
        if (err) setError(err.message)
        else setData((result || []) as unknown as Kontrak[])
        setLoading(false)
      })
  }, [])

  const handleDelete = (id: string) => async () => {
    await apiFetch(`/api/v1/master/kontrak/${id}`, { method: "DELETE" })
    setData((prev) => prev.filter((item) => item.id !== id))
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
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
            onClick={() => router.push(`/dashboard/master/kontrak/${id}`)}
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
            onClick={() => router.push(`/dashboard/master/kontrak/${id}/edit`)}
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
      <PageHeader title="Data Kontrak" />
      <TableSkeleton rows={5} cols={5} actionsCols={3} headerHidden />
    </div>
  )

  if (error) return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader title="Data Kontrak" description="Error loading data" />
      <EmptyState title="Gagal memuat data" description={error} />
    </div>
  )

  const columns: Column<Kontrak>[] = [
    { header: "Nomor Kontrak", accessor: (item) => item.nomor_kontrak || "-", sortKey: "nomor_kontrak" },
    { header: "Nama Kontrak", accessor: (item) => item.nama, sortKey: "nama" },
    { header: "Customer", accessor: (item) => item.customer?.nama || "-" },
    { header: "Tanggal Mulai", accessor: (item) => formatDate(item.tanggal_mulai), sortKey: "tanggal_mulai" },
    { header: "Tanggal Selesai", accessor: (item) => formatDate(item.tanggal_selesai), sortKey: "tanggal_selesai" },
    { header: "Status", accessor: (item) => statusBadge(item.is_active), sortKey: "is_active" },
    { header: "Aksi", accessor: (item) => actionButtons(item.id, item.nama), className: "text-right" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader
        title="Data Kontrak"
        description={`${data.length} kontrak terdaftar`}
        actions={
          <Link href="/dashboard/master/kontrak/tambah">
            <Button>Tambah Kontrak</Button>
          </Link>
        }
      />
      {!data.length ? (
        <EmptyState title="Belum ada data kontrak" description="Tambahkan kontrak pertama Anda untuk memulai." />
      ) : (
        <MasterDataTable
          data={data}
          columns={columns}
          searchFields={["nama"]}
          searchPlaceholder="Cari kontrak..."
        />
      )}
    </div>
  )
}
