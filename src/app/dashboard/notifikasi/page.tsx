import { supabase } from '@/lib/db/client'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/date'

export default async function NotifikasiPage() {
  const { data, error } = await supabase
    .from('whatsapp_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Notifikasi WhatsApp</h1>
        <p className="text-muted-foreground mt-1">Riwayat pengiriman notifikasi WhatsApp</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error.message}
        </div>
      ) : !data?.length ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">Belum ada notifikasi terkirim.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader><TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead>Pesan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow></TableHeader><TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDateTime(item.created_at)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.recipient}</TableCell>
                  <TableCell className="max-w-md truncate">{item.message}</TableCell>
                  <TableCell>
                    {item.status === 'sent' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle className="h-3.5 w-3.5" /> Terkirim
                      </span>
                    ) : item.status === 'delivered' ? (
                      <span className="inline-flex items-center gap-1 text-blue-600">
                        <Clock className="h-3.5 w-3.5" /> Terkirim
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <XCircle className="h-3.5 w-3.5" /> Gagal
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
        </div>
      )}
    </div>
  )
}
