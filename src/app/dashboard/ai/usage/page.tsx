"use client"
import { useEffect, useState, useRef } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { Bot, Database, Eye, Zap, Search, RotateCcw, AlertTriangle } from 'lucide-react'

interface UsageStats {
  total: { nego: number; data: number; vision: number; automation: number }
  daily: Array<{ date: string; nego: number; data: number; vision: number; automation: number }>
  byTaskType: Array<{ task_type: string; count: number }>
  topUsers: Array<{ user_id: string; count: number }>
}

interface ErrorStats {
  period: { from: string; to: string }
  agents: Record<string, { total: number; errors: number; errorRate: number; avgLatencyMs: number | null }>
  topErrors: Array<{ agent: string; error: string; count: number }>
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const today = new Date()
const defaultEndDate = formatDate(today)
const defaultStartDate = formatDate(new Date(today.getTime() - 30 * 86400000))

export default function AIUsagePage() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingErrors, setLoadingErrors] = useState(true)
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const [searchUser, setSearchUser] = useState('')
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)
      if (searchUser) params.set('search_user', searchUser)
      try {
        const r = await apiFetch<UsageStats>(`/api/v1/ai/agents/usage?${params.toString()}`, { method: 'GET' })
        if (mountedRef.current) setStats(r.data as UsageStats)
      } catch {
        if (mountedRef.current) setStats(null)
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }
    const fetchErrorStats = async () => {
      setLoadingErrors(true)
      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)
      try {
        const r = await apiFetch<ErrorStats>(`/api/v1/ai/agents/error-stats?${params.toString()}`, { method: 'GET' })
        if (mountedRef.current) setErrorStats(r.data as ErrorStats)
      } catch {
        if (mountedRef.current) setErrorStats(null)
      } finally {
        if (mountedRef.current) setLoadingErrors(false)
      }
    }
    fetchStats()
    fetchErrorStats()
  }, [startDate, endDate, searchUser])

  const total = stats?.total ?? { nego: 0, data: 0, vision: 0, automation: 0 }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader title="AI Agents Usage" description="Ringkasan penggunaan seluruh AI agent" />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Dari</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Sampai</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 w-40" />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Cari user..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="h-9 flex-1"
          />
          {searchUser && (
            <Button variant="ghost" size="sm" className="h-9 px-2" onClick={() => setSearchUser('')}>
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          <>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">NegoAgent</CardTitle><Bot className="h-4 w-4 text-accent" /></CardHeader><CardContent><Skeleton className="h-8 w-20" /></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">DataAgent</CardTitle><Database className="h-4 w-4 text-success" /></CardHeader><CardContent><Skeleton className="h-8 w-20" /></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">VisionAgent</CardTitle><Eye className="h-4 w-4 text-primary" /></CardHeader><CardContent><Skeleton className="h-8 w-20" /></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Automation</CardTitle><Zap className="h-4 w-4 text-warning" /></CardHeader><CardContent><Skeleton className="h-8 w-20" /></CardContent></Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">NegoAgent</CardTitle>
                <Bot className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{total.nego.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">DataAgent</CardTitle>
                <Database className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{total.data.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">VisionAgent</CardTitle>
                <Eye className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{total.vision.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Automation</CardTitle>
                <Zap className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{total.automation.toLocaleString()}</div></CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Harian</TabsTrigger>
          <TabsTrigger value="tasks">Task Types</TabsTrigger>
          <TabsTrigger value="users">Top Users</TabsTrigger>
          <TabsTrigger value="errors">Error Rate</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="pt-4">
          <Card>
            <CardHeader><CardTitle>Penggunaan per Hari</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full rounded" />
              ) : stats?.daily && stats.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.daily}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="nego" style={{ fill: 'var(--accent)' }} name="NegoAgent" stackId="a" />
                    <Bar dataKey="data" style={{ fill: 'var(--success)' }} name="DataAgent" stackId="a" />
                    <Bar dataKey="vision" style={{ fill: 'var(--primary)' }} name="VisionAgent" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">Belum ada data penggunaan</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="pt-4">
          <Card>
            <CardHeader><CardTitle>Distribusi Task Type (DataAgent)</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between"><Skeleton className="h-6 w-32" /><Skeleton className="h-6 w-12" /></div>
                  ))}
                </div>
              ) : stats?.byTaskType && stats.byTaskType.length > 0 ? (
                <div className="space-y-2">
                  {stats.byTaskType.map(t => (
                    <div key={t.task_type} className="flex items-center justify-between">
                      <Badge variant="outline">{t.task_type}</Badge>
                      <span className="font-medium">{t.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Belum ada data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="pt-4">
          <Card>
            <CardHeader><CardTitle>Top Users</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between"><Skeleton className="h-6 w-48" /><Skeleton className="h-6 w-20" /></div>
                  ))}
                </div>
              ) : stats?.topUsers && stats.topUsers.length > 0 ? (
                <div className="space-y-2">
                  {stats.topUsers.map((u, i) => (
                    <div key={u.user_id} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {i + 1}. {u.user_id.slice(0, 8)}...
                      </span>
                      <span className="font-medium">{u.count.toLocaleString()} requests</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Belum ada data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="pt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Error Rate per Agent (7 hari terakhir)</CardTitle></CardHeader>
            <CardContent>
              {loadingErrors ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between"><Skeleton className="h-6 w-32" /><Skeleton className="h-6 w-16" /></div>
                  ))}
                </div>
              ) : errorStats?.agents ? (
                <div className="space-y-4">
                  {Object.entries(errorStats.agents).map(([agent, data]) => {
                    const color = data.errorRate > 10 ? 'text-destructive' : data.errorRate > 5 ? 'text-warning' : 'text-success'
                    return (
                      <div key={agent} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          {agent === 'nego' && <Bot className="h-4 w-4 text-accent" />}
                          {agent === 'data' && <Database className="h-4 w-4 text-success" />}
                          {agent === 'vision' && <Eye className="h-4 w-4 text-primary" />}
                          {agent === 'automation' && <Zap className="h-4 w-4 text-warning" />}
                          <span className="font-medium capitalize">{agent}Agent</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">{data.total} total</span>
                          {data.avgLatencyMs !== null && (
                            <span className="text-muted-foreground">{data.avgLatencyMs}ms avg</span>
                          )}
                          <span className={color + ' font-semibold'}>
                            {data.errors} errors ({data.errorRate}%)
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Belum ada data error</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <CardTitle>Top Error Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingErrors ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : errorStats?.topErrors && errorStats.topErrors.length > 0 ? (
                <div className="space-y-2">
                  {errorStats.topErrors.map((e, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 p-2 hover:bg-muted/30 rounded text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{e.agent.replace('ai_', '').replace('_history', '')}</span>
                        <span className="text-muted-foreground ml-2 truncate block">{e.error}</span>
                      </div>
                      <Badge variant="destructive" className="shrink-0">{e.count}x</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Belum ada error tercatat</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
