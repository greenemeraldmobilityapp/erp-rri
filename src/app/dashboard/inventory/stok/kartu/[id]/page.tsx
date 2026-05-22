import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package } from 'lucide-react'

const tipeStyle: Record<string, 'success' | 'destructive' | 'warning'> = { masuk: 'success', keluar: 'destructive', opname: 'warning' }
const tipeLabel: Record<string, string> = { masuk: 'Masuk', keluar: 'Keluar', opname: 'Opname' }

export default async function KartuStokPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: barang } = await supabase.from('barang').select('id, nama, kode, satuan').eq('id', id).single()
  if (!barang) return <div className="text-center py-20 text-muted-foreground">Barang tidak ditemukan</div>
  const { data: mutasi } = await supabase.from('stok_mutasi').select('*').eq('barang_id', id).order('created_at', { ascending: false })
  const { data: stokNow } = await supabase.from('stok').select('jumlah').eq('barang_id', id).maybeSingle()
  const saldo = stokNow?.jumlah ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard/inventory/stok"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Kartu Stok</h1><p className="text-muted-foreground mt-1">Riwayat pergerakan stok</p></div>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-4">
          <Package className="h-10 w-10 text-primary" />
          <div><h2 className="text-xl font-bold">{barang.nama}</h2><p className="text-sm text-muted-foreground">{barang.kode} — {barang.satuan}</p></div>
          <div className="ml-auto text-right"><p className="text-sm text-muted-foreground">Saldo Saat Ini</p><p className="text-2xl font-bold">{saldo}</p></div>
        </div>
      </div>
      {!mutasi?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada riwayat mutasi.</p></div> :
      <div className="rounded-lg border bg-card"><table className="w-full"><thead><tr className="border-b bg-muted/50">
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Tanggal</th>
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Tipe</th>
        <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase">Masuk</th>
        <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase">Keluar</th>
        <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase">Saldo</th>
        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Keterangan</th>
      </tr></thead><tbody className="divide-y">
        {mutasi.map((m: Record<string, unknown>) => (
          <tr key={m.id as string} className="hover:bg-muted/30">
            <td className="p-3 text-sm">{new Date(m.created_at as string).toLocaleDateString('id-ID')}</td>
            <td className="p-3"><Badge variant={tipeStyle[m.tipe as string] ?? 'outline'}>{tipeLabel[m.tipe as string] ?? m.tipe as string}</Badge></td>
            <td className="p-3 text-right text-sm">{m.tipe === 'masuk' ? m.jumlah as number : '-'}</td>
            <td className="p-3 text-right text-sm">{m.tipe === 'keluar' ? m.jumlah as number : '-'}</td>
            <td className="p-3 text-right text-sm font-bold">{m.saldo_sesudah as number}</td>
            <td className="p-3 text-sm text-muted-foreground">{m.keterangan as string ?? '-'}</td>
          </tr>
        ))}
      </tbody></table></div>}
    </div>
  )
}
