"use client"
import { useState, useEffect, useRef } from 'react'; import { useRouter } from 'next/navigation'; import { z } from 'zod'; import { useForm, useFieldArray } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; import { DatePicker } from '@/components/ui/date-picker'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import Link from 'next/link'; import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

interface DoOption { id: string; nomor: string; customer_id: string | null; gudang_id: string | null; sales_order: { nomor: string } | null }

interface DoItemData { barang_id: string; jumlah: number; urutan?: number; nama_barang?: string | null; kode_barang?: string | null; satuan?: string | null; keterangan: string | null; barang?: { nama: string; kode: string; satuan: string } | null }

interface DoDetail { id: string; nomor: string; customer_id: string | null; gudang_id: string | null; items?: DoItemData[] }

interface ReturOption { id: string; nomor: string; status: string; customer_id: string | null; delivery_order_id: string | null; customer: { nama: string; kode: string } | null; delivery_order: { nomor: string } | null }

interface ReturItemData { barang_id: string; jumlah: number; nama_barang?: string | null; kode_barang?: string | null; satuan?: string | null; keterangan?: string | null; barang?: { nama: string; kode: string; satuan: string } | null }

interface ReturDetail { id: string; nomor: string; customer_id: string | null; delivery_order_id: string | null; items?: ReturItemData[] }

interface BarangData { id: string; nama: string; kode: string; satuan: string }

const itemSchema = z.object({
  barang_id: z.string().min(1), jumlah: z.coerce.number().int().positive(),
  nama_barang: z.string().optional(), kode_barang: z.string().optional(), satuan: z.string().optional(),
  urutan: z.number().int().optional(), keterangan: z.string().optional(),
})
const schema = z.object({
  delivery_order_id: z.string().optional(), customer_id: z.string().optional(), gudang_id: z.string().optional(),
  retur_penjualan_id: z.string().optional(), tanggal: z.string().min(1), keterangan: z.string().optional(),
  items: z.array(itemSchema).min(1),
})
type FV = z.input<typeof schema>

