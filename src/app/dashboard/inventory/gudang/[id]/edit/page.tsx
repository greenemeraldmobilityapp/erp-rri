"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'; import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

export default function EditGudangPage() {
  const router = useRouter(); const params = useParams(); const [submitting, setSubmitting] = useState(false); const [loading, setLoading] = useState(true)
  const [defaults, setDefaults] = useState({ nama: '', lokasi: '', keterangan: '' })
  useEffect(() => { apiFetch<{ nama: string; lokasi: string; keterangan: string }>(`/api/v1/master/gudang/${params.id}`).then(r => { const d = r.data; setDefaults({ nama: d.nama, lokasi: d.lokasi ?? '', keterangan: d.keterangan ?? '' }) }).catch(() => toast.error('Gagal')).finally(() => setLoading(false)) }, [params.id])
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSubmitting(true); const fd = new FormData(e.currentTarget)
    try { await apiFetch(`/api/v1/master/gudang/${params.id}`, { method: 'PUT', body: JSON.stringify({ nama: fd.get('nama'), lokasi: fd.get('lokasi'), keterangan: fd.get('keterangan') }) }); toast.success('Gudang diupdate!'); router.push('/dashboard/inventory/gudang') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setSubmitting(false) }
  }
  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><Link href="/dashboard/inventory/gudang"><ArrowLeft className="h-5 w-5" /></Link></Button><div><h1 className="text-3xl font-heading font-bold">Edit Gudang</h1></div></div>
      <form onSubmit={onSubmit} className="space-y-6"><Card><CardHeader><CardTitle className="text-base">Data Gudang</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="space-y-2"><label className="text-sm font-medium">Nama *</label><Input name="nama" defaultValue={defaults.nama} required /></div>
        <div className="space-y-2"><label className="text-sm font-medium">Lokasi</label><Input name="lokasi" defaultValue={defaults.lokasi} /></div>
        <div className="space-y-2"><label className="text-sm font-medium">Keterangan</label><Textarea name="keterangan" defaultValue={defaults.keterangan} rows={2} /></div>
      </CardContent></Card><div className="flex justify-end gap-3"><Button type="button" variant="cancel"><Link href="/dashboard/inventory/gudang">Batal</Link></Button>
        <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitting ? '...' : 'Simpan'}</Button></div></form>
    </div>
  )
}
