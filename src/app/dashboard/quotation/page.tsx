import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Pencil, Download } from 'lucide-react'

const statusLabel: Record<string, { label: string; variant: 'secondary' | 'warning' | 'success' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Terkirim', variant: 'warning' },
  approved: { label: 'Disetujui', variant: 'success' },
  rejected: { label: 'Ditolak', variant: 'destructive' },
  closed: { label: 'Ditutup', variant: 'outline' },
}

export default async function QuotationPage() {
  const { data: qtnData, error } = await supabase
    .from('quotation')
    .select('*, customer!customer_id(nama, kode)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Quotation</h1>
          <p className="text-muted-foreground mt-1">Penawaran harga untuk customer</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/quotation/tambah">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Quotation
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          Error: {error.message}
        </div>
      ) : !qtnData || qtnData.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">Belum ada quotation.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/quotation/tambah">Buat Quotation Pertama</Link>
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
              {qtnData.map((item) => (
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
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/api/v1/quotation/${item.id}/pdf`} target="_blank">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download PDF</span>
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/quotation/${item.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
        </div>
      )}
    </div>
  )
}
