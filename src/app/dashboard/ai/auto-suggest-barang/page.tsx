"use client"
import { useEffect, useState, useRef } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Hash, Package, History } from 'lucide-react'

interface AutoSuggestItem {
  barang_id: string
  nama: string
  kode: string
  satuan: string | null
  last_harga: number
  total_dibeli: number
  sumber: 'customer' | 'global'
}

export default function AutoSuggestBarangPage() {
  const [data, setData] = useState<AutoSuggestItem[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [customerId, setCustomerId] = useState('')
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!query || query.length < 2) return
    const timer = setTimeout(async () => {
      setLoading(true)
      const params = new URLSearchParams({ query })
      if (customerId) params.set('customer_id', customerId)
      try {
        const r = await apiFetch<{ data: AutoSuggestItem[] }>(`/api/v1/ai/auto-suggest-barang?${params.toString()}`, { method: 'GET' })
        if (mountedRef.current) setData(r.data?.data ?? [])
      } catch {
        if (mountedRef.current) setData([])
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, customerId])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader title="Auto-Suggest Barang" description="Cari barang dengan auto-suggest berdasarkan histori customer" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ketik nama barang..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-10"
            autoFocus
          />
        </div>
        <Input
          placeholder="Customer ID (opsional, filter histori)"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="h-10"
        />
      </div>

      <Card>
        <CardHeader><CardTitle>Hasil Auto-Suggest</CardTitle></CardHeader>
        <CardContent>
          {!query || query.length < 2 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Ketik minimal 2 karakter untuk mulai pencarian</p>
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Tidak ada barang ditemukan untuk &quot;{query}&quot;</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barang</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead>Last Harga</TableHead>
                    <TableHead>Sumber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.barang_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.nama}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {item.kode}
                        </div>
                      </TableCell>
                      <TableCell>{item.satuan ?? '-'}</TableCell>
                      <TableCell>
                        {item.last_harga > 0
                          ? `Rp${item.last_harga.toLocaleString()}`
                          : <span className="text-muted-foreground">-</span>
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.sumber === 'customer' ? 'default' : 'outline'}>
                          {item.sumber === 'customer' ? 'Histori Customer' : 'Global'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Cara Penggunaan
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Ketik nama barang di kolom pencarian — hasil akan muncul real-time setelah 300ms.</p>
          <p>2. Opsional: isi Customer ID untuk memprioritaskan barang yang pernah dibeli customer tersebut.</p>
          <p>3. Hasil dengan badge &quot;Histori Customer&quot; berarti barang pernah dibeli oleh customer tersebut sebelumnya.</p>
          <p>4. Integrasikan API ini ke form Quotation/PO untuk auto-suggest saat input barang.</p>
        </CardContent>
      </Card>
    </div>
  )
}
