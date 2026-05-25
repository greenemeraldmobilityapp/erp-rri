"use client"
import { useEffect, useState, type ReactNode } from 'react'
import { apiFetch } from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { ShieldAlert } from 'lucide-react'

export function MaintenanceGuard({ children }: { children: ReactNode }) {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [checking, setChecking] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        const r = await apiFetch<{ maintenance_mode: boolean }>('/api/v1/system/maintenance', { method: 'GET' })
        if (mounted) setMaintenanceMode(r.data.maintenance_mode)
      } catch {
        // if fetch fails, assume no maintenance
      } finally {
        if (mounted) setChecking(false)
      }
    }
    check()
    const interval = setInterval(check, 60000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  if (checking) return <>{children}</>

  const isAdmin = user?.role === 'owner' || user?.role === 'admin'

  if (maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Sedang Perbaikan</h1>
          <p className="text-muted-foreground text-lg">
            Sistem sedang dalam perawatan. Silakan coba lagi beberapa saat.
          </p>
          <div className="pt-4">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
