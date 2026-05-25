import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, BookOpenCheck, Pencil } from 'lucide-react'

const statusMap: Record<string, { label: string; variant: 'secondary' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  posted: { label: 'Posted', variant: 'success' },
}

function rupiah(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`
}

export default async function JurnalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: jurnal, error } = await supabase
    .from('jurnal')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !jurnal) {
    return <div className="text-center py-20 text-muted-foreground">Jurnal tidak ditemukan</div>
  }

  const { data: items } = await supabase
    .from('jurnal_item')
    .select('*, coa!akun_id(id, kode, nama)')
    .eq('jurnal_id', id)
    .order('created_at', { ascending: true })

  const totalDebit = (items ?? []).reduce((s, i) => s + (i.debit ?? 0), 0)
  const totalCredit = (items ?? []).reduce((s, i) => s + (i.credit ?? 0), 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/jurnal">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold">Buku Jurnal</h1>
            <p className="text-muted-foreground mt-1">{jurnal.nomor}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/jurnal/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />Edit
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpenCheck className="h-5 w-5 text-muted-foreground" />
              Informasi Jurnal
            </h3>
            <Badge variant={statusMap[jurnal.status]?.variant ?? 'outline'}>
              {statusMap[jurnal.status]?.label ?? jurnal.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-muted-foreground">Nomor</p>
              <p className="font-medium">{jurnal.nomor}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(jurnal.tanggal).toLocaleDateString('id-ID')}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-muted-foreground">Keterangan</p>
              <p className="font-medium">{jurnal.keterangan ?? '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Entri Jurnal</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Kode Akun</TableHead>
                <TableHead>Nama Akun</TableHead>
                <TableHead className="text-right w-36">Debit</TableHead>
                <TableHead className="text-right w-36">Kredit</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!items || items.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Belum ada entri jurnal
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, i) => {
                  const akun = item.coa as { kode: string; nama: string } | null
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{akun?.kode ?? '-'}</TableCell>
                      <TableCell>{akun?.nama ?? '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {(item.debit ?? 0) > 0 ? rupiah(item.debit) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(item.credit ?? 0) > 0 ? rupiah(item.credit) : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.keterangan ?? '-'}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          <div className="border-t mt-4 pt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                {!balanced && (
                  <Badge variant="destructive" className="text-xs">
                    Tidak Balance (selisih Rp {(totalDebit - totalCredit).toLocaleString('id-ID')})
                  </Badge>
                )}
              </div>
              <div className="flex gap-8">
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">Total Debit</p>
                  <p className={`font-bold font-mono text-base ${balanced ? 'text-foreground' : 'text-destructive'}`}>
                    {rupiah(totalDebit)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">Total Kredit</p>
                  <p className={`font-bold font-mono text-base ${balanced ? 'text-foreground' : 'text-destructive'}`}>
                    {rupiah(totalCredit)}
                  </p>
                </div>
              </div>
            </div>
            {balanced && (
              <p className="text-xs text-emerald-600 mt-2 text-right">✓ Balance</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button className="bg-zinc-500/70 text-white hover:bg-zinc-500/90" asChild>
          <Link href="/dashboard/jurnal">Kembali</Link>
        </Button>
        <Button asChild>
          <Link href={`/dashboard/jurnal/${id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />Edit Jurnal
          </Link>
        </Button>
      </div>
    </div>
  )
}
