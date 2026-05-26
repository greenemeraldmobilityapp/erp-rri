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

export default async function RfqCustomerPage() {
  const { data: rfqData, error } = await supabase
    .from('rfq_customer')
    .select('*, customer!customer_id(nama, kode)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">RFQ Customer</h1>
          <p className="text-muted-foreground mt-1">Request for Quotation dari Customer</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/rfq-customer/tambah">
            <Plus className="h-4 w-4 mr-2" />
            Tambah RFQ Customer
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          Error loading data: {error.message}
        </div>
      ) : !rfqData || rfqData.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">Belum ada RFQ Customer. Silakan buat baru.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/rfq-customer/tambah">Buat RFQ Customer Pertama</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader><TableRow>
                <TableHead>Nomor</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow></TableHeader><TableBody>
              {rfqData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nomor}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-xs">{item.customer?.kode}</span>
                    <br />
                    {item.customer?.nama}
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
                        <Link href={`/dashboard/rfq-customer/${item.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Detail</span>
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
