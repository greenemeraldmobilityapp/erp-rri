"use client"
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { Archive, Loader2, Database, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface TableStats {
  total: number
  archivable: number
}

interface ArchiveStatus {
  tables: Record<string, TableStats>
  totalArchivable: number
  totalArchived: number
  cutoffDate: string
}

export default function ArchivePage() {
  const [data, setData] = useState<ArchiveStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      try {
        const r = await apiFetch<ArchiveStatus>('/api/v1/system/archive', { method: 'GET' })
        if (mounted) setData(r.data ?? null)
      } catch {
        if (mounted) setData(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetch()
    return () => { mounted = false }
  }, [])

  const handleArchive = async () => {
    setArchiving(true)
    try {
      const r = await apiFetch<{ archived: number; message: string; errors?: string[] }>('/api/v1/system/archive', {
        method: 'POST',
        body: JSON.stringify({ months: 12 }),
      })
      toast.success(r.data.message)
      const refresh = await apiFetch<ArchiveStatus>('/api/v1/system/archive', { method: 'GET' })
      if (refresh.data) setData(refresh.data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menjalankan archiving')
    } finally {
      setArchiving(false)
    }
  }

  const formattedDate = data?.cutoffDate
    ? new Date(data.cutoffDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="Data Archiving"
        description="Arsipkan data transaksi lama untuk mengoptimalkan performa database"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Arsip</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.totalArchived}</p>
                <p className="text-xs text-muted-foreground mt-1">Record terarsipkan</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Dapat Diarsipkan</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.totalArchivable}</p>
                <p className="text-xs text-muted-foreground mt-1">Record {'>'}12 bulan (sejak {formattedDate})</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tabel</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{Object.keys(data.tables).length}</p>
                <p className="text-xs text-muted-foreground mt-1">Tabel transaksi</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rincian per Tabel</CardTitle>
              <CardDescription>Data transaksi lebih dari 12 bulan yang lalu bisa diarsipkan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {Object.entries(data.tables).map(([table, stats]) => (
                  <div key={table} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium capitalize">{table.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{stats.total} total record</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{stats.archivable} dapat diarsipkan</span>
                      {stats.archivable > 0 ? (
                        <Badge variant="success">{stats.archivable}</Badge>
                      ) : (
                        <Badge variant="outline">Aman</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleArchive}
              disabled={archiving || data.totalArchivable === 0}
              className="w-full sm:w-auto"
            >
              {archiving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Archive className="h-4 w-4 mr-2" />
              {archiving ? 'Mengarsipkan...' : `Arsipkan ${data.totalArchivable} Record`}
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Gagal memuat data archiving
          </CardContent>
        </Card>
      )}
    </div>
  )
}
