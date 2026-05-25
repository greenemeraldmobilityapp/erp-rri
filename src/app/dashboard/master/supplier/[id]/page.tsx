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
  { label: "Supplier", href: "/dashboard/master/supplier" },
  { label: "Detail Supplier" },
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

interface SupplierKontak {
  id: string
  supplier_id: string
  nama: string
  jabatan: string | null
  no_hp: string | null
  email: string | null
  is_active: boolean
}

export default function DetailSupplierPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split("/").pop()
  const [data, setData] = useState<Supplier | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [kontakRecords, setKontakRecords] = useState<SupplierKontak[]>([])
  const [newNama, setNewNama] = useState('')
  const [newJabatan, setNewJabatan] = useState('')
  const [newNoHp, setNewNoHp] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      const { data: sup, error: supErr } = await supabase
        .from("supplier")
        .select(`id, nama, kode, nama_toko, link_toko, no_rekening, kontak, terms_of_payment, is_marketplace, is_active, created_at`)
        .eq("id", id)
        .single()
      if (supErr) setError(supErr.message)
      else setData(sup as Supplier)
      setLoading(false)

      try {
        const { data: kontaks } = await apiFetch<SupplierKontak[]>(`/api/v1/master/supplier-kontak?supplier_id=${id}`)
        setKontakRecords(kontaks ?? [])
      } catch {}
    }

    load()
  }, [id])

  const handleAdd = async () => {
    if (!id || !newNama) return
    setAdding(true)
    try {
      await apiFetch('/api/v1/master/supplier-kontak', {
        method: 'POST',
        body: JSON.stringify({ supplier_id: id, nama: newNama, jabatan: newJabatan || undefined, no_hp: newNoHp || undefined, email: newEmail || undefined }),
      })
      toast.success('Kontak berhasil ditambahkan')
      setNewNama(''); setNewJabatan(''); setNewNoHp(''); setNewEmail('')
      const { data: kontaks } = await apiFetch<SupplierKontak[]>(`/api/v1/master/supplier-kontak?supplier_id=${id}`)
      setKontakRecords(kontaks ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambahkan')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (kontakId: string) => {
    try {
      await apiFetch(`/api/v1/master/supplier-kontak/${kontakId}`, { method: 'DELETE' })
      toast.success('Kontak berhasil dihapus')
      setKontakRecords((prev) => prev.filter((r) => r.id !== kontakId))
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

  const marketplaceBadge = (isMarketplace: boolean) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      isMarketplace ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
    }`}>
      {isMarketplace ? "Ya" : "Tidak"}
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
        title={data.nama || "Detail Supplier"}
        description="Informasi lengkap"
        actions={
          <div className="flex gap-2">
            <Button variant="back" onClick={() => router.push("/dashboard/master/supplier")}>
              Kembali
            </Button>
            <Button onClick={() => router.push(`/dashboard/master/supplier/${id}/edit`)}>
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
              <label className="block text-sm font-medium text-muted-foreground mb-1">Nama Supplier</label>
              <p className="text-sm font-medium">{data.nama}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Nama Toko</label>
              <p className="text-sm font-medium">{data.nama_toko || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Link Toko</label>
              <p className="text-sm font-medium">
                {data.link_toko ? (
                  <a href={data.link_toko} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {data.link_toko}
                  </a>
                ) : "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">No. Rekening</label>
              <p className="text-sm font-medium">{data.no_rekening || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Kontak Utama</label>
              <p className="text-sm font-medium">{data.kontak || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Terms of Payment</label>
              <p className="text-sm font-medium">{data.terms_of_payment || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Marketplace</label>
              <p className="text-sm">{marketplaceBadge(data.is_marketplace)}</p>
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
          <CardTitle className="text-lg">Kontak PIC Supplier</CardTitle>
        </CardHeader>
        <CardContent>
          {kontakRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Belum ada kontak PIC. Tambahkan di bawah.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {kontakRecords.map((k) => (
                <div key={k.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{k.nama}</p>
                    <p className="text-xs text-muted-foreground">
                      {[k.jabatan, k.no_hp, k.email].filter(Boolean).join(' — ') || '-'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(k.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="pt-2 border-t space-y-2">
            <div className="flex gap-2">
              <input type="text" placeholder="Nama *" value={newNama} onChange={(e) => setNewNama(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
              <input type="text" placeholder="Jabatan" value={newJabatan} onChange={(e) => setNewJabatan(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="No. HP" value={newNoHp} onChange={(e) => setNewNoHp(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
              <input type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
              <Button size="sm" onClick={handleAdd} disabled={!newNama || adding}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Tambah
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
