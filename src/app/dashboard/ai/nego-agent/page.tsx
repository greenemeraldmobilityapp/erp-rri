"use client"
import { useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { CheckCircle2, AlertCircle, TrendingUp, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

interface NegoResult {
  id: string
  barang_id: string
  harga_beli: number
  harga_diminta: number
  harga_counter: number | null
  margin_percent: number
  recommendation: 'ACCEPT' | 'COUNTER' | 'REJECT'
  approval_level: 'sales' | 'manager' | 'owner'
  risk_score: number
  reasoning_chain: string
  summary: string
  warnings: string[]
  created_at: string
}

const formSchema = z.object({
  barang_id: z.string().min(1, 'ID Barang harus diisi'),
  harga_beli: z.coerce.number().positive('Harga beli harus positif'),
  harga_diminta: z.coerce.number().positive('Harga diminta harus positif'),
  customer_tier: z.string().optional(),
  payment_terms: z.string().optional(),
  customer_name: z.string().optional(),
})

type FormValues = z.input<typeof formSchema>

const recommendationVariant = (rec: string) => {
  if (rec === 'ACCEPT') return 'success'
  if (rec === 'COUNTER') return 'warning'
  return 'destructive'
}

const approvalLabel = (level: string) => {
  if (level === 'sales') return 'Approval Sales'
  if (level === 'manager') return 'Approval Manager'
  return 'Approval Owner'
}

export default function NegoAgentPage() {
  const [result, setResult] = useState<NegoResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { harga_beli: 0, harga_diminta: 0 },
  })

  const handleSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      const r = await apiFetch<NegoResult>('/api/v1/ai/agents/nego-agent', {
        method: 'POST',
        body: JSON.stringify({
          barang_id: data.barang_id,
          harga_beli: data.harga_beli,
          harga_diminta: data.harga_diminta,
          customer_tier: data.customer_tier || undefined,
          payment_terms: data.payment_terms || undefined,
          customer_name: data.customer_name || undefined,
          use_streaming: false,
        }),
      })
      setResult(r.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analisa gagal')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (v: number) => `Rp ${v.toLocaleString('id-ID')}`

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-0">
      <PageHeader
        title="NegoAgent"
        description="Analisa margin, approval routing & risk assessment"
        actions={result ? (
          <Button variant="outline" size="sm" onClick={() => { setResult(null); form.reset() }}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Analisa Baru
          </Button>
        ) : undefined}
      />

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex flex-col h-full p-6">
          {loading ? (
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
              </div>
              <div className="flex justify-end"><Skeleton className="h-10 w-44" /></div>
            </div>
          ) : !result ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="barang_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Barang</FormLabel>
                      <FormControl><Input placeholder="BRG-001" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="customer_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Customer (opsional)</FormLabel>
                      <FormControl><Input placeholder="PT ABC" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="harga_beli" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Beli (Rp)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1000}
                          value={field.value != null ? String(field.value) : ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                          onBlur={field.onBlur} name={field.name} ref={field.ref} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="harga_diminta" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Diminta (Rp)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1000}
                          value={field.value != null ? String(field.value) : ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                          onBlur={field.onBlur} name={field.name} ref={field.ref} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="customer_tier" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tier Customer</FormLabel>
                      <FormControl><Input placeholder="A / B / C" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="payment_terms" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl><Input placeholder="Net 30" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menganalisa...</> : 'Analisa Negosiasi'}
                  </Button>
                </div>
              </form>
            </Form>
          ) : result ? (
            <div className="space-y-4">
              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-4 divide-x border-b">
                  <div className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Harga Beli</p>
                    <p className="text-sm font-bold mt-1">{formatCurrency(result.harga_beli)}</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Harga Diminta</p>
                    <p className="text-sm font-bold mt-1">{formatCurrency(result.harga_diminta)}</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Counter Offer</p>
                    <p className="text-sm font-bold mt-1">{result.harga_counter ? formatCurrency(result.harga_counter) : '-'}</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Margin</p>
                    <p className={`text-sm font-bold mt-1 ${result.margin_percent >= 15 ? 'text-success' : result.margin_percent >= 0 ? 'text-warning' : 'text-destructive'}`}>
                      {result.margin_percent.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={recommendationVariant(result.recommendation)} className="text-sm px-3 py-1">
                      {result.recommendation === 'ACCEPT' ? <CheckCircle2 className="h-3 w-3 mr-1" /> :
                       result.recommendation === 'COUNTER' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                       <AlertCircle className="h-3 w-3 mr-1" />}
                      {result.recommendation}
                    </Badge>
                    <Badge variant="outline">{approvalLabel(result.approval_level)}</Badge>
                    <Badge variant={result.risk_score > 70 ? 'destructive' : result.risk_score > 40 ? 'warning' : 'success'}>
                      Risk: {result.risk_score}
                    </Badge>
                  </div>

                  <p className="text-sm">{result.summary}</p>

                  {result.warnings.length > 0 && (
                    <div className="space-y-1">
                      {result.warnings.map((w, i) => (
                        <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />{w}
                        </p>
                      ))}
                    </div>
                  )}

                  {result.reasoning_chain && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setShowReasoning(!showReasoning)}>
                        {showReasoning ? 'Sembunyikan' : 'Lihat'} AI Reasoning
                      </Button>
                      {showReasoning && (
                        <div className="bg-muted p-3 rounded text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {result.reasoning_chain}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
