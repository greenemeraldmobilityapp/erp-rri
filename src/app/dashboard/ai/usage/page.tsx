"use client"
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PageHeader } from '@/components/page-header'
import { Bot, Database, Eye, Zap } from 'lucide-react'

interface UsageStats {
  total: { nego: number; data: number; vision: number; automation: number }
  daily: Array<{ date: string; nego: number; data: number; vision: number; automation: number }>
  byTaskType: Array<{ task_type: string; count: number }>
  topUsers: Array<{ user_id: string; count: number }>
}

export default function AIUsagePage() {
  const [stats, setStats] = useState<UsageStats | null>(null)

  useEffect(() => {
    apiFetch<UsageStats>('/api/v1/ai/agents/usage', { method: 'GET' })
      .then(r => setStats(r.data as UsageStats))
      .catch(() => {})
  }, [])

  const total = stats?.total ?? { nego: 0, data: 0, vision: 0, automation: 0 }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader title="AI Agents Usage" description="Ringkasan penggunaan seluruh AI agent" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Harian</TabsTrigger>
          <TabsTrigger value="tasks">Task Types</TabsTrigger>
          <TabsTrigger value="users">Top Users</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="pt-4">
          <Card>
            <CardHeader><CardTitle>Penggunaan per Hari</CardTitle></CardHeader>
            <CardContent>
              {stats?.daily && stats.daily.length > 0 ? (
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
              {stats?.byTaskType && stats.byTaskType.length > 0 ? (
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
              {stats?.topUsers && stats.topUsers.length > 0 ? (
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
      </Tabs>
    </div>
  )
}
