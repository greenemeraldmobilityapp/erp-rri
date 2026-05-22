import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'

const statusLabel: Record<string, { label: string; variant: 'secondary' | 'warning' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Terkirim', variant: 'warning' },
  responded: { label: 'Direspon', variant: 'success' },
  closed: { label: 'Ditutup', variant: 'outline' },
}

export default async function RfqPage() {
  const { data: rfqData, error } = await supabase
    .from('rfq')
    .select('*, supplier!supplier_id(nama, kode)')
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
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nomor</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Supplier</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rfqData.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-sm font-medium">{item.nomor}</td>
                  <td className="p-3 text-sm">
                    <span className="text-muted-foreground text-xs">{item.supplier?.kode}</span>
                    <br />
                    {item.supplier?.nama}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(item.tanggal).toLocaleDateString('id-ID')}
                  </td>
                  <td className="p-3">
                    <Badge variant={statusLabel[item.status]?.variant ?? 'outline'}>
                      {statusLabel[item.status]?.label ?? item.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/rfq/${item.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
