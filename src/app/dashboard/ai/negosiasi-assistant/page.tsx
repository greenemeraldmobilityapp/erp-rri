"use client"
import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Send, Bot, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, Loader2, MessageSquare } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

interface QuotationOption { id: string; nomor: string; customer_nama: string }
interface QuotationItemOption { id: string; barang_kode: string; barang_nama: string; harga_satuan: number; jumlah: number }
interface AnalisaResult {
  harga_diminta: number
  harga_terendah_disetujui: number
  margin_projected: number
  rekomendasi: string
  level_wewenang: 'sales' | 'manager' | 'owner'
}

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  timestamp: Date
  analisa?: AnalisaResult
  quotationId?: string
  quotationNomor?: string
  itemId?: string
  itemNama?: string
  userMessage?: string
  accepted?: boolean
}

const formSchema = z.object({
  quotation_id: z.string().min(1, 'Pilih quotation'),
  quotation_item_id: z.string().min(1, 'Pilih item'),
  harga_diminta: z.coerce.number().positive('Harga harus positif'),
  pesan: z.string().optional(),
})

type FormValues = z.input<typeof formSchema>

const approvalVariant = (level: string) => {
  if (level === 'sales') return 'success'
  if (level === 'manager') return 'warning'
  return 'destructive'
}

const approvalLabel = (level: string) => {
  if (level === 'sales') return 'Approval Sales'
  if (level === 'manager') return 'Approval Manager'
  return 'Approval Owner'
}

