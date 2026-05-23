"use client"
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { TableSkeleton } from '@/components/ui/skeleton'
import { Package, Plus, Minus, FileText, Download, Search, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface Barang { id: string; nama: string; kode: string; satuan: string; stok_minimum: number }
interface Gudang { id: string; nama: string }
interface StokItem { id: string; jumlah: number; barang_id: string; gudang_id: string; barang: Barang | null; gudang: { nama: string } | null }

export default function StokPage() {
  const [data, setData] = useState<StokItem[]>([])
  const [gudangList, setGudangList] = useState<Gudang[]>([])
  const [loading, setLoading] = useState(true)
  const [filterGudang, setFilterGudang] = useState('')
  const [filterBarang, setFilterBarang] = useState('')
  const [filterLowOnly, setFilterLowOnly] = useState(false)

  useEffect(() => {
    Promise.all([
      apiFetch<StokItem[]>('/api/v1/stok').then(r => setData(r.data ?? [])).catch(() => {}),
      apiFetch<Gudang[]>('/api/v1/master/gudang').then(r => setGudangList(r.data ?? [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = data
    if (filterGudang) result = result.filter(i => i.gudang_id === filterGudang)
    if (filterBarang) {
      const q = filterBarang.toLowerCase()
      result = result.filter(i => {
        const b = i.barang
        return b?.nama.toLowerCase().includes(q) || b?.kode.toLowerCase().includes(q)
      })
    }
    if (filterLowOnly) result = result.filter(i => i.jumlah <= (i.barang?.stok_minimum ?? 0))
    return result
  }, [data, filterGudang, filterBarang, filterLowOnly])

  const handleExport = () => {
    const rows = [['Barang', 'Kode', 'Gudang', 'Jumlah', 'Status'].join(',')]
    filtered.forEach(i => {
      const b = i.barang
      const status = i.jumlah <= (b?.stok_minimum ?? 0) ? 'Stok Minimum' : 'Aman'
      rows.push([b?.nama ?? '', b?.kode ?? '', i.gudang?.nama ?? '', String(i.jumlah), status].join(','))
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'stok-barang.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Data stok diexport!')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Stok Barang</h1><p className="text-muted-foreground mt-1">Saldo stok saat ini</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          <Button variant="outline" asChild><Link href="/dashboard/inventory/stok/masuk"><Plus className="h-4 w-4 mr-2" />Stok Masuk</Link></Button>
          <Button variant="outline" asChild><Link href="/dashboard/inventory/stok/keluar"><Minus className="h-4 w-4 mr-2" />Stok Keluar</Link></Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari barang..." value={filterBarang} onChange={e => setFilterBarang(e.target.value)} className="pl-9" />
            </div>
            <select
              value={filterGudang}
              onChange={e => setFilterGudang(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[160px]"
            >
              <option value="">Semua Gudang</option>
              {gudangList.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={filterLowOnly} onChange={e => setFilterLowOnly(e.target.checked)} className="rounded border-input" />
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Stok Minimum Saja
            </label>
          </div>
        </CardContent>
      </Card>

      {loading ? <TableSkeleton rows={5} cols={4} actionsCols={1} /> :
      !filtered.length ? <div className="text-center py-12 border rounded-lg bg-card">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{data.length ? 'Tidak ada hasil filter.' : 'Belum ada stok tercatat.'}</p>
        {!data.length && <Button asChild className="mt-4"><Link href="/dashboard/inventory/stok/masuk">Catat Stok Masuk</Link></Button>}
      </div> :
      <div className="rounded-lg border bg-card">
        <div className="p-3 border-b bg-muted/30 text-xs text-muted-foreground">Menampilkan {filtered.length} dari {data.length} item</div>
        <Table><TableHeader><TableRow>
          <TableHead>Barang</TableHead>
          <TableHead>Gudang</TableHead>
          <TableHead className="text-right">Jumlah</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow></TableHeader><TableBody>
          {filtered.map((item) => {
            const brg = item.barang
            const gdg = item.gudang
            const isLow = item.jumlah <= (brg?.stok_minimum ?? 0)
            return (
              <TableRow key={item.id}>
                <TableCell><div className="text-sm font-medium">{brg?.nama ?? '-'}</div><div className="text-xs text-muted-foreground">{brg?.kode} — {brg?.satuan}</div></TableCell>
                <TableCell>{gdg?.nama ?? '-'}</TableCell>
                <TableCell className={`text-right text-sm font-bold ${isLow ? 'text-destructive' : ''}`}>{item.jumlah}</TableCell>
                <TableCell>{isLow ? <Badge variant="destructive">Stok Minimum (min {brg?.stok_minimum})</Badge> : <Badge variant="success">Aman</Badge>}</TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/inventory/stok/kartu/${brg?.id}`}><FileText className="h-4 w-4" /></Link></Button></TableCell>
              </TableRow>
            )
          })}
        </TableBody></Table>
      </div>}
    </div>
  )
}
