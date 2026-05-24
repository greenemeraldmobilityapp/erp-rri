"use client"
import { useEffect, useState, useRef } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Package } from 'lucide-react'

interface PriceTrendResult {
  barang_id: string
  nama: string
  kode: string
  satuan: string | null
  trends: Array<{ bulan: string; harga_rata: number; harga_min: number; harga_max: number; jumlah_transaksi: number }>
  stats: {
    rata_rata: number
    minimum: number
    maksimum: number
    perubahan: number
    rekomendasi_beli: string
  }
}

export default function PriceTrendPage() {
  const [data, setData] = useState<PriceTrendResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [barangId, setBarangId] = useState('')
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!barangId) return
    let cancelled = false
    const fetchData = async () => {
      setLoading(true)
      const params = new URLSearchParams({ barang_id: barangId })
      try {
        const r = await apiFetch<{ data: PriceTrendResult }>(`/api/v1/ai/price-trend?${params.toString()}`, { method: 'GET' })
        if (mountedRef.current && !cancelled) setData(r.data?.data ?? null)
      } catch {
        if (mountedRef.current && !cancelled) setData(null)
      } finally {
        if (mountedRef.current && !cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [barangId])

  const TrendIcon = data?.stats.perubahan
    ? data.stats.perubahan > 5 ? TrendingUp : data.stats.perubahan < -5 ? TrendingDown : Minus
    : Minus

  const trendColor = data?.stats.perubahan
    ? data.stats.perubahan > 5 ? 'text-destructive' : data.stats.perubahan < -5 ? 'text-success' : 'text-muted-foreground'
    : 'text-muted-foreground'

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader title="Price Trend Analysis" description="Tren harga barang per bulan dari histori Purchase Order" />

      <div className="relative max-w-md">
        <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Masukkan barang_id..."
          value={barangId}
          onChange={(e) => setBarangId(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-5 w-20" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /></CardContent></Card>
            ))}
          </div>
          <Skeleton className="h-[300px] w-full rounded" />
        </div>
      ) : !barangId ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Masukkan barang_id untuk melihat tren harga</p>
      ) : !data ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Barang tidak ditemukan atau belum ada data transaksi</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{data.nama}</CardTitle></CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">{data.kode} | {data.satuan ?? '-'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Rata-rata</CardTitle>
                <Minus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">Rp{data.stats.rata_rata.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Range Harga</CardTitle>
                <TrendIcon className={`h-4 w-4 ${trendColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">Rp{data.stats.minimum.toLocaleString()} - Rp{data.stats.maksimum.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{data.stats.perubahan > 0 ? '+' : ''}{data.stats.perubahan}% perubahan</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Rekomendasi</CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <Badge className="text-xs">{data.stats.rekomendasi_beli}</Badge>
              </CardContent>
            </Card>
          </div>

          {data.trends.length > 0 ? (
            <Card>
              <CardHeader><CardTitle>Tren Harga ({data.trends.length} bulan)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => `Rp${Number(value).toLocaleString()}`} />
                    <Bar dataKey="harga_rata" fill="var(--primary)" name="Rata-rata" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground text-sm">Belum ada data tren untuk ditampilkan</p>
          )}
        </>
      )}
    </div>
  )
}
