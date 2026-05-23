"use client"
import { useState, useEffect } from 'react'; import { useRouter } from 'next/navigation'; import { z } from 'zod'; import { useForm } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

const schema = z.object({ karyawan_id: z.string().min(1), bulan: z.coerce.number().int().min(1).max(12), tahun: z.coerce.number().int().min(2020).max(2100), gaji_pokok: z.coerce.number().positive(), tunjangan: z.coerce.number().optional().default(0), potongan: z.coerce.number().optional().default(0), keterangan: z.string().optional() })
type FV = z.input<typeof schema>

export default function TambahPenggajianPage() {
  const router = useRouter(); const [kOpts, setKOpts] = useState<Array<{ value: string; label: string }>>([]); const [submitting, setSubmitting] = useState(false)
  const now = new Date(); const defBulan = now.getMonth() + 1; const defTahun = now.getFullYear()
  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { bulan: defBulan, tahun: defTahun, tunjangan: 0, potongan: 0 } })
  const gajiPokok = form.watch('gaji_pokok', 0); const tunjangan = form.watch('tunjangan', 0); const potongan = form.watch('potongan', 0)
  const gajiBersih = Number(gajiPokok) + Number(tunjangan) - Number(potongan)
  useEffect(() => { apiFetch<Array<{ id: string; nama: string; nik: string }>>('/api/v1/master/karyawan').then(r => setKOpts((r.data ?? []).map(x => ({ value: x.id, label: `[${x.nik}] ${x.nama}` })))).catch(() => toast.error('Gagal')) }, [])
  const onSubmit = async (data: FV) => {
    setSubmitting(true); try { await apiFetch('/api/v1/penggajian', { method: 'POST', body: JSON.stringify(data) }); toast.success('Penggajian berhasil!'); router.push('/dashboard/penggajian') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setSubmitting(false) }
  }
  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><a href="/dashboard/penggajian"><ArrowLeft className="h-5 w-5" /></a></Button><div><h1 className="text-3xl font-heading font-bold">Tambah Penggajian</h1></div></div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6"><Card><CardHeader><CardTitle className="text-base">Data Gaji</CardTitle></CardHeader><CardContent className="space-y-4">
          <FormField control={form.control} name="karyawan_id" render={({ field }) => (
            <FormItem><FormLabel>Karyawan</FormLabel><Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Pilih karyawan" /></SelectTrigger></FormControl>
              <SelectContent>{kOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select><FormMessage /></FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Bulan *</label><Input type="number" min="1" max="12" {...form.register('bulan', { valueAsNumber: true })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Tahun *</label><Input type="number" min="2020" max="2100" {...form.register('tahun', { valueAsNumber: true })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Gaji Pokok *</label><Input type="number" step="0.01" {...form.register('gaji_pokok', { valueAsNumber: true })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Tunjangan</label><Input type="number" step="0.01" {...form.register('tunjangan', { valueAsNumber: true })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Potongan</label><Input type="number" step="0.01" {...form.register('potongan', { valueAsNumber: true })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Gaji Bersih</label><Input value={gajiBersih.toLocaleString('id-ID')} disabled className="font-bold" /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Keterangan</label><Textarea {...form.register('keterangan')} rows={2} /></div>
        </CardContent></Card><div className="flex justify-end gap-3"><Button type="button" variant="outline" asChild><a href="/dashboard/penggajian">Batal</a></Button>
          <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitting ? '...' : 'Simpan'}</Button></div></form>
      </Form>
    </div>
  )
}
