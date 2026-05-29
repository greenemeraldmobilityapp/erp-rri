import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { supabase } from '@/lib/db/client'
import { formatDateTime } from '@/lib/utils/date'

export default async function AuditLogPage() {
  const { data, error } = await supabase.from('audit_log').select('*, users!user_id(email)').order('created_at', { ascending: false }).limit(100)
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">Audit Trail</h1><p className="text-muted-foreground mt-1">Riwayat perubahan data</p></div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada aktivitas.</p></div> :
      <div className="rounded-lg border bg-card"><Table><TableHeader><TableRow>
        <TableHead>Waktu</TableHead>
        <TableHead>User</TableHead>
        <TableHead>Aksi</TableHead>
        <TableHead>Tabel</TableHead>
        <TableHead>Record ID</TableHead>
      </TableRow></TableHeader><TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="text-muted-foreground">{formatDateTime(item.created_at)}</TableCell>
            <TableCell>{item.users?.email ?? '-'}</TableCell>
            <TableCell><span className={`font-medium ${item.action === 'CREATE' ? 'text-emerald-600' : item.action === 'DELETE' ? 'text-red-600' : 'text-amber-600'}`}>{item.action}</span></TableCell>
            <TableCell className="font-mono text-xs">{item.table_name}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{item.record_id}</TableCell>
          </TableRow>
        ))}
      </TableBody></Table></div>}
    </div>
  )
}
