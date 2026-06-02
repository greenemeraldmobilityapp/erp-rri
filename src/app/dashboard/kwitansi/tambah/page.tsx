"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'; import { useRouter } from 'next/navigation'; import { z } from 'zod'; import { useForm, useFieldArray } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; import { DatePicker } from '@/components/ui/date-picker'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

interface InvoiceItemData {
  id: string
  harga: number
  jumlah: number
  diskon: number | null
  ppn: number | null
  pph: number | null
  nama_barang: string | null
  kode_barang: string | null
  satuan: string | null
  barang: { nama: string; kode: string; satuan: string } | null
}

const itemSchema = z.object({ invoice_item_id: z.string().min(1), jumlah: z.coerce.number().positive() })
const schema = z.object({ invoice_id: z.string().min(1), tanggal: z.string().min(1), keterangan: z.string().optional(), items: z.array(itemSchema).min(1, 'Pilih minimal 1 item') })
type FV = z.input<typeof schema>

export default function TambahKwitansiPage() {
  const router = useRouter(); const [invOpts, setInvOpts] = useState<Array<{ value: string; label: string }>>([]); const [submitting, setSubmitting] = useState(false)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemData[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingItems, setLoadingItems] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { tanggal: today, items: [] } })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const selectedInvoiceId = form.watch('invoice_id')

  useEffect(() => {
    apiFetch<Array<{ id: string; nomor: string }>>('/api/v1/invoice').then((inv) => {
      setInvOpts((inv.data ?? []).map(x => ({ value: x.id, label: x.nomor })))
    }).catch(() => toast.error('Gagal memuat invoice'))
  }, [])

  useEffect(() => {
    if (!selectedInvoiceId) { setInvoiceItems([]); setSelectedIds(new Set()); return }
    setLoadingItems(true)
    apiFetch<{ items: InvoiceItemData[] }>(`/api/v1/invoice/${selectedInvoiceId}`)
      .then((r) => { setInvoiceItems(r.data?.items ?? []); setSelectedIds(new Set()) })
      .catch(() => toast.error('Gagal memuat item invoice'))
      .finally(() => setLoadingItems(false))
  }, [selectedInvoiceId])

  useEffect(() => {
    const currentItems = new Set(fields.map(f => f.invoice_item_id))
    const toAdd = [...selectedIds].filter(id => !currentItems.has(id))
    const toRemove = fields.filter(f => !selectedIds.has(f.invoice_item_id))
    toRemove.forEach(f => { const idx = fields.findIndex(ff => ff.id === f.id); if (idx >= 0) remove(idx) })
    toAdd.forEach(id => append({ invoice_item_id: id, jumlah: invoiceItems.find(i => i.id === id)?.harga ?? 0 }))
  }, [selectedIds])

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const getBarangDisplay = (item: InvoiceItemData) => {
    const nama = item.nama_barang ?? item.barang?.nama ?? '-'
    const kode = item.kode_barang ?? item.barang?.kode ?? ''
    const satuan = item.satuan ?? item.barang?.satuan ?? ''
    return { nama, kode, satuan }
  }

  const onSubmit = async (data: FV) => {
    setSubmitting(true); try { await apiFetch('/api/v1/kwitansi', { method: 'POST', body: JSON.stringify(data) }); toast.success('Kwitansi berhasil!'); router.push('/dashboard/kwitansi') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan') } finally { setSubmitting(false) }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><Link href="/dashboard/kwitansi"><ArrowLeft className="h-5 w-5" /></Link></Button><div><h1 className="text-3xl font-heading font-bold">Tambah Kwitansi</h1></div></div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">Informasi</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="invoice_id" render={({ field }) => (
                <FormItem><FormLabel>Invoice</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Pilih invoice" /></SelectTrigger></FormControl>
                  <SelectContent>{invOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
              )} />
              <div className="space-y-2"><label className="text-sm font-medium">Tanggal *</label><DatePicker value={form.watch('tanggal')} onChange={(v) => form.setValue('tanggal', v)} /></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">Keterangan</label><Textarea {...form.register('keterangan')} rows={2} /></div>
          </CardContent></Card>

          {selectedInvoiceId && (
            <Card>
              <CardHeader><CardTitle className="text-base">Pilih Item Invoice</CardTitle></CardHeader>
              <CardContent>
                {loadingItems ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : invoiceItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Invoice ini tidak memiliki item.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"><Checkbox checked={selectedIds.size === invoiceItems.length && invoiceItems.length > 0} onCheckedChange={() => { if (selectedIds.size === invoiceItems.length) setSelectedIds(new Set()); else setSelectedIds(new Set(invoiceItems.map(i => i.id))) }} /></TableHead>
                        <TableHead>Barang</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.map((item) => {
                        const { nama, kode, satuan } = getBarangDisplay(item)
                        return (
                          <TableRow key={item.id} className="cursor-pointer" onClick={() => toggleItem(item.id)}>
                            <TableCell><Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleItem(item.id)} /></TableCell>
                            <TableCell className="font-medium">{nama}</TableCell>
                            <TableCell className="text-muted-foreground">{kode}</TableCell>
                            <TableCell className="text-right">{item.harga.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="text-right">{item.jumlah} {satuan}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {fields.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Jumlah Pembayaran per Item</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Sesuaikan jumlah pembayaran untuk setiap item yang dipilih.</p>
                {fields.map((f, i) => {
                  const invItem = invoiceItems.find(ii => ii.id === f.invoice_item_id)
                  const { nama, kode } = invItem ? getBarangDisplay(invItem) : { nama: 'Unknown', kode: '' }
                  return (
                    <div key={f.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{nama}</p>
                        <p className="text-xs text-muted-foreground">{kode}</p>
                      </div>
                      <div className="w-48">
                        <Input type="number" step="0.01" {...form.register(`items.${i}.jumlah`)} />
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { toggleItem(f.invoice_item_id) }} className="text-destructive">Hapus</Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="cancel" asChild><Link href="/dashboard/kwitansi">Batal</Link></Button>
            <Button type="submit" disabled={submitting || fields.length === 0}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? '...' : 'Simpan Kwitansi'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
