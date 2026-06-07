import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, FileText } from 'lucide-react'
export const dynamic = 'force-dynamic'

const s: Record<string, { label: string; v: 'secondary' | 'warning' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' }, approved: { label: 'Disetujui', v: 'success' }, rejected: { label: 'Ditolak', v: 'outline' }, ordered: { label: 'Sudah diPO', v: 'warning' },
}

export default async function PurchaseRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: pr, error } = await supabase.from('purchase_request').select('*, sales_order!sales_order_id(nomor)').eq('id', id).single()
  if (error || !pr) return <div className="text-center py-20 text-muted-foreground">PR tidak ditemukan</div>
  const { data: items } = await supabase.from('purchase_request_item').select('*, barang!barang_id(nama, kode, satuan)').eq('purchase_request_id', id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard/purchase-request"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Detail PR</h1><p className="text-muted-foreground mt-1">{pr.nomor}</p></div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Nomor</p>
              <p className="font-medium">{pr.nomor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={s[pr.status]?.v ?? 'outline'}>{s[pr.status]?.label ?? pr.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(pr.tanggal).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SO Reference</p>
              <p className="font-medium">{pr.sales_order?.nomor ?? '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Keterangan</p>
              <p className="font-medium">{pr.keterangan ?? '-'}</p>
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
