"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'; import { useRouter, useParams } from 'next/navigation'; import { z } from 'zod'; import { useForm } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; import { DatePicker } from '@/components/ui/date-picker'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

interface KwitansiItem {
  id: string
  invoice_item_id: string
  jumlah: number
  invoice_item: {
    harga_satuan: number
    harga: number
    barang: { nama: string; kode: string; satuan: string } | null
  } | null
}

interface KwitansiData {
  id: string
  nomor: string
  invoice: { nomor: string } | null
  tanggal: string
  status: string
  keterangan: string | null
  items: KwitansiItem[]
}

const statusOpts = [{ value: 'draft', label: 'Draft' }, { value: 'completed', label: 'Selesai' }]

const schema = z.object({
  status: z.string().min(1, 'Status harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  keterangan: z.string().optional(),
})
type FV = z.input<typeof schema>

export default function EditKwitansiPage() {
  const router = useRouter(); const params = useParams<{ id: string }>(); const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false)
  const [data, setData] = useState<KwitansiData | null>(null)

  const form = useForm<FV>({ resolver: zodResolver(schema) })

  useEffect(() => {
    apiFetch<KwitansiData>(`/api/v1/kwitansi/${params.id}`)
      .then(r => {
        setData(r.data)
        form.reset({
          status: r.data.status,
          tanggal: r.data.tanggal.split('T')[0],
          keterangan: r.data.keterangan ?? '',
        })
        setLoading(false)
      })
      .catch(() => { toast.error('Gagal memuat data'); router.push('/dashboard/kwitansi') })
  }, [params.id, form, router])

  const onSubmit = async (fv: FV) => {
    setSubmitting(true)
    try {
      await apiFetch(`/api/v1/kwitansi/${params.id}`, { method: 'PUT', body: JSON.stringify(fv) })
      toast.success('Kwitansi berhasil diperbarui!')
      router.push(`/dashboard/kwitansi/${params.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (!data) return null

  const getBarangInfo = (item: KwitansiItem) => {
    if (!item.invoice_item?.barang) return { nama: '-', kode: '', satuan: '' }
    return { nama: item.invoice_item.barang.nama, kode: item.invoice_item.barang.kode, satuan: item.invoice_item.barang.satuan }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href={`/dashboard/kwitansi/${params.id}`}><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Edit Kwitansi</h1><p className="text-muted-foreground mt-1">{data.nomor}</p></div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">Informasi</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{statusOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
              )} />
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal *</label>
                <DatePicker value={form.watch('tanggal')} onChange={(v) => form.setValue('tanggal', v, { shouldValidate: true })} />
              </div>
            </div>
            <FormField control={form.control} name="keterangan" render={({ field }) => (
              <FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent></Card>

          {data.items.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Item Kwitansi</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Barang</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead className="text-right">Harga Satuan</TableHead>
                      <TableHead className="text-right">Jumlah (Rp)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((item, i) => {
                      const { nama, kode } = getBarangInfo(item)
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-medium">{nama}</TableCell>
                          <TableCell className="text-muted-foreground">{kode}</TableCell>
                          <TableCell className="text-right">{item.invoice_item?.harga?.toLocaleString('id-ID') ?? '-'}</TableCell>
                          <TableCell className="text-right font-medium">{Number(item.jumlah).toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <div className="flex justify-end mt-4 pt-4 border-t">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{data.items.reduce((s, i) => s + Number(i.jumlah), 0).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="cancel" asChild><Link href={`/dashboard/kwitansi/${params.id}`}>Batal</Link></Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? '...' : 'Update Kwitansi'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
