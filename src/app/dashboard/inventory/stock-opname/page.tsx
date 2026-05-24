"use client"
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { Search, ClipboardCheck } from 'lucide-react'
import { toast } from 'sonner'

interface StockOpname {
  id: string
  nomor: string
  gudang_id: string | null
  petugas: string
  status: string
  keterangan: string | null
  created_at: string
}

interface Gudang { id: string; nama: string }

const statusColor: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  selesai: 'default',
  dibatalkan: 'destructive',
}

const statusLabel: Record<string, string> = { draft: 'Draft', selesai: 'Selesai', dibatalkan: 'Dibatalkan' }

export default function StockOpnamePage() {
  const [data, setData] = useState<StockOpname[]>([])
  const [gudangList, setGudangList] = useState<Gudang[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [petugas, setPetugas] = useState('')
  const [gudangId, setGudangId] = useState('')

  useEffect(() => {
    Promise.all([
      apiFetch<StockOpname[]>('/api/v1/inventory/stock-opname').then(r => setData(r.data ?? [])).catch(() => {}),
      apiFetch<Gudang[]>('/api/v1/master/gudang').then(r => setGudangList(r.data ?? [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const filtered = data.filter(s =>
    s.nomor.toLowerCase().includes(search.toLowerCase()) ||
    s.petugas.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!petugas.trim()) { toast.error('Nama petugas wajib diisi'); return }
    try {
      const r = await apiFetch<StockOpname>('/api/v1/inventory/stock-opname', {
        method: 'POST',
        body: JSON.stringify({
          nomor: `SO/${String(new Date().getFullYear()).slice(-2)}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(data.length + 1).padStart(4, '0')}`,
          petugas,
          gudangId: gudangId || undefined,
        }),
      })
      if (r.data) setData(prev => [r.data, ...prev])
      setOpen(false)
      setPetugas('')
      setGudangId('')
      toast.success('Sesi opname berhasil dibuat')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat sesi')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader title="Stock Opname" description="Opname stok fisik dan hitung selisih" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><ClipboardCheck className="h-4 w-4 mr-1" />Buat Sesi Opname</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Sesi Opname Baru</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Petugas</Label>
                <Input value={petugas} onChange={(e) => setPetugas(e.target.value)} placeholder="Nama petugas opname" />
              </div>
              <div className="space-y-2">
                <Label>Gudang (opsional)</Label>
                <Select value={gudangId} onValueChange={setGudangId}>
                  <SelectTrigger><SelectValue placeholder="Semua gudang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Semua gudang</SelectItem>
                    {gudangList.map(g => <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Buat Sesi</Button>
            </div>
          </DialogContent>
        </Dialog>
      } />

      <div className="relative w-60">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari sesi opname..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader><CardTitle>Riwayat Opname</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor</TableHead>
                    <TableHead>Petugas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.nomor}</TableCell>
                      <TableCell>{s.petugas}</TableCell>
                      <TableCell><Badge variant={statusColor[s.status] ?? 'secondary'}>{statusLabel[s.status] ?? s.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(s.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Belum ada sesi opname</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
