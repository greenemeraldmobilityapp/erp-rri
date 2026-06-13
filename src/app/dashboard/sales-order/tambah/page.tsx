"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DatePicker } from '@/components/ui/date-picker'
import Link from 'next/link'
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const itemSchema = z.object({
  barang_id: z.string().min(1),
  jumlah: z.coerce.number().int().positive(),
  harga_satuan: z.coerce.number().nonnegative(),
  keterangan: z.string().optional(),
})
const schema = z.object({
  customer_po_id: z.string().optional(),
  di_id: z.string().optional(),
  tanggal: z.string().min(1),
  items: z.array(itemSchema).min(1),
})
type FV = z.input<typeof schema>

export default function TambahSoPage() {
  const router = useRouter()
  const [tab, setTab] = useState('po')
  const [poOpts, setPoOpts] = useState<Array<{ value: string; label: string }>>([])
  const [diOpts, setDiOpts] = useState<Array<{ value: string; label: string; di: Record<string, unknown> }>>([])
  const [barangOpts, setBarangOpts] = useState<Array<{ value: string; label: string }>>([])
  const [poLoading, setPoLoading] = useState(false)
  const [diLoading, setDiLoading] = useState(false)
  const [selectedDi, setSelectedDi] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const form = useForm<FV>({
    resolver: zodResolver(schema),
    defaultValues: { tanggal: today, items: [{ barang_id: '', jumlah: 1, harga_satuan: 0 }] },
  })
  const { register, handleSubmit, control, reset } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    Promise.all([
      apiFetch<Array<{ id: string; nomor: string }>>('/api/v1/customer-po'),
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/barang/dropdown'),
      apiFetch<Array<Record<string, unknown>>>('/api/v1/di'),
    ]).then(([po, b, diList]) => {
      setPoOpts((po.data ?? []).map(x => ({ value: x.id, label: x.nomor })))
      setBarangOpts((b.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` })))
      const activeDi = (diList.data ?? []).filter((d: Record<string, unknown>) => d.status === 'active')
      setDiOpts(activeDi.map((d: Record<string, unknown>) => {
        const customer = d.customer as Record<string, unknown> ?? {}
        return { value: d.id as string, label: `${d.nomor as string} — ${customer.nama as string ?? '-'}`, di: d }
      }))
    }).catch(() => toast.error('Gagal memuat data'))
  }, [])

  const handlePoSelect = async (poId: string) => {
    form.setValue('customer_po_id', poId)
    if (!poId) return
    setPoLoading(true)
    try {
      const poRes = await apiFetch<Record<string, unknown>>(`/api/v1/customer-po/${poId}`)
      const poData = poRes.data
      const poItems = (poData.items as Array<Record<string, unknown>>) ?? []
      if (poItems.length > 0) {
        form.reset({
          customer_po_id: poId,
          di_id: '',
          tanggal: today,
          items: poItems.map(i => ({
            barang_id: i.barang_id as string,
            jumlah: i.jumlah as number,
            harga_satuan: i.harga_satuan as number,
            keterangan: (i.keterangan as string) ?? '',
          })),
        })
      }
    } catch {
      toast.error('Gagal memuat item PO')
    } finally {
      setPoLoading(false)
    }
  }

  const handleDiSelect = async (diId: string) => {
    setSelectedDi(diId)
    if (!diId) return
    setDiLoading(true)
    try {
      const diRes = await apiFetch<Record<string, unknown>>(`/api/v1/di/${diId}`)
      const diData = diRes.data
      const diItems = (diData.items as Array<Record<string, unknown>>) ?? []
      const kontrakId = diData.kontrak_id as string | null

      const hargaMap = new Map<string, number>()
      if (kontrakId) {
        try {
          const kontrakRes = await apiFetch<Record<string, unknown>>(`/api/v1/master/kontrak/${kontrakId}`)
          const kontrakItems = (kontrakRes.data?.items as Array<Record<string, unknown>>) ?? []
          for (const ki of kontrakItems) {
            hargaMap.set(ki.barang_id as string, ki.harga_satuan as number)
          }
        } catch {
          // kontrak items not available, use 0
        }
      }

      reset({
        di_id: diId,
        customer_po_id: '',
        tanggal: today,
        items: diItems.map(i => ({
          barang_id: i.barang_id as string,
          jumlah: i.jumlah as number,
          harga_satuan: hargaMap.get(i.barang_id as string) ?? 0,
          keterangan: (i.keterangan as string) ?? '',
        })),
      })
    } catch (err) {
      toast.error('Gagal memuat data DI')
    } finally {
      setDiLoading(false)
    }
  }

  const onSubmit = async (data: FV) => {
    if (tab === 'po') {
      data.di_id = ''
    } else {
      data.customer_po_id = ''
    }
    setSubmitting(true)
    try {
      await apiFetch('/api/v1/sales-order', { method: 'POST', body: JSON.stringify(data) })
      toast.success('SO berhasil!')
      router.push('/dashboard/sales-order')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard/sales-order"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Tambah Sales Order</h1><p className="text-muted-foreground mt-1">Order penjualan internal</p></div>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); reset({ tanggal: today, items: [{ barang_id: '', jumlah: 1, harga_satuan: 0 }] }); setSelectedDi('') }}>
        <TabsList>
          <TabsTrigger value="po">Dari Customer PO</TabsTrigger>
          <TabsTrigger value="di">Dari Delivery Instruction</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="po" className="space-y-6">
              <Card><CardHeader><CardTitle className="text-base">Informasi SO</CardTitle></CardHeader><CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={control} name="customer_po_id" render={({ field }) => (
                    <FormItem><FormLabel>Customer PO</FormLabel>
                      <Select onValueChange={(v) => { field.onChange(v); handlePoSelect(v) }} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih PO" /></SelectTrigger></FormControl>
                        <SelectContent>{poOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="tanggal" render={({ field }) => (
                    <FormItem><FormLabel>Tanggal *</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                {poLoading && <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>}
              </CardContent></Card>

              <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Item</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ barang_id: '', jumlah: 1, harga_satuan: 0 })}><Plus className="h-4 w-4 mr-1" />Tambah</Button></CardHeader>
                <CardContent className="space-y-4">{fields.map((f, i) => (
                  <div key={f.id} className="p-4 border rounded-lg space-y-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Item #{i+1}</span>{fields.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>
                    <div className="grid grid-cols-3 gap-3">
                      <FormField control={control} name={`items.${i}.barang_id`} render={({ field }) => (
                        <FormItem><FormLabel>Barang *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                            <SelectContent>{barangOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="space-y-2"><label className="text-xs font-medium">Jumlah *</label><Input type="number" min="1" {...register(`items.${i}.jumlah`)} /></div>
                      <div className="space-y-2"><label className="text-xs font-medium">Harga *</label><Input type="number" min="0" {...register(`items.${i}.harga_satuan`)} /></div>
                    </div>
                  </div>
                ))}</CardContent></Card>
            </TabsContent>

            <TabsContent value="di" className="space-y-6">
              <Card><CardHeader><CardTitle className="text-base">Pilih Delivery Instruction</CardTitle></CardHeader><CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Delivery Instruction *</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
                      value={selectedDi}
                      onChange={(e) => handleDiSelect(e.target.value)}
                    >
                      <option value="">Pilih DI</option>
                      {diOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <FormField control={control} name="tanggal" render={({ field }) => (
                    <FormItem><FormLabel>Tanggal *</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                {selectedDi && !diLoading && (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                    <p><span className="text-muted-foreground">Customer:</span> <span className="font-medium">
                      {(diOpts.find(o => o.value === selectedDi)?.di?.customer as Record<string, unknown>)?.nama as string ?? '-'}
                    </span></p>
                  </div>
                )}
                {diLoading && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>}
              </CardContent></Card>

              {!diLoading && selectedDi && (
                <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Item (dari DI)</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ barang_id: '', jumlah: 1, harga_satuan: 0 })}><Plus className="h-4 w-4 mr-1" />Tambah</Button></CardHeader>
                  <CardContent className="space-y-4">{fields.map((f, i) => (
                    <div key={f.id} className="p-4 border rounded-lg space-y-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Item #{i+1}</span>{fields.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>
                      <div className="grid grid-cols-3 gap-3">
                        <FormField control={control} name={`items.${i}.barang_id`} render={({ field }) => (
                          <FormItem><FormLabel>Barang *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                              <SelectContent>{barangOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="space-y-2"><label className="text-xs font-medium">Jumlah *</label><Input type="number" min="1" {...register(`items.${i}.jumlah`)} /></div>
                        <div className="space-y-2"><label className="text-xs font-medium">Harga *</label><Input type="number" min="0" {...register(`items.${i}.harga_satuan`)} /></div>
                      </div>
                      <div className="space-y-2"><label className="text-xs font-medium">Keterangan</label><Input {...register(`items.${i}.keterangan`)} /></div>
                    </div>
                  ))}</CardContent></Card>
              )}
            </TabsContent>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="cancel"><Link href="/dashboard/sales-order">Batal</Link></Button>
              <Button type="submit" disabled={submitting || (tab === 'di' && !selectedDi)}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {submitting ? '...' : 'Simpan SO'}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  )
}
