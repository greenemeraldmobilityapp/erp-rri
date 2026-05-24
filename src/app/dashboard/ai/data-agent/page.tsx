"use client"
import { useState, useRef } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/page-header'
import { Bot, User, Loader2, Send, Search, Database, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ChatResponse {
  answer: string
  rawData: Record<string, unknown>[]
  rowCount: number
  intent: { id: string; name: string; category: string; confidence: number } | null
  suggestions?: Array<{ id: string; name: string; confidence: number }>
  executionTimeMs: number
  error?: string
}

const suggestedQueries = [
  'List invoice yang belum lunas?',
  'Invoice overdue berapa banyak?',
  'Barang dengan stok rendah?',
  'Total AR seluruhnya?',
  'Supplier dengan PO terbesar?',
  'Status quotation QTN/2026/05/0001?',
]

export default function DataAgentPage() {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string; timestamp: Date }>>([])
  const [loading, setLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (q?: string) => {
    const text = (q ?? query).trim()
    if (!text || loading) return

    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }])
    setQuery('')
    setLoading(true)

    try {
      const r = await apiFetch<ChatResponse>('/api/v1/ai/agents/data-agent', {
        method: 'POST',
        body: JSON.stringify({ type: 'CHAT', query: text }),
      })
      const data = r.data as ChatResponse
      setLastResponse(data)
      setMessages(prev => [...prev, { role: 'ai', content: data.answer, timestamp: new Date() }])
      if (!data.intent) {
        toast.info('Query tidak dikenali, coba kata kunci yang lebih spesifik')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Query gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-0">
      <PageHeader
        title="DataAgent"
        description="Tanya database ERP pakai bahasa Indonesia — NL-to-SQL tanpa hallucination"
      />

      <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="chat"><Search className="h-4 w-4 mr-2" />Chat</TabsTrigger>
          <TabsTrigger value="info"><Database className="h-4 w-4 mr-2" />Info</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-4">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardContent className="flex flex-col h-full p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Tanya Database ERP</h3>
                    <p className="text-sm text-muted-foreground max-w-md mb-6">
                      Tanyakan apapun tentang data bisnis Anda — invoice, stok, supplier, customer, dan lainnya
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                      {suggestedQueries.map((sq, i) => (
                        <Button key={i} variant="outline" size="sm" className="text-xs" onClick={() => { setQuery(sq); handleSubmit(sq) }}>
                          {sq}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'ai' ? '' : 'flex-row-reverse'}`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'ai' ? 'bg-accent/10' : 'bg-primary/10'}`}>
                        {msg.role === 'ai' ? <Bot className="h-4 w-4 text-accent" /> : <User className="h-4 w-4 text-primary" />}
                      </div>
                      <div className={`max-w-[80%] ${msg.role === 'ai' ? '' : 'bg-primary text-primary-foreground'} rounded-lg p-3`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}

                {lastResponse && lastResponse.intent && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
                    <Database className="h-3 w-3" />
                    Intent: {lastResponse.intent.name} ({lastResponse.intent.confidence}%) &middot;
                    Data: {lastResponse.rowCount} baris &middot;
                    {lastResponse.executionTimeMs}ms
                    {lastResponse.intent.category && <Badge variant="outline" className="text-[10px]">{lastResponse.intent.category}</Badge>}
                  </div>
                )}
              </div>

              <Separator />

              <div className="p-4 bg-muted/30">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="flex gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tanya sesuatu... (contoh: Stok barang rendah)"
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button type="submit" disabled={loading || !query.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Cara Kerja NL-to-SQL</h3>
                <p className="text-sm text-muted-foreground">
                  DataAgent menerjemahkan pertanyaan Bahasa Indonesia ke SQL, execute ke PostgreSQL, lalu LLM hanya memformat hasil.
                  LLM tidak pernah menghasilkan data — hanya memformat data asli dari database.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">100+ Query Patterns</h3>
                <p className="text-sm text-muted-foreground">
                  Tersedia 100 pola query di 10 kategori: Invoice, Quotation, Sales Order, Purchase, Stock, Contract, Finance, HR, AI, Customer.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Contoh Query</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Status invoice INV/2026/05/0001</li>
                  <li>Barang dengan stok rendah</li>
                  <li>Total AR customer ABC</li>
                  <li>Performance supplier ABC</li>
                  <li>Top 10 customer berdasarkan revenue</li>
                  <li>Sales per bulan tahun ini</li>
                </ul>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Semua query parameterized — aman dari SQL injection.</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
