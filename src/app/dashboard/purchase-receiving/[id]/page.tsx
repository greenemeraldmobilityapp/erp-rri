import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Package } from 'lucide-react'
export const dynamic = 'force-dynamic'

const s: Record<string, { label: string; v: 'secondary' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' }, completed: { label: 'Selesai', v: 'success' },
}

export default async function ReceivingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: recv, error } = await supabase.from('purchase_receiving').select('*, purchase_order!purchase_order_id(nomor)').eq('id', id).single()
  if (error || !recv) return <div className="text-center py-20 text-muted-foreground">Receiving tidak ditemukan</div>
  const { data: items } = await supabase.from('purchase_receiving_item').select('*, barang!barang_id(nama, kode, satuan)').eq('purchase_receiving_id', id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard/purchase-receiving"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Detail Receiving</h1><p className="text-muted-foreground mt-1">{recv.nomor}</p></div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Nomor</p>
              <p className="font-medium">{recv.nomor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={s[recv.status]?.v ?? 'outline'}>{s[recv.status]?.label ?? recv.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(recv.tanggal).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PO Reference</p>
              <p className="font-medium">{recv.purchase_order?.nomor ?? '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Keterangan</p>
              <p className="font-medium">{recv.keterangan ?? '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!!items?.length && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package className="h-4 w-4" />Item Barang</h3>
            <Table>
              <TableHeader>
                <TableRow>
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
    </div>
  )
}
