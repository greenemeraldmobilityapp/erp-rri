"use client"
import { useState, useRef } from 'react'
import { getAuthToken } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { FileSpreadsheet, Upload, CheckCircle2, XCircle, Eye, Download } from 'lucide-react'

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

interface ImportResponse {
  dry_run: boolean
  total_success: number
  total_failed: number
  details: Record<string, ImportResult>
}

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Record<string, Array<Record<string, unknown>>>>({})
  const [result, setResult] = useState<ImportResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const readPreview = async (f: File) => {
    setLoadingPreview(true)
    try {
      const XLSX = await import('xlsx')
      const buffer = await f.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheets: Record<string, Array<Record<string, unknown>>> = {}
      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name]
        const rows = XLSX.utils.sheet_to_json(sheet) as Array<Record<string, unknown>>
        sheets[name] = rows.slice(0, 5)
      }
      setPreview(sheets)
    } catch {
      toast.error('Gagal membaca file Excel')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      toast.error('Hanya file Excel (.xlsx / .xls) yang didukung')
      return
    }
    setFile(f)
    setResult(null)
    readPreview(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const doImport = async (dryRun: boolean) => {
    if (!file) return
    setLoading(true)
    const toastId = toast.loading(dryRun ? 'Memvalidasi...' : 'Mengimpor...')
    try {
      const token = await getAuthToken()
      const formData = new FormData()
      formData.append('file', file)
      const url = `/api/v1/tools/bulk-import${dryRun ? '?dry_run=true' : ''}`
      const r = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error || 'Gagal mengimpor')
      setResult(json)
      const total = json.total_success + json.total_failed
      const msg = dryRun
        ? `Validasi selesai: ${json.total_success} berhasil, ${json.total_failed} gagal`
        : `Import selesai: ${json.total_success} berhasil, ${json.total_failed} gagal dari ${total} data`
      if (json.total_failed > 0) {
        toast.warning(msg, { id: toastId })
      } else {
        toast.success(msg, { id: toastId })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengimpor'
      toast.error(msg, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const sheetLabels: Record<string, string> = {
    barang: 'Barang',
    supplier: 'Supplier',
    customer: 'Customer',
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="Import Excel"
        description="Upload file Excel untuk mengimpor data barang, supplier, dan customer secara massal"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload File Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">
              {file ? file.name : 'Tarik & lepas file Excel di sini, atau klik untuk memilih'}
            </p>
            <p className="text-xs text-muted-foreground">
              Format: .xlsx atau .xls
            </p>
          </div>

          {file && (
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => doImport(true)} disabled={loading || loadingPreview} variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                {loadingPreview ? 'Membaca...' : 'Preview'}
              </Button>
              <Button onClick={() => doImport(false)} disabled={loading || loadingPreview}>
                <Download className="h-4 w-4 mr-1" />
                {loading ? 'Memproses...' : 'Import'}
              </Button>
              <Button onClick={() => { setFile(null); setPreview({}); setResult(null) }} variant="ghost">
                Hapus
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {loadingPreview && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Membaca file...
          </CardContent>
        </Card>
      )}

      {Object.keys(preview).length > 0 && !loadingPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(preview).map(([sheetName, rows]) => (
              <div key={sheetName}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  {sheetLabels[sheetName] ?? sheetName}
                  <Badge variant="outline" className="ml-1">{rows.length} baris</Badge>
                </h3>
                {rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Kosong</p>
                ) : (
                  <div className="overflow-x-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(rows[0]).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).map((val, j) => (
                              <TableCell key={j} className="text-xs">{String(val ?? '')}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.dry_run ? <Eye className="h-5 w-5" /> : result.total_failed === 0 ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-destructive" />}
              Hasil {result.dry_run ? 'Validasi' : 'Import'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Berhasil: <strong>{result.total_success}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>Gagal: <strong>{result.total_failed}</strong></span>
              </div>
            </div>

            {Object.entries(result.details).map(([sheetName, res]) => (
              <div key={sheetName}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  {sheetLabels[sheetName] ?? sheetName}
                  <Badge variant="default">{res.success} berhasil</Badge>
                  {res.failed > 0 && <Badge variant="destructive">{res.failed} gagal</Badge>}
                </h3>
                {res.errors.length > 0 && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                    {res.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive">{err}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
