"use client"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { PageHeader } from '@/components/page-header'
import { AgingChart } from '@/components/aging-chart'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

type Customer = { id: string; nama: string; kode: string }

type Invoice = {
  id: string
  nomor: string
  customer_id: string
  customer: Customer | null
  tanggal: string
  status: string
  top: string
}

type InvoiceItem = {
  invoice_id: string
  harga_satuan: number
  jumlah: number
  diskon: number | null
  ppn: number | null
  pph: number | null
}

type InvoicePayment = {
  invoice_id: string
  amount: number
}

const STATUS_MAP: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' | 'outline' }> = {
  sent: { label: 'Belum Dibayar', variant: 'warning' },
  partial: { label: 'Dibayar Sebagian', variant: 'warning' },
  overdue: { label: 'Overdue', variant: 'destructive' },
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'sent', label: 'Belum Dibayar' },
  { value: 'partial', label: 'Dibayar Sebagian' },
  { value: 'overdue', label: 'Overdue' },
]

const BUCKETS = [
  { label: '0-30 Hari', min: 0, max: 30, color: 'text-emerald-600' },
  { label: '31-60 Hari', min: 31, max: 60, color: 'text-yellow-600' },
  { label: '61-90 Hari', min: 61, max: 90, color: 'text-orange-600' },
  { label: '>90 Hari', min: 91, max: Infinity, color: 'text-red-600' },
]

export default function ArAgingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [payments, setPayments] = useState<InvoicePayment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')

  useEffect(() => {
    async function load() {
      const { data: inv } = await supabase
        .from('invoice')
        .select('*, customer!customer_id(nama, kode)')
        .in('status', ['sent', 'partial', 'overdue'])
        .order('tanggal', { ascending: true })

      const ids = (inv ?? []).map(i => i.id)

      const [{ data: it }, { data: pm }] = await Promise.all([
        ids.length
          ? supabase.from('invoice_item').select('invoice_id, harga_satuan, jumlah, diskon, ppn, pph').in('invoice_id', ids)
          : { data: [] as InvoiceItem[] },
        ids.length
          ? supabase.from('invoice_payment').select('invoice_id, amount').in('invoice_id', ids)
          : { data: [] as InvoicePayment[] },
      ])

      const { data: cust } = await supabase.from('customer').select('id, nama, kode').order('nama')

      setInvoices(inv ?? [])
      setItems(it ?? [])
      setPayments(pm ?? [])
      setCustomers(cust ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const totalsById = useMemo(() => {
    const t: Record<string, number> = {}
    for (const it of items) {
      const dpp = it.harga_satuan * it.jumlah - (it.diskon ?? 0)
      t[it.invoice_id] = (t[it.invoice_id] ?? 0) + dpp + (it.ppn ?? 0) - (it.pph ?? 0)
    }
    return t
  }, [items])

  const paidById = useMemo(() => {
    const p: Record<string, number> = {}
    for (const pm of payments) {
      p[pm.invoice_id] = (p[pm.invoice_id] ?? 0) + pm.amount
    }
    return p
  }, [payments])

  const enriched = useMemo(() => {
    let list = invoices.map(inv => ({
      ...inv,
      total: totalsById[inv.id] ?? 0,
      paid: paidById[inv.id] ?? 0,
      outstanding: (totalsById[inv.id] ?? 0) - (paidById[inv.id] ?? 0),
    }))

    if (statusFilter !== 'all') {
      list = list.filter(i => i.status === statusFilter)
    }
    if (customerFilter !== 'all') {
      list = list.filter(i => i.customer_id === customerFilter)
    }

    return list.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
  }, [invoices, totalsById, paidById, statusFilter, customerFilter])

  const now = useMemo(() => new Date(), [])

  const aging = useMemo(() =>
    BUCKETS.map(b => {
      const list = enriched.filter(i => {
        const d = Math.floor((now.getTime() - new Date(i.tanggal).getTime()) / (1000 * 60 * 60 * 24))
        return d >= b.min && d <= b.max
      })
      return {
        ...b,
        items: list,
        count: list.length,
        total: list.reduce((s, i) => s + i.total, 0),
        outstanding: list.reduce((s, i) => s + i.outstanding, 0),
      }
    }),
  [enriched, now])

  const grandTotal = aging.reduce((s, b) => s + b.total, 0)
  const grandOutstanding = aging.reduce((s, b) => s + b.outstanding, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="AR Aging" description="Piutang usaha berdasarkan umur" />
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Memuat data...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="AR Aging" description="Piutang usaha berdasarkan umur" />

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Customer</Label>
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Customer</SelectItem>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Grafik Aging</CardTitle>
            <p className="text-sm text-muted-foreground">
              Outstanding:{' '}
              <span className="font-semibold text-foreground">Rp {grandOutstanding.toLocaleString('id-ID')}</span>
              {' dari '}
              <span className="text-foreground">Rp {grandTotal.toLocaleString('id-ID')}</span>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {grandOutstanding > 0 ? (
            <AgingChart data={aging.map(b => ({ label: b.label, total: b.outstanding }))} formatCurrency />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada data piutang.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        {aging.map(b => (
          <Card key={b.label}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm ${b.color}`}>{b.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{b.count}</p>
              <p className="text-xs text-muted-foreground">faktur</p>
              {b.outstanding > 0 && (
                <p className="text-sm font-semibold mt-1">Rp {b.outstanding.toLocaleString('id-ID')}</p>
              )}
              {b.outstanding > 0 && b.total > b.outstanding && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  dari Rp {b.total.toLocaleString('id-ID')} ({(b.outstanding / b.total * 100).toFixed(0)}% tertagih)
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detail Piutang</CardTitle>
        </CardHeader>
        <CardContent>
          {!enriched.length ? (
            <p className="text-muted-foreground text-sm">Belum ada piutang.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Umur</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Dibayar</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map(inv => {
                  const umur = Math.floor((now.getTime() - new Date(inv.tanggal).getTime()) / (1000 * 60 * 60 * 24))
                  const st = STATUS_MAP[inv.status] ?? { label: inv.status, variant: 'outline' as const }
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/invoice/${inv.id}`} className="hover:underline">
                          {inv.nomor}
                        </Link>
                      </TableCell>
                      <TableCell>{inv.customer?.nama}</TableCell>
                      <TableCell>{new Date(inv.tanggal).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell className="text-right">{umur} hr</TableCell>
                      <TableCell className="text-right font-medium">
                        Rp {inv.total.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        {inv.paid > 0 ? `Rp ${inv.paid.toLocaleString('id-ID')}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className={inv.outstanding > 0 ? 'text-destructive' : 'text-emerald-600'}>
                          Rp {inv.outstanding.toLocaleString('id-ID')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
