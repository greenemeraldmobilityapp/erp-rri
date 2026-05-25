"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'; import { useRouter, useParams } from 'next/navigation'; import { z } from 'zod'; import { useForm } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'
const schema = z.object({ status: z.string().optional(), gaji_pokok: z.coerce.number().optional(), tunjangan: z.coerce.number().optional(), potongan: z.coerce.number().optional(), tanggal_pembayaran: z.string().optional(), keterangan: z.string().optional() })
type FV = z.input<typeof schema>
const statusOpts = [{ value: 'draft', label: 'Draft' }, { value: 'paid', label: 'Dibayar' }, { value: 'pending', label: 'Pending' }]
export default function EditPenggajianPage() {
  const router = useRouter(); const params = useParams(); const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, reset, watch } = useForm<FV>({ resolver: zodResolver(schema) })
  const gp = watch('gaji_pokok', 0); const tj = watch('tunjangan', 0); const pt = watch('potongan', 0)
  useEffect(() => {
    apiFetch<{ status: string; gaji_pokok: number; tunjangan: number; potongan: number; keterangan: string | null; tanggal_pembayaran: string | null }>(`/api/v1/penggajian/${params.id}`)
      .then(r => { reset({ status: r.data.status, gaji_pokok: r.data.gaji_pokok, tunjangan: r.data.tunjangan, potongan: r.data.potongan, keterangan: r.data.keterangan ?? '', tanggal_pembayaran: r.data.tanggal_pembayaran?.split('T')[0] ?? '' }); setLoading(false) }).catch(() => { toast.error('Gagal'); router.push('/dashboard/penggajian') })
  }, [params.id, reset, router])
  const onSubmit = async (data: FV) => {
    setSubmitting(true); try { await apiFetch(`/api/v1/penggajian/${params.id}`, { method: 'PUT', body: JSON.stringify(data) }); toast.success('Diupdate!'); router.push('/dashboard/penggajian') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setSubmitting(false) }
  }
  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  return (
    <div className="max-w-xl space-y-6"><div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><Link href="/dashboard/penggajian"><ArrowLeft className="h-5 w-5" /></Link></Button><div><h1 className="text-3xl font-heading font-bold">Edit Penggajian</h1></div></div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6"><Card><CardContent className="space-y-4 pt-6">
        <div className="space-y-2"><label className="text-sm font-medium">Status</label>
          <select {...register('status')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring">{statusOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><label className="text-sm font-medium">Gaji Pokok</label><Input type="number" step="0.01" {...register('gaji_pokok')} /></div>
          <div className="space-y-2"><label className="text-sm font-medium">Tunjangan</label><Input type="number" step="0.01" {...register('tunjangan')} /></div>
          <div className="space-y-2"><label className="text-sm font-medium">Potongan</label><Input type="number" step="0.01" {...register('potongan')} /></div>
        </div>
        <div><p className="text-sm">Gaji Bersih: <strong>Rp {((Number(gp) || 0) + (Number(tj) || 0) - (Number(pt) || 0)).toLocaleString('id-ID')}</strong></p></div>
        <div className="space-y-2"><label className="text-sm font-medium">Tgl Pembayaran</label><Input type="date" {...register('tanggal_pembayaran')} /></div>
        <div className="space-y-2"><label className="text-sm font-medium">Keterangan</label><Textarea {...register('keterangan')} rows={3} /></div>
      </CardContent></Card><div className="flex justify-end gap-3"><Button type="button" className="bg-red-500/70 text-white hover:bg-red-500/90" asChild><Link href="/dashboard/penggajian">Batal</Link></Button><Button type="submit" disabled={submitting}>{submitting ? '...' : 'Update'}</Button></div></form>
    </div>
  )
}
