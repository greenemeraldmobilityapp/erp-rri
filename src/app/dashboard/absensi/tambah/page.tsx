"use client"

import { useState, useEffect } from 'react'; import { useRouter } from 'next/navigation'; import { z } from 'zod'; import { useForm } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

const schema = z.object({ karyawan_id: z.string().min(1), tanggal: z.string().min(1), status: z.enum(['hadir', 'sakit', 'izin', 'alpha', 'cuti']), keterangan: z.string().optional() })
type FV = z.input<typeof schema>
const statusOpts = [{ value: 'hadir', label: 'Hadir' }, { value: 'sakit', label: 'Sakit' }, { value: 'izin', label: 'Izin' }, { value: 'alpha', label: 'Alpha' }, { value: 'cuti', label: 'Cuti' }]

export default function TambahAbsensiPage() {
  const router = useRouter(); const [kOpts, setKOpts] = useState<Array<{ value: string; label: string }>>([]); const [submitting, setSubmitting] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { tanggal: today, status: 'hadir' } })
  useEffect(() => { apiFetch<Array<{ id: string; nama: string; nik: string; is_active: boolean }>>('/api/v1/master/karyawan').then(r => { const d = r.data ?? []; setKOpts(d.filter(k => k.is_active !== false).map(x => ({ value: x.id, label: `[${x.nik}] ${x.nama}` }))) }).catch(() => toast.error('Gagal')) }, [])
  const onSubmit = async (data: FV) => {
    setSubmitting(true); try { await apiFetch('/api/v1/absensi', { method: 'POST', body: JSON.stringify(data) }); toast.success('Absensi dicatat!'); router.push('/dashboard/absensi') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan') } finally { setSubmitting(false) }
  }
  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/absensi')}><ArrowLeft className="h-5 w-5" /></Button><div><h1 className="text-3xl font-heading font-bold">Tambah Absensi</h1></div></div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6"><Card><CardHeader><CardTitle className="text-base">Data Kehadiran</CardTitle></CardHeader><CardContent className="space-y-4">
          <FormField control={form.control} name="karyawan_id" render={({ field }) => (
            <FormItem><FormLabel>Karyawan</FormLabel><Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Pilih karyawan" /></SelectTrigger></FormControl>
              <SelectContent>{kOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select><FormMessage /></FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="tanggal" render={({ field }) => (
              <FormItem><FormLabel>Tanggal</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                <SelectContent>{statusOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
            )} />
          </div>
          <FormField control={form.control} name="keterangan" render={({ field }) => (
            <FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
          )} />
        </CardContent></Card><div className="flex justify-end gap-3"><Button type="button" variant="cancel" onClick={() => router.push('/dashboard/absensi')}>Batal</Button>
          <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitting ? '...' : 'Simpan'}</Button></div></form>
      </Form>
    </div>
  )
}
