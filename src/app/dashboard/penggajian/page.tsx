import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Pencil, FileText } from 'lucide-react'
import { ExportButton } from "@/components/export-button"
export const dynamic = 'force-dynamic'

const s: Record<string, { label: string; v: 'secondary' | 'success' | 'warning' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' }, paid: { label: 'Dibayar', v: 'success' }, pending: { label: 'Pending', v: 'warning' },
}

export default async function PenggajianPage() {
  const { data, error } = await supabase.from('penggajian').select('*, karyawan!karyawan_id(nama, nik)').order('created_at', { ascending: false })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-heading font-bold">Penggajian</h1><p className="text-muted-foreground mt-1">Pengelolaan gaji karyawan</p></div>
        <ExportButton table="penggajian" />
        <Button asChild><Link href="/dashboard/penggajian/tambah"><Plus className="h-4 w-4 mr-2" />Tambah Penggajian</Link></Button>
      </div>
      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div> :
      !data?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada data penggajian.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/penggajian/tambah">Input Gaji Pertama</Link></Button></div> :
      <div className="rounded-lg border bg-card"><Table><TableHeader><TableRow>
        <TableHead>Nomor</TableHead>
        <TableHead>Karyawan</TableHead>
        <TableHead>Periode</TableHead>
        <TableHead>Gaji Bersih</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Aksi</TableHead>
      </TableRow></TableHeader><TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium"><Link href={`/dashboard/penggajian/${item.id}`} className="hover:underline">{item.nomor}</Link></TableCell>
            <TableCell>{item.karyawan?.nama}</TableCell>
            <TableCell>{item.bulan}/{item.tahun}</TableCell>
            <TableCell className="font-bold">Rp {(item.gaji_bersih ?? 0).toLocaleString('id-ID')}</TableCell>
            <TableCell><Badge variant={s[item.status]?.v ?? 'outline'}>{s[item.status]?.label ?? item.status}</Badge></TableCell>
            <TableCell className="text-right space-x-1">
              <Button variant="ghost" size="sm" asChild><Link href={`/dashboard/penggajian/${item.id}/slip-gaji`}><FileText className="h-4 w-4" /></Link></Button>
              <Button variant="ghost" size="sm" asChild><Link href={`/dashboard/penggajian/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody></Table></div>}
    </div>
  )
}
