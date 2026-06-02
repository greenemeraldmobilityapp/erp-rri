import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Truck, AlertTriangle, CheckCircle2, Camera } from 'lucide-react'
import { DOScanPanel } from '@/components/do-scan-panel'
import { DoDocuments } from '@/components/do-documents'
import { DOPhotoConfirmation } from '@/components/do-delivery-confirmation'
import { DOKendaraanSelect } from '@/components/do-kendaraan-select'
import { DOHeaderActions } from '@/components/do-header-actions'
import { DoDeliverySlip } from '@/components/do-delivery-slip'

const s: Record<string, { label: string; v: 'secondary' | 'warning' | 'success' | 'outline' | 'destructive' }> = {
  draft: { label: 'Draft', v: 'secondary' }, awaiting_pickup: { label: 'Siap Kirim', v: 'warning' }, dikirim: { label: 'Dikirim', v: 'success' }, selesai: { label: 'Selesai', v: 'outline' }, ditolak: { label: 'Ditolak', v: 'destructive' },
}

type SalesOrderWithPIC = {
  nomor: string
  di?: {
    customer_pic?: { nama: string; jabatan: string }
  } | null
}

export default async function DeliveryOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: doDoc, error } = await supabase.from('delivery_order').select('*, sales_order!sales_order_id(nomor, di(customer_pic(nama, jabatan))), kendaraan!kendaraan_id(nama, no_polisi)').eq('id', id).single()
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
        <div className="flex-1"><h1 className="text-3xl font-heading font-bold">Detail DO</h1><p className="text-muted-foreground mt-1">{doDoc.nomor}</p></div>
        <DOHeaderActions doId={id} nomor={doDoc.nomor} />
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
            <div>
              <p className="text-sm text-muted-foreground">Kendaraan</p>
              <p className="font-medium">{doDoc.kendaraan ? `${doDoc.kendaraan.nama} (${doDoc.kendaraan.no_polisi})` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PIC Customer</p>
              <p className="font-medium">{((doDoc.sales_order as SalesOrderWithPIC | null | undefined)?.di?.customer_pic?.nama) ?? '-'}{((doDoc.sales_order as SalesOrderWithPIC | null | undefined)?.di?.customer_pic?.jabatan) ? ` - ${(doDoc.sales_order as SalesOrderWithPIC | null | undefined)?.di?.customer_pic?.jabatan}` : ''}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Keterangan</p>
              <p className="font-medium">{doDoc.keterangan ?? '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DOKendaraanSelect doId={doDoc.id} currentKendaraanId={doDoc.kendaraan_id} />

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
                    <TableCell className="font-medium">{item.nama_barang ?? item.barang?.nama}</TableCell>
                    <TableCell className="text-muted-foreground">{item.kode_barang ?? item.barang?.kode}</TableCell>
                    <TableCell className="text-right">{item.jumlah}</TableCell>
                    <TableCell>{item.satuan ?? item.barang?.satuan}</TableCell>
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
        initialVerifiedIds={(items ?? []).filter(i => i.scanned_at).map(i => i.id)}
      />

      <DoDeliverySlip
        doId={doDoc.id}
        status={doDoc.status}
        existingNomor={doDoc.delivery_slip_nomor}
        existingFileUrl={doDoc.delivery_slip_file_url}
      />

      <DOPhotoConfirmation
        doId={doDoc.id}
        status={doDoc.status}
        existingFotoBarang={doDoc.foto_barang_diterima_url}
        existingFotoSuratJalan={doDoc.foto_surat_jalan_url}
      />

      {(doDoc.foto_barang_diterima_url || doDoc.foto_surat_jalan_url) && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Camera className="h-4 w-4" />Foto Verifikasi Pengiriman</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doDoc.foto_barang_diterima_url && (
                <div>
                  <p className="text-sm font-medium mb-2">Foto Barang Diterima</p>
                  <a href={doDoc.foto_barang_diterima_url} target="_blank" rel="noopener noreferrer">
                    <img src={doDoc.foto_barang_diterima_url} alt="Foto Barang Diterima" className="w-full h-48 object-cover rounded-md border" />
                  </a>
                </div>
              )}
              {doDoc.foto_surat_jalan_url && (
                <div>
                  <p className="text-sm font-medium mb-2">Foto Surat Jalan</p>
                  <a href={doDoc.foto_surat_jalan_url} target="_blank" rel="noopener noreferrer">
                    <img src={doDoc.foto_surat_jalan_url} alt="Foto Surat Jalan" className="w-full h-48 object-cover rounded-md border" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Lampiran</h3>
          <DoDocuments doId={doDoc.id} />
        </CardContent>
      </Card>
    </div>
  )
}
