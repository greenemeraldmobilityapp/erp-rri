import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Pencil, Eye } from 'lucide-react'

const statusLabel: Record<string, { label: string; variant: 'secondary' | 'warning' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Terkirim', variant: 'warning' },
  responded: { label: 'Direspon', variant: 'success' },
  closed: { label: 'Ditutup', variant: 'outline' },
}

export default async function RfqPage() {
  const { data: rfqData, error } = await supabase
    .from('rfq_supplier')
    .select('*, supplier!supplier_id(nama, kode), sales_order!sales_order_id(id, nomor)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">RFQ</h1>
          <p className="text-muted-foreground mt-1">Request for Quotation — daftar permintaan penawaran ke supplier</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/rfq/tambah">
            <Plus className="h-4 w-4 mr-2" />
            Tambah RFQ
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          Error loading data: {error.message}
        </div>
      ) : !rfqData || rfqData.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">Belum ada RFQ. Silakan buat RFQ baru.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/rfq/tambah">Buat RFQ Pertama</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader><TableRow>
                <TableHead>Nomor</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Ref. SO</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow></TableHeader><TableBody>
              {rfqData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nomor}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-xs">{item.supplier?.kode}</span>
                    <br />
                    {item.supplier?.nama}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {item.sales_order?.nomor ?? '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.tanggal).toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabel[item.status]?.variant ?? 'outline'}>
                      {statusLabel[item.status]?.label ?? item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/rfq/${item.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Detail</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/rfq/${item.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
        </div>
      )}
    </div>
  )
}
