import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { formatDateTime, formatDateShort } from '@/lib/utils/date'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Package, ArrowDown, ArrowUp, RotateCcw } from 'lucide-react'

const tipeStyle: Record<string, 'success' | 'destructive' | 'warning' | 'outline'> = { masuk: 'success', keluar: 'destructive', opname: 'warning' }
const tipeLabel: Record<string, string> = { masuk: 'Masuk', keluar: 'Keluar', opname: 'Opname' }
const tipeIcon: Record<string, typeof ArrowUp> = { masuk: ArrowUp, keluar: ArrowDown, opname: RotateCcw }

export default async function KartuStokPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: barang } = await supabase.from('barang').select('id, nama, kode, satuan, stok_minimum').eq('id', id).single()
  if (!barang) return <div className="text-center py-20 text-muted-foreground">Barang tidak ditemukan</div>
  const { data: mutasi } = await supabase.from('stok_mutasi').select('*').eq('barang_id', id).order('created_at', { ascending: false })
  const { data: stokNow } = await supabase.from('stok').select('jumlah').eq('barang_id', id).maybeSingle()
  const saldo = stokNow?.jumlah ?? 0
  const isLow = saldo <= (barang.stok_minimum ?? 0)

  const mutasiAsc = [...(mutasi ?? [])].reverse()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard/inventory/stok"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Kartu Stok</h1><p className="text-muted-foreground mt-1">Riwayat pergerakan stok — {barang.nama}</p></div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Package className="h-10 w-10 text-primary" />
            <div><h2 className="text-xl font-bold">{barang.nama}</h2><p className="text-sm text-muted-foreground">{barang.kode} — {barang.satuan}</p></div>
            <div className="ml-auto text-right">
              <p className="text-sm text-muted-foreground">Saldo Saat Ini</p>
              <p className={`text-2xl font-bold ${isLow ? 'text-destructive' : ''}`}>{saldo}</p>
              {isLow && <Badge variant="destructive" className="mt-1">Stok Minimum ({barang.stok_minimum})</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {!mutasi?.length ? <div className="text-center py-12 border rounded-lg bg-card"><p className="text-muted-foreground">Belum ada riwayat mutasi.</p></div> :
      <div className="space-y-0">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <ArrowDown className="h-4 w-4 text-red-600" />
              Timeline Pergerakan Stok
            </h3>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-0 divide-y">
                {mutasiAsc.map((m) => {
                  const TIcon = tipeIcon[m.tipe as string] ?? RotateCcw
                  const isMasuk = m.tipe === 'masuk'
                  const isKeluar = m.tipe === 'keluar'
                  return (
                    <div key={m.id as string} className="relative flex items-start gap-4 py-4">
                      <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                        isMasuk ? 'border-green-200 bg-green-50' : isKeluar ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                      }`}>
                        <TIcon className={`h-4 w-4 ${isMasuk ? 'text-green-600' : isKeluar ? 'text-red-600' : 'text-amber-600'}`} />
                      </div>
                      <div className="min-w-0 flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={tipeStyle[m.tipe as string] ?? 'outline'}>{tipeLabel[m.tipe as string] ?? m.tipe as string}</Badge>
                            <span className="text-xs text-muted-foreground">{formatDateTime(m.created_at as string)}</span>
                          </div>
                          <span className="text-sm font-bold">Saldo: {m.saldo_sesudah as number}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          {isMasuk && <span className="text-sm font-medium text-green-600">+{m.jumlah as number}</span>}
                          {isKeluar && <span className="text-sm font-medium text-red-600">-{m.jumlah as number}</span>}
                          {!isMasuk && !isKeluar && <span className="text-sm font-medium text-amber-600">{m.jumlah as number}</span>}
                          <span className="text-sm text-muted-foreground">{(m.keterangan as string) || '-'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Tabel Mutasi</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Masuk</TableHead>
                    <TableHead className="text-right">Keluar</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mutasi.map((m) => (
                    <TableRow key={m.id as string}>
                      <TableCell className="text-sm">{formatDateShort(m.created_at as string)}</TableCell>
                      <TableCell><Badge variant={tipeStyle[m.tipe as string] ?? 'outline'}>{tipeLabel[m.tipe as string] ?? m.tipe as string}</Badge></TableCell>
                      <TableCell className="text-right text-sm text-green-600">{m.tipe === 'masuk' ? `+${m.jumlah as number}` : '-'}</TableCell>
                      <TableCell className="text-right text-sm text-red-600">{m.tipe === 'keluar' ? `-${m.jumlah as number}` : '-'}</TableCell>
                      <TableCell className="text-right text-sm font-bold">{m.saldo_sesudah as number}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{(m.keterangan as string) ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>}
    </div>
  )
}
