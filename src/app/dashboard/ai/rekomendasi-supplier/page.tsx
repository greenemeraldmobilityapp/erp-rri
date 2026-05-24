"use client"
import { useEffect, useState, useRef } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Store, Search, RotateCcw, TrendingUp, ShoppingCart, Award } from 'lucide-react'

interface SupplierScore {
  supplier_id: string
  nama: string
  kode: string
  kontak: string | null
  terms_of_payment: string | null
  is_marketplace: boolean
  metrics: {
    total_po: number
    total_spent: number
    avg_harga_satuan: number
    last_order_date: string | null
    barang_dibeli: number
    price_rank: number
    score: number
  }
}

export default function RekomendasiSupplierPage() {
  const [data, setData] = useState<SupplierScore[]>([])
  const [loading, setLoading] = useState(true)
  const [barangFilter, setBarangFilter] = useState('')
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (barangFilter) params.set('barang_id', barangFilter)
      try {
        const r = await apiFetch<{ data: SupplierScore[] }>(`/api/v1/ai/rekomendasi-supplier?${params.toString()}`, { method: 'GET' })
        if (mountedRef.current) setData(r.data?.data ?? [])
      } catch {
        if (mountedRef.current) setData([])
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }
    fetchData()
  }, [barangFilter])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader title="Rekomendasi Supplier" description="Prediktif ranking supplier berdasarkan histori PO, harga, dan performa" />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by barang_id..."
            value={barangFilter}
            onChange={(e) => setBarangFilter(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {barangFilter && (
          <Button variant="ghost" size="sm" className="h-9 px-2" onClick={() => setBarangFilter('')}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Supplier</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{data.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Top Score</CardTitle>
                <Award className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data[0]?.metrics.score ?? 0}</div>
                <p className="text-xs text-muted-foreground">{data[0]?.nama ?? '-'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total PO</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.reduce((sum, s) => sum + s.metrics.total_po, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rp{data.reduce((sum, s) => sum + s.metrics.total_spent, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Ranking Supplier</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Belum ada data PO selesai untuk di-rank</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Total PO</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Barang</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Kontak</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((s, i) => (
                    <TableRow key={s.supplier_id}>
                      <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{s.nama}</div>
                        <div className="text-xs text-muted-foreground">{s.kode}{s.is_marketplace ? ' (Marketplace)' : ''}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={s.metrics.score >= 70 ? '' : s.metrics.score >= 40 ? 'bg-yellow-500' : 'bg-muted-foreground'}>
                          {s.metrics.score}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.metrics.total_po}x</TableCell>
                      <TableCell>Rp{s.metrics.total_spent.toLocaleString()}</TableCell>
                      <TableCell>{s.metrics.barang_dibeli} item</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.metrics.last_order_date ? new Date(s.metrics.last_order_date).toLocaleDateString('id') : '-'}
                      </TableCell>
                      <TableCell className="text-xs">{s.kontak ?? '-'}</TableCell>
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
