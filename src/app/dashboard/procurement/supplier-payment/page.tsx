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
import { Search, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

interface SupplierPayment {
  id: string
  purchase_order_id: string
  supplier_id: string
  nominal: number
  tanggal_bayar: string
  metode: string
  bukti_transfer: string | null
  keterangan: string | null
  created_at: string
  supplier: { nama: string } | null
}

interface PO { id: string; nomor: string; supplier_id: string }
interface Supplier { id: string; nama: string }

export default function SupplierPaymentPage() {
  const [data, setData] = useState<SupplierPayment[]>([])
  const [poList, setPoList] = useState<PO[]>([])
  const [supplierList, setSupplierList] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ purchaseOrderId: '', supplierId: '', nominal: '', tanggalBayar: '', metode: 'transfer', buktiTransfer: '', keterangan: '' })

  useEffect(() => {
    Promise.all([
      apiFetch<SupplierPayment[]>('/api/v1/procurement/supplier-payment').then(r => setData(r.data ?? [])).catch(() => {}),
      apiFetch<PO[]>('/api/v1/procurement/purchase-order').then(r => setPoList(r.data ?? [])).catch(() => {}),
      apiFetch<Supplier[]>('/api/v1/master/supplier').then(r => setSupplierList(r.data ?? [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
  const rupiah = (v: number) => `Rp ${v.toLocaleString('id-ID')}`
  const filtered = data.filter(p => (p.supplier?.nama ?? '').toLowerCase().includes(search.toLowerCase()))

  const handleCreate = async () => {
    if (!form.purchaseOrderId || !form.supplierId || !form.nominal || !form.tanggalBayar) {
      toast.error('PO, supplier, nominal, dan tanggal bayar wajib diisi')
      return
    }
    try {
      const r = await apiFetch('/api/v1/procurement/supplier-payment', {
        method: 'POST',
        body: JSON.stringify({
          purchaseOrderId: form.purchaseOrderId,
          supplierId: form.supplierId,
          nominal: parseFloat(form.nominal),
          tanggalBayar: new Date(form.tanggalBayar).toISOString(),
          metode: form.metode,
          buktiTransfer: form.buktiTransfer || undefined,
          keterangan: form.keterangan || undefined,
        }),
      })
      if (r.data) setData(prev => [r.data as SupplierPayment, ...prev])
      setOpen(false)
      setForm({ purchaseOrderId: '', supplierId: '', nominal: '', tanggalBayar: '', metode: 'transfer', buktiTransfer: '', keterangan: '' })
      toast.success('Pembayaran berhasil dicatat')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mencatat pembayaran')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader title="Pembayaran Supplier" description="Catat pembayaran ke supplier" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><CreditCard className="h-4 w-4 mr-1" />Catat Pembayaran</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Pembayaran Baru</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Purchase Order</Label>
                <Select value={form.purchaseOrderId} onValueChange={(v) => {
                  const po = poList.find(p => p.id === v)
                  setForm(f => ({ ...f, purchaseOrderId: v, supplierId: po?.supplier_id ?? f.supplierId }))
                }}>
                  <SelectTrigger><SelectValue placeholder="Pilih PO" /></SelectTrigger>
                  <SelectContent>
                    {poList.map(p => <SelectItem key={p.id} value={p.id}>{p.nomor}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={form.supplierId} onValueChange={(v) => setForm(f => ({ ...f, supplierId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih supplier" /></SelectTrigger>
                  <SelectContent>
                    {supplierList.map(s => <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nominal</Label>
                  <Input type="number" value={form.nominal} onChange={(e) => setForm(f => ({ ...f, nominal: e.target.value }))} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Bayar</Label>
                  <Input type="date" value={form.tanggalBayar} onChange={(e) => setForm(f => ({ ...f, tanggalBayar: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Metode</Label>
                <Select value={form.metode} onValueChange={(v) => setForm(f => ({ ...f, metode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transfer Bank</SelectItem>
                    <SelectItem value="tunai">Tunai</SelectItem>
                    <SelectItem value="giro">Giro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link Bukti Transfer (opsional)</Label>
                <Input value={form.buktiTransfer} onChange={(e) => setForm(f => ({ ...f, buktiTransfer: e.target.value }))} placeholder="URL file bukti transfer" />
              </div>
              <div className="space-y-2">
                <Label>Keterangan (opsional)</Label>
                <Input value={form.keterangan} onChange={(e) => setForm(f => ({ ...f, keterangan: e.target.value }))} placeholder="Catatan" />
              </div>
              <Button onClick={handleCreate} className="w-full">Simpan Pembayaran</Button>
            </div>
          </DialogContent>
        </Dialog>
      } />

      <div className="relative w-60">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader><CardTitle>Riwayat Pembayaran</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Nominal</TableHead>
                    <TableHead>Tanggal Bayar</TableHead>
                    <TableHead>Metode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.supplier?.nama ?? '-'}</TableCell>
                      <TableCell className="font-bold">{rupiah(p.nominal)}</TableCell>
                      <TableCell>{formatDate(p.tanggal_bayar)}</TableCell>
                      <TableCell><Badge variant="outline">{p.metode}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Belum ada pembayaran</TableCell></TableRow>
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
