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
  { label: "PIC Customer", href: "/dashboard/master/pic-customer" },
  { label: "Detail PIC Customer" },
]

interface PicCustomer {
  id: string
  customer: { nama: string }[]
  nama: string
  jabatan: string | null
  no_hp: string | null
  email: string | null
  is_active: boolean
  created_at: string
}

export default function DetailPicCustomerPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [data, setData] = useState<PicCustomer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from("customer_pic")
      .select(`
        id,
        customer!inner(nama),
        nama,
        jabatan,
        no_hp,
        email,
        is_active,
        created_at
      `)
      .eq("id", id)
      .single()
      .then(({ data: result, error: err }) => {
        if (err) setError(err.message)
        else setData(result as PicCustomer)
        setLoading(false)
      })
  }, [id])

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
        title={data.nama || "Detail PIC Customer"}
        description="Informasi lengkap"
        actions={
          <div className="flex gap-2">
            <Button variant="back" onClick={() => router.push("/dashboard/master/pic-customer")}>
              Kembali
            </Button>
            <Button onClick={() => router.push(`/dashboard/master/pic-customer/${id}/edit`)}>
              Edit
            </Button>
          </div>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Customer</label>
              <p className="text-sm font-medium">{data.customer?.[0]?.nama || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Nama PIC</label>
              <p className="text-sm font-medium">{data.nama}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Jabatan</label>
              <p className="text-sm font-medium">{data.jabatan || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">No. HP</label>
              <p className="text-sm font-medium">{data.no_hp || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
              <p className="text-sm font-medium">{data.email || "-"}</p>
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
