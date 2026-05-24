"use client"
import { useState, useRef } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import { Upload, FileText, Loader2, AlertCircle, History } from 'lucide-react'
import { toast } from 'sonner'

interface VisionResult {
  id: string
  source_type: string
  file_name: string
  extracted: Record<string, unknown>
  confidence: number
  warnings: string[]
  readability: string
  model_used: string
  latency_ms: number
  created_at: string
}

export default function VisionAgentPage() {
  const [taskType, setTaskType] = useState('invoice')
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<VisionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<VisionResult[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('task_type', taskType)

    try {
      const r = await fetch('/api/v1/ai/agents/vision-agent', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('supabase_access_token') ?? ''}`,
        },
        body: formData,
      })
      const json = await r.json()
      if (json.error) {
        toast.error(json.error)
      } else {
        setResult(json.data)
        toast.success('Dokumen berhasil diproses!')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload gagal')
    } finally {
      setLoading(false)
    }
  }

  const handleUrlSubmit = async () => {
    if (!url.trim()) return
    setLoading(true)

    try {
      const r = await apiFetch<VisionResult>('/api/v1/ai/agents/vision-agent', {
        method: 'POST',
        body: JSON.stringify({ file_url: url, task_type: taskType }),
      })
      setResult(r.data)
      toast.success('URL berhasil diproses!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Proses URL gagal')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const r = await apiFetch<VisionResult[]>('/api/v1/ai/agents/vision-agent')
      setHistory(r.data ?? [])
      setShowHistory(!showHistory)
    } catch {
      toast.error('Gagal mengambil history')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-0">
      <PageHeader
        title="VisionAgent"
        description="OCR dokumen — kontrak, invoice, kwitansi, delivery order"
        actions={
          <Button variant="outline" size="sm" onClick={fetchHistory}>
            <History className="h-4 w-4 mr-2" />
            {showHistory ? 'Tutup History' : 'History'}
          </Button>
        }
      />

      <Tabs defaultValue="upload" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-2" />Upload</TabsTrigger>
          <TabsTrigger value="url"><FileText className="h-4 w-4 mr-2" />URL</TabsTrigger>
          <TabsTrigger value="result" disabled={!result}><FileText className="h-4 w-4 mr-2" />Hasil</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="flex-1 mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Jenis Dokumen</Label>
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="receipt">Kwitansi</SelectItem>
                    <SelectItem value="delivery">Delivery Order</SelectItem>
                    <SelectItem value="kontrak">Kontrak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-accent/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Klik untuk upload file</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG — maks 10MB</p>
                {fileName && <p className="text-xs text-accent mt-2">{fileName}</p>}
                {loading && <Loader2 className="h-5 w-5 animate-spin mx-auto mt-2" />}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url" className="flex-1 mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Jenis Dokumen</Label>
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="receipt">Kwitansi</SelectItem>
                    <SelectItem value="delivery">Delivery Order</SelectItem>
                    <SelectItem value="kontrak">Kontrak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/invoice.jpg"
                  className="flex-1"
                  disabled={loading}
                />
                <Button onClick={handleUrlSubmit} disabled={loading || !url.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Proses'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result" className="flex-1 mt-4">
          {result && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={result.confidence > 0.8 ? 'success' : result.confidence > 0.5 ? 'warning' : 'destructive'}>
                      Confidence: {Math.round(result.confidence * 100)}%
                    </Badge>
                    <Badge variant="outline">{result.source_type}</Badge>
                    {result.readability && <Badge variant="outline">{result.readability}</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{result.latency_ms}ms</span>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Data Terekstrak</h4>
                  <div className="bg-muted p-3 rounded max-h-64 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result.extracted, null, 2)}</pre>
                  </div>
                </div>

                {result.warnings.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-warning">Warnings</h4>
                    {result.warnings.map((w, i) => (
                      <p key={i} className="text-sm flex items-center gap-1 text-warning">
                        <AlertCircle className="h-3 w-3" />{w}
                      </p>
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Model: {result.model_used} &middot; {result.created_at}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {showHistory && (
        <Card className="mt-4">
          <CardContent className="p-4 max-h-48 overflow-y-auto">
            <h4 className="font-semibold mb-2 text-sm">History OCR</h4>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada history</p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span>{h.file_name}</span>
                      <Badge variant="outline" className="text-[10px]">{h.source_type}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
