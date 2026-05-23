"use client"
import { useState, useEffect } from 'react'; import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; import { Input } from '@/components/ui/input'
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
          <Table><TableHeader><TableRow>
            <TableHead>Nama Barang</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Harga</TableHead>
            <TableHead>Satuan</TableHead>
          </TableRow></TableHeader><TableBody>
            {extracted.map((item, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{item.nama}</TableCell>
                <TableCell>{item.jumlah}</TableCell>
                <TableCell>Rp {item.harga.toLocaleString('id-ID')}</TableCell>
                <TableCell>{item.satuan}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table>}
        </CardContent></Card>
      )}
      {history.length > 0 && (
        <Card><CardHeader><CardTitle className="text-lg">Riwayat OCR</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow>
            <TableHead>File</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow></TableHeader><TableBody>
            {history.map(h => (
              <TableRow key={h.id}>
                <TableCell className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{h.file_name}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(h.extracted_at).toLocaleString('id-ID')}</TableCell>
                <TableCell><Button variant="link" size="sm" asChild><a href={h.file_url} target="_blank"><ExternalLink className="h-3 w-3 mr-1" />Lihat</a></Button></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </CardContent></Card>
      )}
    </div>
  )
}
