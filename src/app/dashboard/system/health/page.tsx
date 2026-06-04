"use client"
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils/date'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { Activity, Database, HardDrive, AlertTriangle } from 'lucide-react'

interface HealthData {
  status: 'healthy' | 'degraded'
  database: {
    connected: boolean
    latency_ms: number
    error: string | null
  }
  storage: {
    connected: boolean
    total_files: number
    provider: string
  }
  errors: {
    count_7d: number
    rate_pct: string
  }
  timestamp: string
}

export default function SystemHealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchHealth = async () => {
      try {
        const r = await apiFetch<HealthData>('/api/v1/system/health', { method: 'GET' })
        if (mounted) setData(r.data ?? null)
      } catch {
        if (mounted) setData(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchHealth()
    return () => { mounted = false }
  }, [])

  const formattedTime = data?.timestamp
    ? formatDateTime(data.timestamp)
    : ''

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="System Health"
        description="Status dan performa sistem secara real-time"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">DB Status</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={data.status === 'healthy' ? 'success' : 'destructive'}>
                    {data.status === 'healthy' ? 'Healthy' : 'Degraded'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.database.connected ? 'Terhubung' : 'Terputus'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Latency</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{data.database.latency_ms}<span className="text-sm font-normal text-muted-foreground">ms</span></p>
                <p className="text-xs text-muted-foreground mt-1">Database response time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">File Count</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{data.storage.total_files}</p>
                <p className="text-xs text-muted-foreground mt-1">Total file di storage</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{data.errors.rate_pct}%</p>
                <p className="text-xs text-muted-foreground mt-1">{data.errors.count_7d} errors (7 hari)</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detail Sistem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Database Connection</span>
                <Badge variant={data.database.connected ? 'success' : 'destructive'}>
                  {data.database.connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">DB Latency</span>
                <span className="text-foreground">{data.database.latency_ms} ms</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">DB Error</span>
                <span className="text-foreground">{data.database.error ?? '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Storage Files</span>
                <span className="text-foreground">{data.storage.total_files}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">7-Day Errors</span>
                <span className="text-foreground">{data.errors.count_7d}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Error Rate</span>
                <span className="text-foreground">{data.errors.rate_pct}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="text-foreground">{formattedTime}</span>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Gagal memuat data kesehatan sistem
          </CardContent>
        </Card>
      )}
    </div>
  )
}
