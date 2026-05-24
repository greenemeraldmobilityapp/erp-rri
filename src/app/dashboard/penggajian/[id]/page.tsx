import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Calculator } from 'lucide-react'

const s: Record<string, { label: string; v: 'secondary' | 'success' | 'warning' | 'outline' }> = {
  draft: { label: 'Draft', v: 'secondary' }, paid: { label: 'Dibayar', v: 'success' }, pending: { label: 'Pending', v: 'warning' },
}

const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default async function PenggajianDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: gaji, error } = await supabase.from('penggajian').select('*, karyawan!karyawan_id(nama, nik)').eq('id', id).single()
  if (error || !gaji) return <div className="text-center py-20 text-muted-foreground">Penggajian tidak ditemukan</div>

  const periode = `${bulanNama[gaji.bulan - 1]} ${gaji.tahun}`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard/penggajian"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Detail Penggajian</h1><p className="text-muted-foreground mt-1">{gaji.nomor}</p></div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Nomor</p>
              <p className="font-medium">{gaji.nomor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={s[gaji.status]?.v ?? 'outline'}>{s[gaji.status]?.label ?? gaji.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Karyawan</p>
              <p className="font-medium">{gaji.karyawan?.nama} ({gaji.karyawan?.nik})</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Periode</p>
              <p className="font-medium">{periode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gaji Pokok</p>
              <p className="font-medium">Rp {gaji.gajiPokok.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tunjangan</p>
              <p className="font-medium">Rp {(gaji.tunjangan ?? 0).toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Potongan</p>
              <p className="font-medium">Rp {(gaji.potongan ?? 0).toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gaji Bersih</p>
              <p className="font-medium text-lg font-bold">Rp {gaji.gajiBersih.toLocaleString('id-ID')}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Keterangan</p>
              <p className="font-medium">{gaji.keterangan ?? '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
