import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, FileText } from 'lucide-react'
export const dynamic = 'force-dynamic'

const s: Record<string, { label: string; v: 'secondary' | 'warning' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' }, sent: { label: 'Terkirim', v: 'warning' }, confirmed: { label: 'Dikonfirmasi', v: 'success' }, partial: { label: 'Parsial', v: 'outline' }, completed: { label: 'Selesai', v: 'outline' },
}

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: po, error } = await supabase.from('purchase_order').select('*, supplier!supplier_id(nama, kode)').eq('id', id).single()
  if (error || !po) return <div className="text-center py-20 text-muted-foreground">PO tidak ditemukan</div>
  const { data: items } = await supabase.from('purchase_order_item').select('*, barang!barang_id(nama, kode, satuan)').eq('purchase_order_id', id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard/purchase-order"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Detail PO</h1><p className="text-muted-foreground mt-1">{po.nomor}</p></div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Nomor</p>
              <p className="font-medium">{po.nomor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={s[po.status]?.v ?? 'outline'}>{s[po.status]?.label ?? po.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(po.tanggal).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Supplier</p>
              <p className="font-medium">{po.supplier?.nama} ({po.supplier?.kode})</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Terms of Payment</p>
              <p className="font-medium">{po.terms_of_payment ?? '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!!items?.length && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-4 w-4" />Item Barang</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barang</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.barang?.nama}</TableCell>
                    <TableCell className="text-muted-foreground">{item.barang?.kode}</TableCell>
                    <TableCell className="text-right">{item.jumlah}</TableCell>
                    <TableCell>{item.barang?.satuan}</TableCell>
                    <TableCell className="text-right">{item.harga_satuan?.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right">{(item.jumlah * item.harga_satuan).toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-right font-bold text-lg">
              Total: {items.reduce((sum: number, i) => sum + i.jumlah * i.harga_satuan, 0).toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
