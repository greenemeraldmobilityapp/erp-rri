"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'; import { useRouter, useParams } from 'next/navigation'; import { z } from 'zod'; import { useForm } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

const schema = z.object({ status: z.string().optional(), keterangan: z.string().optional() })
type FV = z.input<typeof schema>
const statusOpts = [{ value: 'draft', label: 'Draft' }, { value: 'awaiting_pickup', label: 'Siap Kirim' }, { value: 'dikirim', label: 'Dikirim' }, { value: 'selesai', label: 'Selesai' }]

export default function EditDoPage() {
  const router = useRouter(); const params = useParams(); const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, reset } = useForm<FV>({ resolver: zodResolver(schema) })
  useEffect(() => {
    apiFetch<{ status: string; keterangan: string | null }>(`/api/v1/delivery-order/${params.id}`)
      .then(r => { reset({ status: r.data.status, keterangan: r.data.keterangan ?? '' }); setLoading(false) })
      .catch(() => { toast.error('Gagal'); router.push('/dashboard/delivery-order') })
  }, [params.id, reset, router])
  const onSubmit = async (data: FV) => {
    setSubmitting(true); try { await apiFetch(`/api/v1/delivery-order/${params.id}`, { method: 'PUT', body: JSON.stringify(data) }); toast.success('Diupdate!'); router.push('/dashboard/delivery-order') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setSubmitting(false) }
  }
  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><Link href="/dashboard/delivery-order"><ArrowLeft className="h-5 w-5" /></Link></Button><div><h1 className="text-3xl font-heading font-bold">Edit DO</h1></div></div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card><CardContent className="space-y-4 pt-6">
          <div className="space-y-2"><label className="text-sm font-medium">Status</label>
            <select {...register('status')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring">{statusOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div className="space-y-2"><label className="text-sm font-medium">Keterangan</label><Textarea {...register('keterangan')} rows={3} /></div>
        </CardContent></Card>
        <div className="flex justify-end gap-3"><Button type="button" variant="cancel"><Link href="/dashboard/delivery-order">Batal</Link></Button><Button type="submit" disabled={submitting}>{submitting ? '...' : 'Update'}</Button></div>
      </form>
    </div>
  )
}
