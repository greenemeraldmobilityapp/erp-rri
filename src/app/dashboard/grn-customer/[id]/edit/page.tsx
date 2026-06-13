"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DetailSkeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface BarangData { id: string; nama: string; kode: string; satuan: string }

const itemSchema = z.object({
  barang_id: z.string().min(1),
  jumlah: z.coerce.number().int().positive(),
  nama_barang: z.string().optional(),
  kode_barang: z.string().optional(),
  satuan: z.string().optional(),
  keterangan: z.string().optional(),
})

const schema = z.object({
  status: z.string().optional(),
  gudang_id: z.string().optional(),
  keterangan: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

type FV = z.input<typeof schema>

const statusOpts = [
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Selesai' },
]

export default function EditGrnCustomerPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [barangOpts, setBarangOpts] = useState<Array<{ value: string; label: string }>>([])
  const [barangMap, setBarangMap] = useState<Record<string, BarangData>>({})
  const [gudangOpts, setGudangOpts] = useState<Array<{ value: string; label: string }>>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [doRef, setDoRef] = useState<string | null>(null)

  const form = useForm<FV>({ resolver: zodResolver(schema) })
  const { register, handleSubmit, control, setValue, reset } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    Promise.all([
      apiFetch<BarangData[]>('/api/v1/master/barang/dropdown'),
      apiFetch<Array<{ id: string; nama: string }>>('/api/v1/master/gudang'),
    ]).then(([b, g]) => {
      const bList = b.data ?? []
      setBarangOpts(bList.map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` })))
      const bMap: Record<string, BarangData> = {}
      bList.forEach(x => { bMap[x.id] = x })
      setBarangMap(bMap)
      setGudangOpts((g.data ?? []).map(x => ({ value: x.id, label: x.nama })))
    }).catch(() => toast.error('Gagal memuat data'))
  }, [])

  useEffect(() => {
    apiFetch<{ status: string; gudang_id: string | null; keterangan: string | null; delivery_order: { nomor: string } | null; items?: Array<{ barang_id: string; jumlah: number; keterangan?: string | null; nama_barang?: string | null; kode_barang?: string | null; satuan?: string | null }> }>(`/api/v1/grn-customer/${params.id}`)
      .then(r => {
        if (r.data.status === 'completed') {
          setIsCompleted(true)
          setLoading(false)
          return
        }
        setDoRef(r.data.delivery_order?.nomor ?? null)
        reset({
          status: r.data.status,
          gudang_id: r.data.gudang_id ?? '',
          keterangan: r.data.keterangan ?? '',
          items: (r.data.items ?? []).map(i => ({
            barang_id: i.barang_id,
            jumlah: i.jumlah,
            nama_barang: i.nama_barang ?? '',
            kode_barang: i.kode_barang ?? '',
            satuan: i.satuan ?? '',
            keterangan: i.keterangan ?? '',
          })),
        })
        setDataLoaded(true)
        setLoading(false)
      })
      .catch(() => { toast.error('Gagal'); router.push('/dashboard/grn-customer') })
  }, [params.id, reset, router])

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
    setSubmitting(true)
    try {
      await apiFetch(`/api/v1/grn-customer/${params.id}`, { method: 'PUT', body: JSON.stringify(data) })
      toast.success('Diupdate!')
      router.push(`/dashboard/grn-customer/${params.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <DetailSkeleton />

  if (isCompleted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href={`/dashboard/grn-customer/${params.id}`}><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div><h1 className="text-3xl font-heading font-bold">Edit Retur Barang (GRN)</h1></div>
        </div>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">Retur Barang (GRN) dengan status <strong>Selesai</strong> tidak dapat diedit.</p>
            <Button asChild className="mt-4"><Link href={`/dashboard/grn-customer/${params.id}`}>Kembali ke Detail</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href={`/dashboard/grn-customer/${params.id}`}><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Edit Retur Barang (GRN)</h1></div>
      </div>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">Informasi</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {doRef && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">DO Reference</label>
                  <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">{doRef}</p>
                </div>
              )}
              <FormField control={control} name="gudang_id" render={({ field }) => (
                <FormItem><FormLabel>Gudang</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih Gudang" /></SelectTrigger></FormControl>
                    <SelectContent>{gudangOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select {...register('status')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring">
                  {statusOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Keterangan</label>
                <Textarea {...register('keterangan')} rows={3} />
              </div>
            </CardContent>
          </Card>

          {dataLoaded && (
            <Card><CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Item</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ barang_id: '', jumlah: 1, keterangan: '' })}>
                <Plus className="h-4 w-4 mr-1" />Tambah
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((f, i) => (
                <div key={f.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Item #{i + 1}</span>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
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
              ))}
            </CardContent></Card>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="cancel"><Link href={`/dashboard/grn-customer/${params.id}`}>Batal</Link></Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? '...' : 'Update'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
