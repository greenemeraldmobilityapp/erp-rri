"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
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
import { ExportButton } from "@/components/export-button"
import { ImageLightbox } from "@/components/image-lightbox"
import { PageTour } from '@/components/onboarding/page-tour'
import { barangListSteps } from '@/components/onboarding/tour-steps/barang-list'
import { Pagination } from "@/components/pagination"
import { BarangFilter, BarangFilterValues } from "@/components/barang-filter"

const breadcrumbItems: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Master Data" },
  { label: "Barang" },
]

interface Barang {
  id: string
  nama: string
  kode: string
  image_url: string | null
  kategori_barang: { nama: string }
  kontrak: { nomor_kontrak: string; nama: string; tanggal_mulai: string | null; tanggal_selesai: string | null } | null
  satuan: string | null
  spesifikasi: string | null
  harga_beli_default: number | null
  harga_jual_default: number | null
  stok_minimum: number | null
  is_active: boolean
  created_at: string
}

interface FilterOptions {
  categories: { id: string; nama: string }[]
  satuanList: string[]
  namaKontrakList: string[]
}

interface ListResponse {
  items: Barang[]
  count: number
  page: number
  totalPages: number
  filterOptions: FilterOptions
}

const defaultFilters: BarangFilterValues = {
  search: "",
  kategori_id: "__all__",
  status: "all",
  kontrak: "all",
  satuan: "__all__",
  nama_kontrak: "__all__",
}

export default function BarangPage() {
  const router = useRouter()
  const [data, setData] = useState<Barang[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<BarangFilterValues>(defaultFilters)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ categories: [], satuanList: [], namaKontrakList: [] })

  const doFetch = useCallback(async (p: number, f: BarangFilterValues) => {
    const params = new URLSearchParams()
    params.set('page', String(p))
    params.set('limit', '20')
    if (f.search) params.set('search', f.search)
    if (f.kategori_id !== '__all__') params.set('kategori_id', f.kategori_id)
    if (f.status !== 'all') params.set('status', f.status)
    if (f.kontrak !== 'all') params.set('kontrak', f.kontrak)
    if (f.satuan !== '__all__') params.set('satuan', f.satuan)
    if (f.nama_kontrak !== '__all__') params.set('nama_kontrak', f.nama_kontrak)

    try {
      const res = await apiFetch<ListResponse>(`/api/v1/master/barang?${params}`)
      const d = res.data
      setData(d.items)
      setTotalCount(d.count)
      setTotalPages(d.totalPages)
      setFilterOptions(d.filterOptions)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    doFetch(page, filters).finally(() => setLoading(false))
  }, [])

  const handleFilterChange = (newFilters: BarangFilterValues) => {
    setFilters(newFilters)
    setPage(1)
    setLoading(true)
    setError(null)
    doFetch(1, newFilters).finally(() => setLoading(false))
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    setLoading(true)
    setError(null)
    doFetch(newPage, filters).finally(() => setLoading(false))
  }

  const handleDelete = (id: string) => async () => {
    await apiFetch(`/api/v1/master/barang/${id}`, { method: "DELETE" })
    setData((prev) => prev.filter((item) => item.id !== id))
    setTotalCount((prev) => prev - 1)
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-"
    return `Rp ${Number(value).toLocaleString("id-ID")}`
  }

  const statusBadge = (item: Barang) => {
    const kontrakIsExpired = item.kontrak?.tanggal_selesai
      ? item.kontrak.tanggal_selesai < new Date().toISOString().split('T')[0]
      : false
    const active = item.is_active && !kontrakIsExpired
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
      }`}>
        {active ? "Active" : "Non-Active"}
      </span>
    )
  }

  const actionButtons = (id: string, name: string) => (
    <div className="flex items-center justify-end gap-1" data-tour="barang-actions">
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

  if (loading && data.length === 0) return (
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
    { header: "Picture", accessor: (item) =>
      item.image_url
        ? <ImageLightbox src={item.image_url} alt={item.nama}><img src={item.image_url} alt={item.nama} className="h-10 w-10 object-cover rounded" /></ImageLightbox>
        : <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">-</div>
    },
    { header: "Kode", accessor: (item) => item.kode, sortKey: "kode" },
    { header: "Nama Barang", accessor: (item) => item.nama, sortKey: "nama" },
    { header: "Kategori", accessor: (item) => item.kategori_barang?.nama || "-" },
    { header: "Kontrak", accessor: (item) => {
      const k = item.kontrak
      if (!k?.nomor_kontrak) return "tidak ada"
      const tglMulai = k.tanggal_mulai ? new Date(k.tanggal_mulai).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" }) : "..."
      const tglSelesai = k.tanggal_selesai ? new Date(k.tanggal_selesai).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" }) : "..."
      return `${k.nama || k.nomor_kontrak} (${tglMulai} - ${tglSelesai})`
    } },
    { header: "Satuan", accessor: (item) => item.satuan || "-", sortKey: "satuan" },
    { header: "Harga Beli", accessor: (item) => formatCurrency(item.harga_beli_default), sortKey: "harga_beli_default" },
    { header: "Harga Jual", accessor: (item) => formatCurrency(item.harga_jual_default), sortKey: "harga_jual_default" },
    { header: "Stok Min", accessor: (item) => item.stok_minimum ?? "-", sortKey: "stok_minimum" },
    { header: "Status", accessor: (item) => statusBadge(item), sortKey: "is_active" },
    { header: "Aksi", accessor: (item) => actionButtons(item.id, item.nama), className: "text-right" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8" data-tour="barang-title">
      <div data-tour="barang-header">
        <BreadcrumbNav items={breadcrumbItems} />
        <PageHeader
          title="Data Barang"
          description={`${totalCount} barang terdaftar`}
          actions={
            <>
              <ExportButton table="barang" />
              <PageTour pageKey="barang-list" steps={barangListSteps} />
              <Link href="/dashboard/master/barang/tambah" data-tour="btn-tambah-barang">
                <Button>Tambah Barang</Button>
              </Link>
            </>
          }
        />
      </div>

      <BarangFilter
        options={filterOptions}
        values={filters}
        onChange={handleFilterChange}
      />

      {loading ? (
        <TableSkeleton rows={5} cols={8} actionsCols={3} headerHidden />
      ) : !data.length ? (
        <EmptyState title="Belum ada data barang" description="Tambahkan barang pertama Anda untuk memulai." />
      ) : (
        <>
          <MasterDataTable
            data={data}
            columns={columns}
            searchFields={[]}
            showRowNumber
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}
