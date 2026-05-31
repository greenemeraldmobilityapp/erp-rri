import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Truck, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { DOScanPanel } from '@/components/do-scan-panel'
import { DoDocuments } from '@/components/do-documents'

const s: Record<string, { label: string; v: 'secondary' | 'warning' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' }, awaiting_pickup: { label: 'Siap Kirim', v: 'warning' }, dikirim: { label: 'Dikirim', v: 'success' }, selesai: { label: 'Selesai', v: 'outline' },
}

export default async function DeliveryOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: doDoc, error } = await supabase.from('delivery_order').select('*, sales_order!sales_order_id(nomor)').eq('id', id).single()
  if (error || !doDoc) return <div className="text-center py-20 text-muted-foreground">DO tidak ditemukan</div>
  const { data: items } = await supabase.from('delivery_order_item').select('*, barang!barang_id(nama, kode, satuan, barcode, image_url)').eq('delivery_order_id', id)

  const dueDate = doDoc.waktu_pengiriman
    ? (() => {
        const d = new Date(doDoc.tanggal)
        d.setDate(d.getDate() + doDoc.waktu_pengiriman)
        return d
      })()
    : null

  const daysUntilDue = dueDate
    ? Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard/delivery-order"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Detail DO</h1><p className="text-muted-foreground mt-1">{doDoc.nomor}</p></div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Nomor</p>
              <p className="font-medium">{doDoc.nomor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={s[doDoc.status]?.v ?? 'outline'}>{s[doDoc.status]?.label ?? doDoc.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(doDoc.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SO Reference</p>
              <p className="font-medium">{doDoc.sales_order?.nomor ?? '-'}</p>
            </div>
            {doDoc.waktu_pengiriman != null && (
              <div>
                <p className="text-sm text-muted-foreground">Waktu Pengiriman</p>
                <p className="font-medium">{doDoc.waktu_pengiriman} hari</p>
              </div>
            )}
            {dueDate && (
              <div>
                <p className="text-sm text-muted-foreground">Estimasi Batas Kirim</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {dueDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  {daysUntilDue != null && daysUntilDue < 0 ? (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Terlambat {-daysUntilDue} hari
                    </Badge>
                  ) : daysUntilDue != null && daysUntilDue <= 1 ? (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> H-{daysUntilDue}
                    </Badge>
                  ) : daysUntilDue != null && daysUntilDue > 1 ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> H-{daysUntilDue}
                    </Badge>
                  ) : null}
                </div>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Keterangan</p>
              <p className="font-medium">{doDoc.keterangan ?? '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!!items?.length && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Truck className="h-4 w-4" />Item Barang</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Picture</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.barang?.image_url ? (
                        <img src={item.barang.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">-</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.barang?.nama}</TableCell>
                    <TableCell className="text-muted-foreground">{item.barang?.kode}</TableCell>
                    <TableCell className="text-right">{item.jumlah}</TableCell>
                    <TableCell>{item.barang?.satuan}</TableCell>
                    <TableCell className="text-muted-foreground">{item.keterangan ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <DOScanPanel
        doId={doDoc.id}
        doNomor={doDoc.nomor}
        items={items ?? []}
      />

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Lampiran</h3>
          <DoDocuments doId={doDoc.id} />
        </CardContent>
      </Card>
    </div>
  )
}
