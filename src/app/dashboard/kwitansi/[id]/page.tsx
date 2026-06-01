"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Pencil, Download, FileText, Loader2 } from 'lucide-react'

const statusMap: Record<string, { label: string; variant: 'secondary' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  completed: { label: 'Selesai', variant: 'success' },
}

export default function KwitansiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('')
  const [data, setData] = useState<{
    id: string
    nomor: string
    invoice: { nomor: string } | null
    tanggal: string
    status: string
    keterangan: string | null
    items: Array<{
      id: string
      invoice_item_id: string
      jumlah: number
      invoice_item: { barang_id: string; harga_satuan: number }
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    apiFetch<typeof data>(`/api/v1/kwitansi/${id}`)
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2" />Memuat...</div>
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/dashboard/kwitansi"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div><h1 className="text-3xl font-heading font-bold">Kwitansi</h1></div>
        </div>
        <Card><CardContent className="py-12 text-center text-muted-foreground">Kwitansi tidak ditemukan.</CardContent></Card>
      </div>
    )
  }

  const totalItems = data.items.reduce((sum, i) => sum + i.jumlah, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/dashboard/kwitansi"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-heading font-bold">{data.nomor}</h1>
              <Badge variant={statusMap[data.status]?.variant ?? 'outline'}>
                {statusMap[data.status]?.label ?? data.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">Tanda terima pembayaran</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/v1/kwitansi/${id}/pdf`} target="_blank"><Download className="h-4 w-4 mr-2" />PDF</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/kwitansi/${id}/edit`}><Pencil className="h-4 w-4 mr-2" />Edit</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Ref</p>
              <p className="font-medium">{data.invoice?.nomor ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(data.tanggal).toLocaleDateString('id-ID')}</p>
            </div>
            {data.keterangan && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Keterangan</p>
                <p className="font-medium">{data.keterangan}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {data.items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-4 w-4" />Item Kwitansi</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Invoice Item ID</TableHead>
                  <TableHead className="text-right">Jumlah (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item, i) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{item.invoice_item?.barang_id ?? item.invoice_item_id}</TableCell>
                    <TableCell className="text-right font-medium">{item.jumlah.toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4 pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Item</p>
                <p className="text-lg font-bold">{totalItems.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
