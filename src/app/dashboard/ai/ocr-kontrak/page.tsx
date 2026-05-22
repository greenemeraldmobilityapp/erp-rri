"use client"
import { useState, useEffect } from 'react'; import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; import { Input } from '@/components/ui/input'
import { Upload, Loader2, FileText, ExternalLink } from 'lucide-react'; import { toast } from 'sonner'

interface OcrHistory { id: string; file_name: string; file_url: string; extracted_at: string; keterangan: string | null }
interface ExtractedItem { nama: string; jumlah: number; harga: number; satuan: string }

export default function OcrKontrakPage() {
  const [uploading, setUploading] = useState(false); const [history, setHistory] = useState<OcrHistory[]>([]); const [extracted, setExtracted] = useState<ExtractedItem[] | null>(null)

  useEffect(() => { apiFetch<OcrHistory[]>('/api/v1/ai/ocr-kontrak').then(r => setHistory(r.data ?? [])).catch(() => {}) }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.pdf')) { toast.error('Hanya file PDF'); return }
    setUploading(true); setExtracted(null)
    try {
      const formData = new FormData(); formData.append('file', file)
      const r = await apiFetch<OcrHistory & { extracted_items: ExtractedItem[] }>('/api/v1/ai/ocr-kontrak', { method: 'POST', body: formData, headers: {} })
      setExtracted(r.data.extracted_items)
      toast.success('OCR berhasil!')
      const h = await apiFetch<OcrHistory[]>('/api/v1/ai/ocr-kontrak'); setHistory(h.data ?? [])
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setUploading(false) }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">AI OCR Kontrak</h1><p className="text-muted-foreground mt-1">Ekstrak data dari file PDF kontrak</p></div>
      <Card><CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Input type="file" accept=".pdf" onChange={handleUpload} disabled={uploading} className="max-w-sm" />
          <Button disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}{uploading ? 'Memproses...' : 'Upload & OCR'}</Button>
        </div>
      </CardContent></Card>
      {extracted && (
        <Card><CardHeader><CardTitle className="text-lg">Hasil Ekstraksi</CardTitle></CardHeader><CardContent>
          {extracted.length === 0 ? <p className="text-muted-foreground">Tidak ada data yang terekstrak</p> :
          <table className="w-full"><thead><tr className="border-b bg-muted/50 text-left">
            <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Nama Barang</th>
            <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Jumlah</th>
            <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Harga</th>
            <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Satuan</th>
          </tr></thead><tbody className="divide-y">
            {extracted.map((item, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="p-3 text-sm font-medium">{item.nama}</td>
                <td className="p-3 text-sm">{item.jumlah}</td>
                <td className="p-3 text-sm">Rp {item.harga.toLocaleString('id-ID')}</td>
                <td className="p-3 text-sm">{item.satuan}</td>
              </tr>
            ))}
          </tbody></table>}
        </CardContent></Card>
      )}
      {history.length > 0 && (
        <Card><CardHeader><CardTitle className="text-lg">Riwayat OCR</CardTitle></CardHeader><CardContent>
          <table className="w-full"><thead><tr className="border-b bg-muted/50 text-left">
            <th className="p-3 text-xs font-medium text-muted-foreground uppercase">File</th>
            <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Tanggal</th>
            <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Aksi</th>
          </tr></thead><tbody className="divide-y">
            {history.map(h => (
              <tr key={h.id} className="hover:bg-muted/30">
                <td className="p-3 text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{h.file_name}</td>
                <td className="p-3 text-sm text-muted-foreground">{new Date(h.extracted_at).toLocaleString('id-ID')}</td>
                <td className="p-3 text-sm"><Button variant="link" size="sm" asChild><a href={h.file_url} target="_blank"><ExternalLink className="h-3 w-3 mr-1" />Lihat</a></Button></td>
              </tr>
            ))}
          </tbody></table>
        </CardContent></Card>
      )}
    </div>
  )
}
