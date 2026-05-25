"use client"
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function MaintenancePage() {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      try {
        const r = await apiFetch<{ maintenance_mode: boolean }>('/api/v1/system/maintenance', { method: 'GET' })
        if (mounted) setMaintenanceMode(r.data.maintenance_mode)
      } catch {
        if (mounted) setMaintenanceMode(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetch()
    return () => { mounted = false }
  }, [])

  const handleToggle = async () => {
    setToggling(true)
    try {
      const newValue = !maintenanceMode
      const r = await apiFetch<{ maintenance_mode: boolean; message: string }>('/api/v1/system/maintenance', {
        method: 'POST',
        body: JSON.stringify({ enabled: newValue }),
      })
      setMaintenanceMode(r.data.maintenance_mode)
      toast.success(r.data.message)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengubah mode maintenance')
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="Mode Maintenance"
        description="Aktifkan/nonaktifkan mode maintenance untuk semua pengguna"
      />

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Status Maintenance</CardTitle>
                <CardDescription>
                  Saat mode maintenance aktif, semua pengguna (kecuali Owner & Admin) akan melihat halaman maintenance
                </CardDescription>
              </div>
              <Badge variant={maintenanceMode ? 'destructive' : 'success'} className="text-sm px-3 py-1">
                {maintenanceMode ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              {maintenanceMode ? (
                <ShieldAlert className="h-8 w-8 text-destructive shrink-0" />
              ) : (
                <ShieldCheck className="h-8 w-8 text-success shrink-0" />
              )}
              <div>
                <p className="font-medium text-foreground">
                  {maintenanceMode
                    ? 'Mode maintenance sedang aktif — pengguna tidak bisa mengakses sistem'
                    : 'Mode maintenance nonaktif — semua pengguna bisa mengakses sistem'}
                </p>
              </div>
            </div>

            {maintenanceMode && (
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">Peringatan</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Pastikan tidak ada pengguna yang sedang mengerjakan transaksi penting sebelum mengaktifkan mode ini.
                </p>
              </div>
            )}

            <Button
              variant={maintenanceMode ? 'cancel' : 'default'}
              onClick={handleToggle}
              disabled={toggling}
              className="w-full sm:w-auto"
            >
              {toggling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {maintenanceMode ? 'Nonaktifkan Mode Maintenance' : 'Aktifkan Mode Maintenance'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