export default function TambahGrnCustomerPage() {
  const router = useRouter()
  const [customerOpts, setCustomerOpts] = useState<Array<{ value: string; label: string }>>([])
  const [gudangOpts, setGudangOpts] = useState<Array<{ value: string; label: string }>>([])
  const [barangOpts, setBarangOpts] = useState<Array<{ value: string; label: string }>>([])
  const [barangMap, setBarangMap] = useState<Record<string, BarangData>>({})
  const barangMapRef = useRef(barangMap)
  barangMapRef.current = barangMap
  const [doOpts, setDoOpts] = useState<Array<{ value: string; label: string }>>([])
  const [doLoading, setDoLoading] = useState(false)
  const [returOpts, setReturOpts] = useState<Array<{ value: string; label: string }>>([])
  const [returLoading, setReturLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { tanggal: today, items: [{ barang_id: '', jumlah: 1 }] } })
  const { register, handleSubmit, control, setValue, watch } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const selectedDoId = watch('delivery_order_id')
  const selectedReturId = watch('retur_penjualan_id')

  useEffect(() => {
    Promise.all([
      apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/customer'),
      apiFetch<Array<{ id: string; nama: string }>>('/api/v1/master/gudang'),
      apiFetch<BarangData[]>('/api/v1/master/barang/dropdown'),
      apiFetch<DoOption[]>('/api/v1/delivery-order'),
      apiFetch<ReturOption[]>('/api/v1/retur-penjualan'),
    ]).then(([c, g, b, doRes, returRes]) => {
      setCustomerOpts((c.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` })))
      setGudangOpts((g.data ?? []).map(x => ({ value: x.id, label: x.nama })))
      const bList = b.data ?? []
      setBarangOpts(bList.map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` })))
      const bMap: Record<string, BarangData> = {}
      bList.forEach(x => { bMap[x.id] = x })
      setBarangMap(bMap)
      setDoOpts((doRes.data ?? []).map(x => ({ value: x.id, label: `${x.nomor} (SO: ${x.sales_order?.nomor ?? '-'})` })))
      setReturOpts((returRes.data ?? [])
        .filter((r: ReturOption) => r.status !== 'draft')
        .map((r: ReturOption) => ({ value: r.id, label: `${r.nomor} - ${r.customer?.nama ?? '-'} (DO: ${r.delivery_order?.nomor ?? '-'})` })))
    }).catch(() => toast.error('Gagal'))
  }, [])

  useEffect(() => {
    if (!selectedDoId) return
    setDoLoading(true)
    apiFetch<DoDetail>(`/api/v1/delivery-order/${selectedDoId}`)
      .then(res => {
        const d = res.data
        if (d) {
          setValue('customer_id', d.customer_id ?? '')
          setValue('gudang_id', d.gudang_id ?? '')
          if (selectedReturId) return
          if (d.items && d.items.length > 0) {
            remove()
            d.items.forEach(item => {
              const b = barangMapRef.current[item.barang_id]
              append({
                barang_id: item.barang_id,
                jumlah: item.jumlah,
                nama_barang: item.nama_barang ?? item.barang?.nama ?? b?.nama ?? '',
                kode_barang: item.kode_barang ?? item.barang?.kode ?? b?.kode ?? '',
                satuan: item.satuan ?? item.barang?.satuan ?? b?.satuan ?? '',
                urutan: item.urutan,
                keterangan: item.keterangan ?? '',
              })
            })
          }
        }
      })
      .catch(() => toast.error('Gagal memuat data DO'))
      .finally(() => setDoLoading(false))
  }, [selectedDoId, selectedReturId, setValue, append, remove])

  useEffect(() => {
    if (!selectedReturId) return
    setReturLoading(true)
    setValue('delivery_order_id', '')
    apiFetch<ReturDetail>(`/api/v1/retur-penjualan/${selectedReturId}`)
      .then(res => {
        const d = res.data
        if (d) {
          setValue('customer_id', d.customer_id ?? '')
          if (d.delivery_order_id) setValue('delivery_order_id', d.delivery_order_id)
          if (d.items && d.items.length > 0) {
            remove()
            d.items.forEach(item => {
              const b = barangMapRef.current[item.barang_id]
              append({
                barang_id: item.barang_id,
                jumlah: item.jumlah,
                nama_barang: item.nama_barang ?? item.barang?.nama ?? b?.nama ?? '',
                kode_barang: item.kode_barang ?? item.barang?.kode ?? b?.kode ?? '',
                satuan: item.satuan ?? item.barang?.satuan ?? b?.satuan ?? '',
                keterangan: item.keterangan ?? '',
              })
            })
          }
        }
      })
      .catch(() => toast.error('Gagal memuat data Retur'))
      .finally(() => setReturLoading(false))
  }, [selectedReturId, setValue, append, remove])

  const handleBarangChange = (i: number, barangId: string) => {
    setValue(`items.${i}.barang_id`, barangId)
    const b = barangMap[barangId]
    if (b) {
      setValue(`items.${i}.nama_barang`, b.nama)
      setValue(`items.${i}.kode_barang`, b.kode)
      setValue(`items.${i}.satuan`, b.satuan)
    } else {
      setValue(`items.${i}.nama_barang`, '')
      setValue(`items.${i}.kode_barang`, '')
      setValue(`items.${i}.satuan`, '')
    }
  }

  const onSubmit = async (data: FV) => {
    setSubmitting(true); try {       await apiFetch('/api/v1/grn-customer', { method: 'POST', body: JSON.stringify(data) }); toast.success('Retur Barang (GRN) berhasil!'); router.push('/dashboard/grn-customer') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan') } finally { setSubmitting(false) }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><Link href="/dashboard/grn-customer"><ArrowLeft className="h-5 w-5" /></Link></Button><div><h1 className="text-3xl font-heading font-bold">Tambah Retur Barang (GRN)</h1></div></div>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">Informasi</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={control} name="retur_penjualan_id" render={({ field }) => (
                <FormItem><FormLabel>Ref. Retur Penjualan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih Retur..." /></SelectTrigger></FormControl>
                    <SelectContent>{returOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                  {returLoading && <p className="text-xs text-muted-foreground mt-1">Memuat data Retur...</p>}
                </FormItem>
              )} />
              <FormField control={control} name="delivery_order_id" render={({ field }) => (
                <FormItem><FormLabel>Nomor DO</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih DO..." /></SelectTrigger></FormControl>
                    <SelectContent>{doOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                  {doLoading && <p className="text-xs text-muted-foreground mt-1">Memuat data DO...</p>}
                </FormItem>
              )} />
              <FormField control={control} name="customer_id" render={({ field }) => (
                <FormItem><FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                    <SelectContent>{customerOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={control} name="gudang_id" render={({ field }) => (
                <FormItem><FormLabel>Gudang</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                    <SelectContent>{gudangOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="tanggal" render={({ field }) => (
                <FormItem><FormLabel>Tanggal *</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={control} name="keterangan" render={({ field }) => (
              <FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Item</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ barang_id: '', jumlah: 1 })}><Plus className="h-4 w-4 mr-1" />Tambah</Button></CardHeader>
            <CardContent className="space-y-4">{fields.map((f, i) => (
              <div key={f.id} className="p-4 border rounded-lg space-y-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Item #{i+1}</span>{fields.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={control} name={`items.${i}.barang_id`} render={({ field }) => (
                    <FormItem><FormLabel>Barang *</FormLabel>
                      <Select onValueChange={(v) => handleBarangChange(i, v)} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                        <SelectContent>{barangOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="space-y-2"><label className="text-xs font-medium">Jumlah *</label><Input type="number" min="1" {...register(`items.${i}.jumlah`)} /></div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-2"><label className="text-xs font-medium">Nama</label><Input readOnly {...register(`items.${i}.nama_barang`)} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium">Kode</label><Input readOnly {...register(`items.${i}.kode_barang`)} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium">Satuan</label><Input readOnly {...register(`items.${i}.satuan`)} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium">Keterangan</label><Input {...register(`items.${i}.keterangan`)} /></div>
                </div>
              </div>
            ))}</CardContent></Card>
          <div className="flex justify-end gap-3"><Button type="button" variant="cancel"><Link href="/dashboard/grn-customer">Batal</Link></Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitting ? '...' : 'Simpan Retur Barang'}</Button></div>
        </form>
      </Form>
    </div>
  )
}
