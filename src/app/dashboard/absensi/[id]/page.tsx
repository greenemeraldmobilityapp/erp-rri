import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

const s: Record<string, { label: string; v: 'secondary' | 'warning' | 'success' | 'destructive' | 'outline' }> = {
  hadir: { label: 'Hadir', v: 'success' },
  sakit: { label: 'Sakit', v: 'warning' },
  izin: { label: 'Izin', v: 'secondary' },
  alpha: { label: 'Alpha', v: 'destructive' },
  cuti: { label: 'Cuti', v: 'outline' },
}

export default async function AbsensiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: absen, error } = await supabase.from('absensi').select('*, karyawan!karyawan_id(nama, nik)').eq('id', id).single()
  if (error || !absen) return <div className="text-center py-20 text-muted-foreground">Absensi tidak ditemukan</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard/absensi"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Detail Absensi</h1><p className="text-muted-foreground mt-1">Absensi karyawan</p></div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Karyawan</p>
              <p className="font-medium">{absen.karyawan?.nama} ({absen.karyawan?.nik})</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={s[absen.status]?.v ?? 'outline'}>{s[absen.status]?.label ?? absen.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(absen.tanggal).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Keterangan</p>
              <p className="font-medium">{absen.keterangan ?? '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
