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
  { label: "Karyawan" },
]

interface Karyawan {
  id: string
  nik: string
  nama: string
  email: string
  no_hp: string | null
  jabatan: { nama: string }[]
  is_active: boolean
  created_at: string
}

export default function KaryawanPage() {
  const router = useRouter()
  const [data, setData] = useState<Karyawan[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("karyawan")
      .select("*, jabatan!jabatan_id(nama)")
      .order("nama")
      .then(({ data: result, error: err }) => {
        if (err) setError(err.message)
        else setData((result || []) as Karyawan[])
        setLoading(false)
      })
  }, [])

  const handleDelete = (id: string) => async () => {
    await apiFetch(`/api/v1/master/karyawan/${id}`, { method: "DELETE" })
    setData((prev) => prev.filter((item) => item.id !== id))
  }

  const statusBadge = (isActive: boolean) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      isActive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
    }`}>
      {isActive ? "Aktif" : "Non-Aktif"}
    </span>
  )

  const actionButtons = (id: string, name: string) => (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/master/karyawan/${id}`)}
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
            onClick={() => router.push(`/dashboard/master/karyawan/${id}/edit`)}
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
      <PageHeader title="Karyawan" />
      <TableSkeleton rows={5} cols={6} actionsCols={3} headerHidden />
    </div>
  )

  if (error) return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader title="Karyawan" description="Error loading data" />
      <EmptyState title="Gagal memuat data" description={error} />
    </div>
  )

  const columns: Column<Karyawan>[] = [
    { header: "NIK", accessor: (item) => item.nik, sortKey: "nik" },
    { header: "Nama", accessor: (item) => item.nama, sortKey: "nama" },
    { header: "Email", accessor: (item) => item.email, sortKey: "email" },
    { header: "No. HP", accessor: (item) => item.no_hp || "-", sortKey: "no_hp" },
    { header: "Jabatan", accessor: (item) => item.jabatan?.[0]?.nama || "-" },
    { header: "Status", accessor: (item) => statusBadge(item.is_active), sortKey: "is_active" },
    { header: "Aksi", accessor: (item) => actionButtons(item.id, item.nama), className: "text-right" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader
        title="Karyawan"
        description={`${data.length} karyawan terdaftar`}
        actions={
          <Link href="/dashboard/master/karyawan/tambah">
            <Button>Tambah Karyawan</Button>
          </Link>
        }
      />
      {!data.length ? (
        <EmptyState title="Belum ada data karyawan" description="Tambahkan karyawan pertama Anda untuk memulai." />
      ) : (
        <MasterDataTable
          data={data}
          columns={columns}
          searchFields={["nik", "nama", "email"]}
          searchPlaceholder="Cari karyawan..."
        />
      )}
    </div>
  )
}
