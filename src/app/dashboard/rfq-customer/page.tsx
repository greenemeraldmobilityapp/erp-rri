"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Customer {
  id: string
  nama: string
  kode: string
}

interface RfqCustomer {
  id: string
  nomor: string
  customer_id: string
  nomor_rfq_customer: string | null
  tanggal: string
  status: string
  customer: Customer | null
}

const statusLabel: Record<string, { label: string; variant: 'secondary' | 'warning' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Terkirim', variant: 'warning' },
  responded: { label: 'Direspon', variant: 'success' },
  closed: { label: 'Ditutup', variant: 'outline' },
}

export default function RfqCustomerPage() {
  const [data, setData] = useState<RfqCustomer[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = () => apiFetch<RfqCustomer[]>('/api/v1/rfq-customer')
    .then((res) => setData(res.data ?? []))
    .catch(() => toast.error('Gagal memuat data'))

  useEffect(() => {
    loadData().finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string, nomor: string) => {
    try {
      await apiFetch(`/api/v1/rfq-customer/${id}`, { method: 'DELETE' })
      toast.success(`RFQ ${nomor} berhasil dihapus`)
      loadData()
    } catch {
      toast.error('Gagal menghapus RFQ')
    }
  }

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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">Belum ada RFQ Customer. Silakan buat baru.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/rfq-customer/tambah">Buat RFQ Customer Pertama</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor</TableHead>
                <TableHead>Nomor RFQ Customer</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nomor}</TableCell>
                  <TableCell className="text-muted-foreground">{item.nomor_rfq_customer || '-'}</TableCell>
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
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/rfq-customer/${item.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <DeleteConfirmationDialog
                        onConfirm={() => handleDelete(item.id, item.nomor)}
                        itemName={`RFQ Customer ${item.nomor}`}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Hapus</span>
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
