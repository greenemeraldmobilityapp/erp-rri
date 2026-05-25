"use client"
import Link from 'next/link'
import { useState } from 'react'; import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'; import { toast } from 'sonner'

export default function TambahGudangPage() {
  const router = useRouter(); const [submitting, setSubmitting] = useState(false)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSubmitting(true); const fd = new FormData(e.currentTarget)
    try { await apiFetch('/api/v1/master/gudang', { method: 'POST', body: JSON.stringify({ nama: fd.get('nama'), lokasi: fd.get('lokasi'), keterangan: fd.get('keterangan') }) }); toast.success('Gudang berhasil!'); router.push('/dashboard/inventory/gudang') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setSubmitting(false) }
  }
  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild><Link href="/dashboard/inventory/gudang"><ArrowLeft className="h-5 w-5" /></Link></Button><div><h1 className="text-3xl font-heading font-bold">Tambah Gudang</h1></div></div>
      <form onSubmit={onSubmit} className="space-y-6"><Card><CardHeader><CardTitle className="text-base">Data Gudang</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="space-y-2"><label className="text-sm font-medium">Nama *</label><Input name="nama" required placeholder="Gudang Utama" /></div>
        <div className="space-y-2"><label className="text-sm font-medium">Lokasi</label><Input name="lokasi" placeholder="Jl. Raya ..." /></div>
        <div className="space-y-2"><label className="text-sm font-medium">Keterangan</label><Textarea name="keterangan" rows={2} /></div>
      </CardContent></Card><div className="flex justify-end gap-3"><Button type="button" className="bg-red-500/70 text-white hover:bg-red-500/90"><Link href="/dashboard/inventory/gudang">Batal</Link></Button>
        <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitting ? '...' : 'Simpan'}</Button></div></form>
    </div>
  )
}
