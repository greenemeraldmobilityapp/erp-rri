"use client"
import { useState, useEffect, useRef } from 'react'; import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, FileText, ExternalLink, FileUp, X, Eye } from 'lucide-react'; import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface OcrHistory { id: string; file_name: string; file_url: string; extracted_at: string; keterangan: string | null }
interface ExtractedItem { nama: string; jumlah: number; harga: number; satuan: string }

export default function OcrKontrakPage() {
  const [processing, setProcessing] = useState(false);
  const [history, setHistory] = useState<OcrHistory[]>([]);
  const [extracted, setExtracted] = useState<ExtractedItem[] | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const historyData = await apiFetch<OcrHistory[]>('/api/v1/ai/ocr-kontrak');
        setHistory(historyData.data ?? []);
      } catch (error) {
        console.error('Failed to fetch OCR history:', error);
      }
    };
    loadHistory();
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!file.name.endsWith('.pdf')) {
      toast.error('Hanya file PDF');
      return;
    }
    setProcessing(true);
    setExtracted(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const r = await apiFetch<OcrHistory & { extracted_items: ExtractedItem[] }>('/api/v1/ai/ocr-kontrak', {
        method: 'POST',
        body: formData,
        headers: {}
      });
      setExtracted(r.data.extracted_items);
      toast.success('OCR berhasil!');
      const historyData = await apiFetch<OcrHistory[]>('/api/v1/ai/ocr-kontrak');
      setHistory(historyData.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await handleFile(file);
  };

  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setExtracted(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">AI OCR Kontrak</h1>
        <p className="text-muted-foreground mt-1">Ekstrak data dari file PDF kontrak</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload PDF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors duration-200 ${dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50 hover:bg-muted/50'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleUpload}
                className="hidden"
              />
              {processing ? (
                <>
                  <Loader2 className="h-10 w-10 text-accent animate-spin" />
                  <p className="text-sm text-muted-foreground">Memproses OCR...</p>
                </>
              ) : (
                <>
                  <FileUp className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Drag & drop file PDF di sini</p>
                    <p className="text-xs text-muted-foreground mt-1">atau klik untuk pilih file</p>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">Format: PDF, maks 10MB</p>

            {/* PDF Preview */}
            {previewUrl && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Preview PDF</p>
                  <Button variant="ghost" size="sm" onClick={clearPreview}>
                    <X className="h-4 w-4 mr-1" />
                    Tutup
                  </Button>
                </div>
                <iframe
                  src={previewUrl}
                  className="w-full h-64 rounded-md border border-border"
                  title="PDF Preview"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Extraction Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hasil Ekstraksi</CardTitle>
          </CardHeader>
          <CardContent>
            {processing ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : extracted !== null ? (
              extracted.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">Tidak ada data yang terekstrak</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{extracted.length} item ditemukan</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Barang</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Satuan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extracted.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{item.nama}</TableCell>
                          <TableCell>{item.jumlah}</TableCell>
                          <TableCell>Rp {item.harga.toLocaleString('id-ID')}</TableCell>
                          <TableCell>{item.satuan}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <Eye className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">Upload PDF untuk melihat hasil ekstraksi</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Riwayat OCR</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {h.file_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(h.extracted_at).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Button variant="link" size="sm" asChild>
                        <a href={h.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Lihat
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}