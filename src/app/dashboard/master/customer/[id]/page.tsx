"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/db/client"
import { apiFetch } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { BreadcrumbNav, BreadcrumbItem } from "@/components/breadcrumb-nav"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { toast } from "sonner"

const breadcrumbItems: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Master Data" },
  { label: "Customer", href: "/dashboard/master/customer" },
  { label: "Detail Customer" },
]

interface Customer {
  id: string
  nama: string
  kode: string
  alamat: string | null
  kontak: string | null
  terms_of_payment: string | null
  is_active: boolean
  created_at: string
}

interface CustomerTop {
  id: string
  customer_id: string
  top: string
  created_at: string
}

const TOP_OPTIONS = ['Net 30', 'Net 60', 'Cash', 'Custom'] as const

export default function DetailCustomerPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [data, setData] = useState<Customer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [topRecords, setTopRecords] = useState<CustomerTop[]>([])
  const [newTop, setNewTop] = useState('')
  const [addingTop, setAddingTop] = useState(false)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      const { data: cust, error: custErr } = await supabase
        .from("customer")
        .select(`
          id,
          nama,
          kode,
          alamat,
          kontak,
          terms_of_payment,
          is_active,
          created_at
        `)
        .eq("id", id)
        .single()
      if (custErr) setError(custErr.message)
      else setData(cust as Customer)
      setLoading(false)

      try {
        const { data: records } = await apiFetch<CustomerTop[]>(`/api/v1/master/customer-top?customer_id=${id}`)
        setTopRecords(records ?? [])
      } catch {
        // silent
      }
    }

    load()
  }, [id])

  const handleAddTop = async () => {
    if (!id || !newTop) return
    setAddingTop(true)
    try {
      await apiFetch('/api/v1/master/customer-top', {
        method: 'POST',
        body: JSON.stringify({ customer_id: id, top: newTop }),
      })
      toast.success('Terms of Payment berhasil ditambahkan')
      setNewTop('')
      const { data: records } = await apiFetch<CustomerTop[]>(`/api/v1/master/customer-top?customer_id=${id}`)
      setTopRecords(records ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambahkan')
    } finally {
      setAddingTop(false)
    }
  }

  const handleDeleteTop = async (topId: string) => {
    try {
      await apiFetch(`/api/v1/master/customer-top/${topId}`, { method: 'DELETE' })
      toast.success('Terms of Payment berhasil dihapus')
      setTopRecords((prev) => prev.filter((r) => r.id !== topId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus')
    }
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
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader
        title={data.nama || "Detail Customer"}
        description="Informasi lengkap"
        actions={
          <div className="flex gap-2">
            <Button variant="back" onClick={() => router.push("/dashboard/master/customer")}>
              Kembali
            </Button>
            <Button onClick={() => router.push(`/dashboard/master/customer/${id}/edit`)}>
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
              <label className="block text-sm font-medium text-muted-foreground mb-1">Nama Customer</label>
              <p className="text-sm font-medium">{data.nama}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">Alamat</label>
              <p className="text-sm font-medium">{data.alamat || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Kontak</label>
              <p className="text-sm font-medium">{data.kontak || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Terms of Payment (Default)</label>
              <p className="text-sm font-medium">{data.terms_of_payment || "-"}</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Terms of Payment</CardTitle>
        </CardHeader>
        <CardContent>
          {topRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Belum ada Terms of Payment. Tambahkan di bawah.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {topRecords.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                  <span className="text-sm font-medium">{rec.top}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteTop(rec.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 pt-2 border-t">
            <select
              value={newTop}
              onChange={(e) => setNewTop(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus-visible:ring-3 focus-visible:ring-ring"
            >
              <option value="">Pilih TOP</option>
              {TOP_OPTIONS.map((opt) => (
                <option key={opt} value={opt} disabled={topRecords.some((r) => r.top === opt)}>{opt}</option>
              ))}
            </select>
            <Button size="sm" onClick={handleAddTop} disabled={!newTop || addingTop}>
              {addingTop ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tambah
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
