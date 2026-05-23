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
  { label: "Chart of Accounts" },
]

interface Coa {
  id: string
  kode: string
  nama: string
  tipe: string
  coa: { nama: string }[]
  keterangan: string | null
  is_active?: boolean
  created_at: string
}

export default function CoaPage() {
  const router = useRouter()
  const [data, setData] = useState<Coa[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("coa")
      .select(`
        id,
        kode,
        nama,
        tipe,
        coa!induk_id(nama),
        keterangan,
        created_at
      `)
      .order("created_at", { ascending: false })
      .then(({ data: result, error: err }) => {
        if (err) setError(err.message)
        else setData((result || []) as Coa[])
        setLoading(false)
      })
  }, [])

  const handleDelete = (id: string) => async () => {
    await apiFetch(`/api/v1/master/coa/${id}`, { method: "DELETE" })
    setData((prev) => prev.filter((item) => item.id !== id))
  }

  const actionButtons = (id: string, name: string) => (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/master/coa/${id}`)}
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
            onClick={() => router.push(`/dashboard/master/coa/${id}/edit`)}
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
      <PageHeader title="Chart of Accounts" />
      <TableSkeleton rows={5} cols={6} actionsCols={3} headerHidden />
    </div>
  )

  if (error) return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader title="Chart of Accounts" description="Error loading data" />
      <EmptyState title="Gagal memuat data" description={error} />
    </div>
  )

  const columns: Column<Coa>[] = [
    { header: "Kode", accessor: (item) => item.kode, sortKey: "kode" },
    { header: "Nama Akun", accessor: (item) => item.nama, sortKey: "nama" },
    { header: "Tipe", accessor: (item) => item.tipe, sortKey: "tipe" },
    { header: "Akun Induk", accessor: (item) => item.coa?.[0]?.nama || "-" },
    { header: "Keterangan", accessor: (item) => item.keterangan || "-", sortKey: "keterangan" },
    {
      header: "Status",
      accessor: () => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-success/10 text-success">
          Active
        </span>
      ),
    },
    { header: "Aksi", accessor: (item) => actionButtons(item.id, item.nama), className: "text-right" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader
        title="Chart of Accounts"
        description={`${data.length} akun terdaftar`}
        actions={
          <Link href="/dashboard/master/coa/tambah">
            <Button>Tambah Akun</Button>
          </Link>
        }
      />
      {!data.length ? (
        <EmptyState title="Belum ada data akun" description="Tambahkan akun pertama Anda untuk memulai." />
      ) : (
        <MasterDataTable
          data={data}
          columns={columns}
          searchFields={["kode", "nama", "tipe"]}
          searchPlaceholder="Cari akun..."
        />
      )}
    </div>
  )
}
