import { supabase } from '@/lib/db/client'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

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
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Waktu</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Penerima</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Pesan</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 text-sm">
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {new Date(item.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 font-mono text-xs">{item.recipient}</td>
                  <td className="p-3 max-w-md truncate">{item.message}</td>
                  <td className="p-3">
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