export default function NegosiasiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [quotationOpts, setQuotationOpts] = useState<QuotationOption[]>([])
  const [itemOpts, setItemOpts] = useState<QuotationItemOption[]>([])
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [showForm, setShowForm] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { harga_diminta: 0 },
  })

  useEffect(() => {
    apiFetch<QuotationOption[]>('/api/v1/quotation?status=sent')
      .then(r => setQuotationOpts(r.data ?? []))
      .catch(() => toast.error('Gagal memuat quotation'))
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleQuotationChange = async (quotationId: string) => {
    const q = quotationOpts.find(q => q.id === quotationId)
    setSelectedQuotation(q ?? null)
    form.setValue('quotation_id', quotationId)
    form.setValue('quotation_item_id', '')
    setItemOpts([])

    if (quotationId) {
      try {
        const r = await apiFetch<{ items: QuotationItemOption[] }>(`/api/v1/quotation/${quotationId}`)
        setItemOpts(r.data?.items ?? [])
      } catch {
        toast.error('Gagal memuat item quotation')
      }
    }
  }

  const handleItemChange = (itemId: string) => {
    form.setValue('quotation_item_id', itemId)
    const item = itemOpts.find(i => i.id === itemId)
    if (item) {
      form.setValue('harga_diminta', item.harga_satuan)
    }
  }

  const handleAnalisa = async (data: FormValues) => {
    setAnalysing(true)
    const q = selectedQuotation
    const item = itemOpts.find(i => i.id === data.quotation_item_id)

    try {
      const r = await apiFetch<AnalisaResult>('/api/v1/ai/negosiasi-assistant', {
        method: 'POST',
        body: JSON.stringify({
          quotation_id: data.quotation_id,
          barang_id: item?.barang_kode ?? '',
          harga_diminta: data.harga_diminta,
        }),
      })

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        timestamp: new Date(),
        analisa: r.data,
        quotationId: data.quotation_id,
        quotationNomor: q?.nomor,
        itemId: data.quotation_item_id,
        itemNama: item ? `[${item.barang_kode}] ${item.barang_nama}` : undefined,
        userMessage: data.pesan || undefined,
      }
      setMessages(prev => [...prev, aiMessage])
      setShowForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menganalisa')
    } finally {
      setAnalysing(false)
    }
  }

  const handleAccept = async (msg: ChatMessage) => {
    if (!msg.analisa || !msg.quotationId || !msg.itemId) return
    setLoading(true)
    try {
      await apiFetch('/api/v1/negoiasi', {
        method: 'POST',
        body: JSON.stringify({
          quotation_id: msg.quotationId,
          tanggal: new Date().toISOString().split('T')[0],
          keterangan: `Counter offer dari AI Assistant`,
          items: [{
            quotation_item_id: msg.itemId,
            harga_satuan_baru: msg.analisa.harga_terendah_disetujui,
            alasan: `AI Rekomendasi: ${msg.analisa.rekomendasi}`,
          }],
        }),
      })
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, accepted: true } : m))
      toast.success('Negosiasi berhasil disimpan!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  const handleNewAnalysis = () => {
    setShowForm(true)
    form.reset()
    setItemOpts([])
    setSelectedQuotation(null)
  }

  const formatCurrency = (v: number) => `Rp ${v.toLocaleString('id-ID')}`

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">AI Negosiasi Assistant</h1>
          <p className="text-muted-foreground mt-1">Analisa & counter offer harga secara interaktif</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => { setMessages([]); handleNewAnalysis() }}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Baru
          </Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex flex-col h-full p-0">
          <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Mulai Percakapan</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Pilih quotation dan item, masukkan harga yang diminta untuk mendapatkan analisa AI
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(msg => (
                  <div key={msg.id}>
                    {msg.role === 'ai' && msg.analisa && (
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-accent" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">AI Analisa</span>
                              <span className="text-xs text-muted-foreground">
                                {msg.quotationNomor} &middot; {msg.itemNama}
                              </span>
                              {msg.userMessage && (
                                <span className="text-xs text-muted-foreground italic">
                                  &ldquo;{msg.userMessage}&rdquo;
                                </span>
                              )}
                            </div>

                            <div className="rounded-lg border border-border overflow-hidden">
                              <div className="grid grid-cols-3 divide-x border-b border-border">
                                <div className="p-3 text-center">
                                  <p className="text-xs text-muted-foreground">Harga Diminta</p>
                                  <p className="text-sm font-bold mt-1">{formatCurrency(msg.analisa.harga_diminta)}</p>
                                </div>
                                <div className="p-3 text-center">
                                  <p className="text-xs text-muted-foreground">Harga Minimal</p>
                                  <p className="text-sm font-bold mt-1 text-success">{formatCurrency(msg.analisa.harga_terendah_disetujui)}</p>
                                </div>
                                <div className="p-3 text-center">
                                  <p className="text-xs text-muted-foreground">Margin Proyeksi</p>
                                  <p className={`text-sm font-bold mt-1 ${msg.analisa.margin_projected >= 0.05 ? 'text-success' : 'text-destructive'}`}>
                                    {msg.analisa.margin_projected >= 0 ? '+' : ''}{Math.round(msg.analisa.margin_projected * 100)}%
                                  </p>
                                </div>
                              </div>

                              <div className="p-3 bg-muted/30 space-y-3">
                                <div className="flex items-start gap-2">
                                  {msg.analisa.margin_projected >= 0.05 ? (
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                  )}
                                  <p className="text-sm">{msg.analisa.rekomendasi}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                  <Badge variant={approvalVariant(msg.analisa.level_wewenang)}>
                                    {approvalLabel(msg.analisa.level_wewenang)}
                                  </Badge>
                                  {msg.analisa.margin_projected >= 0.15 && (
                                    <span className="flex items-center gap-1 text-xs text-success">
                                      <TrendingUp className="h-3 w-3" />Margin Bagus
                                    </span>
                                  )}
                                  {msg.analisa.margin_projected < 0 && (
                                    <span className="flex items-center gap-1 text-xs text-destructive">
                                      <TrendingDown className="h-3 w-3" />Below Cost
                                    </span>
                                  )}
                                </div>
                              </div>

                              {!msg.accepted ? (
                                <div className="p-3 flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleAccept(msg)}
                                    disabled={loading}
                                  >
                                    {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                                    Accept Harga Minimal
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (msg.quotationId) {
                                        form.setValue('quotation_id', msg.quotationId)
                                        setShowForm(true)
                                      }
                                    }}
                                  >
                                    Counter Offer
                                  </Button>
                                </div>
                              ) : (
                                <div className="p-3">
                                  <Badge variant="success" className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Negosiasi disimpan ke sistem
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {showForm && (
            <div className="p-4 bg-muted/30">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAnalisa)} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="quotation_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quotation</FormLabel>
                          <FormControl>
                            <Select onValueChange={handleQuotationChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih quotation..." />
                              </SelectTrigger>
                              <SelectContent>
                                {quotationOpts.map(q => (
                                  <SelectItem key={q.id} value={q.id}>
                                    {q.nomor} - {q.customer_nama}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quotation_item_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Barang</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={handleItemChange}
                              value={field.value}
                              disabled={!itemOpts.length}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={itemOpts.length ? 'Pilih item...' : 'Pilih quotation dulu'} />
                              </SelectTrigger>
                              <SelectContent>
                                {itemOpts.map(i => (
                                  <SelectItem key={i.id} value={i.id}>
                                    [{i.barang_kode}] {i.barang_nama} - {formatCurrency(i.harga_satuan)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="harga_diminta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Harga Diminta (Rp)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={1000}
                              value={field.value != null ? String(field.value) : ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pesan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pesan (opsional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: Customer minta diskon 10%" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={analysing}>
                      {analysing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Menganalisa...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Analisa & Kirim
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}