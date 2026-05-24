"use client"
import { useEffect, useState, useRef, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, RotateCcw } from 'lucide-react'

interface AnomalyResult {
  type: 'harga_jual_miring' | 'harga_beli_mahal' | 'margin_kecil' | 'duplikat_transaksi'
  severity: 'low' | 'medium' | 'high'
  entity_type: string
  entity_id: string
  nomor: string
  deskripsi: string
  nilai: number
  threshold: number
  selisih_persen: number
  tanggal: string
}

const severityColor: Record<string, string> = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-muted-foreground text-white',
}

const typeIcon: Record<string, React.ReactNode> = {
  harga_beli_mahal: <TrendingUp className="h-4 w-4 text-destructive" />,
  harga_jual_miring: <TrendingDown className="h-4 w-4 text-destructive" />,
  margin_kecil: <DollarSign className="h-4 w-4 text-yellow-500" />,
  duplikat_transaksi: <AlertTriangle className="h-4 w-4 text-warning" />,
}

const typeLabel: Record<string, string> = {
  harga_beli_mahal: 'Harga Beli Mahal',
  harga_jual_miring: 'Harga Jual Miring',
  margin_kecil: 'Margin Kecil',
  duplikat_transaksi: 'Duplikat Transaksi',
}

export default function AnomalyDetectionPage() {
  const [data, setData] = useState<AnomalyResult[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetchAnomalies = useCallback(async (d: number) => {
    setLoading(true)
    try {
      const r = await apiFetch<{ data: AnomalyResult[] }>(`/api/v1/ai/anomaly-detection?days=${d}`, { method: 'GET' })
      if (mountedRef.current) setData(r.data?.data ?? [])
    } catch {
      if (mountedRef.current) setData([])
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnomalies(days)
  }, [days, fetchAnomalies])

  const highCount = data.filter((a) => a.severity === 'high').length
  const mediumCount = data.filter((a) => a.severity === 'medium').length

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader title="Anomaly Detection" description="Deteksi otomatis harga jual terlalu miring, harga beli terlalu mahal, dan margin tidak wajar" />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Rentang (hari)</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value={7}>7 hari</option>
            <option value={30}>30 hari</option>
            <option value={90}>90 hari</option>
          </select>
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={() => fetchAnomalies(days)}>
          <RotateCcw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Anomaly</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{highCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Medium Severity</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{mediumCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Harga Beli Mahal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.filter((a) => a.type === 'harga_beli_mahal').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Daftar Anomaly</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Tidak ada anomaly terdeteksi dalam {days} hari terakhir</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Severity</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Dokumen</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Selisih</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Badge className={severityColor[a.severity]}>
                          {a.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {typeIcon[a.type]}
                          <span className="text-xs">{typeLabel[a.type]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{a.nomor || '-'}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">{a.deskripsi}</TableCell>
                      <TableCell className="font-medium">Rp{a.nilai.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">Rp{a.threshold.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={a.selisih_persen > 0 ? 'destructive' : 'secondary'}>
                          {a.selisih_persen > 0 ? '+' : ''}{a.selisih_persen}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(a.tanggal).toLocaleDateString('id')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
