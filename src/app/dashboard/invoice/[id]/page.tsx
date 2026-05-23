import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, FileText, Pencil, Download, Eye, FileSpreadsheet } from 'lucide-react'

const payStatus: Record<string, { label: string; v: 'secondary' | 'warning' | 'success' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' },
  sent: { label: 'Belum Dibayar', v: 'warning' },
  partial: { label: 'Dibayar Sebagian', v: 'warning' },
  paid: { label: 'Lunas', v: 'success' },
  overdue: { label: 'Overdue', v: 'destructive' },
}

const paySteps = ['draft', 'sent', 'partial', 'paid']
const stepLabels = ['Draft', 'Dikirim', 'Partial', 'Lunas']

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: inv, error } = await supabase
    .from('invoice')
    .select('*, sales_order!sales_order_id(nomor), customer!customer_id(nama, kode)')
    .eq('id', id)
    .single()
  if (error || !inv) return <div className="text-center py-20 text-muted-foreground">Invoice tidak ditemukan</div>

  const { data: items } = await supabase
    .from('invoice_item')
    .select('*, barang!barang_id(nama, kode, satuan)')
    .eq('invoice_id', id)
    .order('created_at', { ascending: true })

  const currentIdx = paySteps.indexOf(inv.status)
  const isOverdue = inv.status === 'overdue'

  const totalDpp = (items ?? []).reduce((s, i) => s + (i.harga * i.jumlah - (i.diskon ?? 0)), 0)
  const totalPPN = (items ?? []).reduce((s, i) => s + (i.ppn ?? 0), 0)
  const totalPPh = (items ?? []).reduce((s, i) => s + (i.pph ?? 0), 0)
  const grandTotal = totalDpp + totalPPN - totalPPh

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/dashboard/invoice"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div><h1 className="text-3xl font-heading font-bold">Detail Invoice</h1><p className="text-muted-foreground mt-1">{inv.nomor}</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`/api/v1/invoice/${id}/pdf`} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />Preview PDF
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/api/v1/invoice/${id}/pdf`} download>
              <Download className="h-4 w-4 mr-2" />Download PDF
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/invoice/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />Edit
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Status Pembayaran</h3>
            {isOverdue ? (
              <Badge variant="destructive" className="text-sm px-4 py-1">Overdue</Badge>
            ) : (
              <Badge variant={payStatus[inv.status]?.v ?? 'outline'} className="text-sm px-4 py-1">
                {payStatus[inv.status]?.label ?? inv.status}
              </Badge>
            )}
          </div>
          {!isOverdue ? (
            <div className="flex items-center gap-0">
              {stepLabels.map((label, i) => {
                const done = i <= currentIdx
                const current = i === currentIdx
                return (
                  <div key={label} className="flex-1 flex flex-col items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 ${
                      done ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground/50'
                    } ${current ? 'ring-3 ring-primary/30' : ''}`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <p className={`text-xs mt-1.5 ${done ? 'font-medium text-foreground' : 'text-muted-foreground/50'}`}>{label}</p>
                    {i < stepLabels.length - 1 && (
                      <div className={`absolute mt-4 h-0.5 w-full left-1/2 top-0 ${done && i < currentIdx ? 'bg-primary' : 'bg-muted'}`}
                        style={{ width: 'calc(100% - 2rem)', marginLeft: '1rem' }} />
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-destructive">Invoice ini telah melewati jatuh tempo.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Informasi Invoice</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{inv.customer?.nama ?? '-'}</p>
              <p className="text-xs text-muted-foreground">{inv.customer?.kode ?? ''}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sales Order</p>
              <p className="font-medium">{inv.sales_order?.nomor ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(inv.tanggal).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">TOP</p>
              <p className="font-medium">{inv.top}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!!items?.length && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" />Item Barang</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Diskon</TableHead>
                  <TableHead className="text-right">DPP</TableHead>
                  <TableHead className="text-right">PPN</TableHead>
                  {totalPPh > 0 && <TableHead className="text-right">PPh</TableHead>}
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items ?? []).map((item, i) => {
                  const brg = item.barang as { nama: string; kode: string; satuan: string } | null
                  const dpp = item.harga * item.jumlah - (item.diskon ?? 0)
                  const subtotal = dpp + (item.ppn ?? 0) - (item.pph ?? 0)
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{brg?.nama ?? '-'}</div>
                        <div className="text-xs text-muted-foreground">{brg?.kode} — {brg?.satuan}</div>
                      </TableCell>
                      <TableCell className="text-right">{item.harga.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right">{item.jumlah}</TableCell>
                      <TableCell className="text-right">{(item.diskon ?? 0) > 0 ? item.diskon.toLocaleString('id-ID') : '-'}</TableCell>
                      <TableCell className="text-right">{dpp.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right">{(item.ppn ?? 0) > 0 ? item.ppn.toLocaleString('id-ID') : '-'}</TableCell>
                      {totalPPh > 0 && <TableCell className="text-right">{(item.pph ?? 0) > 0 ? item.pph.toLocaleString('id-ID') : '-'}</TableCell>}
                      <TableCell className="text-right font-medium">{subtotal.toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <div className="border-t mt-4 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-end items-center gap-8">
                <span className="text-muted-foreground">DPP</span>
                <span className="font-medium w-32 text-right">{totalDpp.toLocaleString('id-ID')}</span>
              </div>
              {totalPPN > 0 && (
                <div className="flex justify-end items-center gap-8">
                  <span className="text-muted-foreground">PPN {(inv.ppn_rate * 100).toFixed(0)}%</span>
                  <span className="font-medium w-32 text-right">{totalPPN.toLocaleString('id-ID')}</span>
                </div>
              )}
              {totalPPh > 0 && (
                <div className="flex justify-end items-center gap-8">
                  <span className="text-muted-foreground">PPh {inv.pph_rate ? `(${(inv.pph_rate * 100).toFixed(0)}%)` : ''}</span>
                  <span className="font-medium w-32 text-right">-{totalPPh.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-end items-center gap-8 border-t pt-2 mt-2">
                <span className="font-bold">Grand Total</span>
                <span className="font-bold text-lg w-32 text-right">{grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <a href={`/api/v1/invoice/${id}/pdf`} target="_blank" rel="noopener noreferrer">
            <FileText className="h-4 w-4 mr-2" />Cetak PDF
          </a>
        </Button>
        <Button asChild>
          <Link href={`/dashboard/invoice/${id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />Edit Invoice
          </Link>
        </Button>
      </div>
    </div>
  )
}
