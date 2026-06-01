"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { ArrowLeft, Loader2, Truck } from 'lucide-react'
import { toast } from 'sonner'

interface Kendaraan { id: string; nama: string; no_polisi: string; is_active: boolean }

interface DoItem { id: string; barang_id: string; jumlah: number; keterangan: string | null; barang: { nama: string; kode: string; satuan: string } | null }

interface DoData {
  id: string; nomor: string; sales_order_id: string; sales_order: { nomor: string } | null
  tanggal: string; status: string; kendaraan_id: string | null; keterangan: string | null
  items: DoItem[]
}

const schema = z.object({
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  status: z.string().optional(),
  kendaraan_id: z.string().optional(),
  keterangan: z.string().optional(),
})
type FV = z.input<typeof schema>

const STATUS_OPTS = [
  { value: 'draft', label: 'Draft' },
  { value: 'awaiting_pickup', label: 'Siap Kirim' },
  { value: 'dikirim', label: 'Dikirim' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'ditolak', label: 'Ditolak' },
]

const CLEAR_VALUE = '__clear__'

export default function EditDoPage() {
  const router = useRouter()
  const params = useParams()
  const [doData, setDoData] = useState<DoData | null>(null)
  const [kendaraanList, setKendaraanList] = useState<Kendaraan[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FV>({
    resolver: zodResolver(schema),
    defaultValues: { tanggal: '', status: 'draft', kendaraan_id: CLEAR_VALUE, keterangan: '' },
  })

  useEffect(() => {
    if (!params.id) return
    Promise.all([
      apiFetch<DoData>(`/api/v1/delivery-order/${params.id}`),
      apiFetch<Kendaraan[]>('/api/v1/system/kendaraan'),
    ]).then(([doRes, kendRes]) => {
      const d = doRes.data
      const kl = kendRes.data ?? []
      setDoData(d)
      setKendaraanList(kl)
      form.reset({
        tanggal: d.tanggal ? d.tanggal.split('T')[0] : '',
        status: d.status,
        kendaraan_id: d.kendaraan_id ?? CLEAR_VALUE,
        keterangan: d.keterangan ?? '',
      })
      setLoading(false)
    }).catch(() => {
      toast.error('Gagal memuat data')
      router.push('/dashboard/delivery-order')
    })
  }, [params.id, form, router])

  const onSubmit = async (data: FV) => {
    setSubmitting(true)
    try {
      await apiFetch(`/api/v1/delivery-order/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...data,
          kendaraan_id: data.kendaraan_id === CLEAR_VALUE ? null : data.kendaraan_id,
        }),
      })
      toast.success('DO berhasil diupdate!')
      router.push(`/dashboard/delivery-order/${params.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  if (!doData) return null

  const isDraftOnly = doData.status === 'draft'

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href={`/dashboard/delivery-order/${params.id}`}><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Edit DO</h1><p className="text-muted-foreground mt-1">{doData.nomor}</p></div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Informasi DO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sales Order</label>
                  <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
                    {doData.sales_order?.nomor ?? '-'}
                  </p>
                </div>
                <FormField control={form.control} name="tanggal" render={({ field }) => (
                  <FormItem><FormLabel>Tanggal *</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="keterangan" render={({ field }) => (
                <FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" />Kendaraan</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="kendaraan_id" render={({ field }) => (
                <FormItem><FormLabel>Pilih Kendaraan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih kendaraan..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={CLEAR_VALUE}>-- Kosongkan Data Kendaraan --</SelectItem>
                      {kendaraanList.filter(k => k.is_active).map(k => (
                        <SelectItem key={k.id} value={k.id}>{k.nama} ({k.no_polisi})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {doData.items.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Item Barang</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barang</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Satuan</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doData.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.barang?.nama ?? '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{item.barang?.kode ?? '-'}</TableCell>
                        <TableCell className="text-right">{item.jumlah}</TableCell>
                        <TableCell>{item.barang?.satuan ?? '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{item.keterangan ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {isDraftOnly && (
            <Card>
              <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
              <CardContent>
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {STATUS_OPTS.filter(o => o.value === 'draft' || o.value === 'awaiting_pickup').map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <p className="text-xs text-muted-foreground mt-2">
                  Untuk ubah status ke Dikirim/Ditolak, gunakan tombol aksi di halaman detail DO.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="cancel" asChild><Link href={`/dashboard/delivery-order/${params.id}`}>Batal</Link></Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? '...' : 'Update DO'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
