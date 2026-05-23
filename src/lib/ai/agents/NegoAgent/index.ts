import { createNvidiaClient, AI_MODELS, MODEL_CONFIGS } from '@/lib/ai/client'
import { StreamingAccumulator } from '@/lib/ai/streaming'
import { buildNegoPrompt } from './prompts'
import { calculateMargin, suggestCounterPrice } from './tools/marginCalculator'
import { routeApproval } from './tools/approvalRouter'
import { assessNegotiationRisk } from './tools/riskAssessor'
import { supabaseAdmin } from '@/lib/api/supabase-server'

export interface NegoAnalysisInput {
  quotation_id?: string
  barang_id: string
  harga_beli: number
  harga_diminta: number
  customer_id?: string
  customer_tier?: 'A' | 'B' | 'C'
  order_history?: string
  payment_terms?: string
  customer_payment_history?: 'good' | 'slow' | 'defaulted'
  customer_name?: string
}

export interface NegoAnalysisResult {
  id: string
  quotation_id?: string
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

export async function analyzeNegosiasi(
  input: NegoAnalysisInput,
  userId: string,
  useStreaming: boolean = true
): Promise<NegoAnalysisResult> {
  const startTime = Date.now()
  const client = createNvidiaClient()

  const marginResult = calculateMargin(input.harga_beli, input.harga_diminta)
  const approvalResult = routeApproval(
    marginResult.margin_percent,
    input.customer_tier,
    input.payment_terms
  )
  const riskResult = assessNegotiationRisk(
    marginResult.margin_percent,
    input.customer_tier ?? 'B',
    input.payment_terms ?? 'Net 30',
    input.order_history ?? 'No history',
    input.customer_payment_history
  )

  const prompt = buildNegoPrompt(
    input.harga_beli,
    input.harga_diminta,
    input.customer_tier ?? 'B',
    input.order_history ?? 'No history',
    {
      quotationId: input.quotation_id,
      customerName: input.customer_name,
    }
  )

  let reasoningChain = ''
  let finalContent = ''

  if (useStreaming) {
    const stream = await (client.chat.completions.create({
      model: AI_MODELS.NEGO_AGENT,
      messages: prompt as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
      ...MODEL_CONFIGS.NEGO_AGENT,
    }) as ReturnType<typeof client.chat.completions.create>)

    const accumulator = new StreamingAccumulator()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const chunk of stream as any) {
      const delta = chunk.choices?.[0]?.delta
      if (delta?.reasoning_content) {
        reasoningChain += delta.reasoning_content
      }
      if (delta?.content) {
        finalContent += delta.content
      }
    }
  } else {
    const response = await client.chat.completions.create({
      model: AI_MODELS.NEGO_AGENT,
      messages: prompt as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
      temperature: 1,
      max_tokens: 16384,
      stream: false,
    })
    finalContent = response.choices[0]?.message?.content ?? ''
  }

  let parsedResult: Partial<NegoAnalysisResult> = {}
  try {
    const jsonMatch = finalContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsedResult = JSON.parse(jsonMatch[0])
    }
  } catch {
    console.warn('Failed to parse LLM response as JSON, using fallback')
  }

  const recommendation = parsedResult.recommendation ??
    (marginResult.tier === 'loss' ? 'REJECT' : marginResult.tier === 'excellent' || marginResult.tier === 'good' ? 'ACCEPT' : 'COUNTER')

  const hargaCounter = parsedResult.harga_counter ??
    (recommendation === 'COUNTER' ? suggestCounterPrice(input.harga_beli, input.harga_diminta) : null)

  const result: NegoAnalysisResult = {
    id: crypto.randomUUID(),
    quotation_id: input.quotation_id,
    barang_id: input.barang_id,
    harga_beli: input.harga_beli,
    harga_diminta: input.harga_diminta,
    harga_counter: hargaCounter,
    margin_percent: marginResult.margin_percent,
    recommendation: parsedResult.recommendation as 'ACCEPT' | 'COUNTER' | 'REJECT' ?? recommendation,
    approval_level: parsedResult.approval_level as 'sales' | 'manager' | 'owner' ?? approvalResult.approval_level,
    risk_score: parsedResult.risk_score ?? riskResult.overall_score,
    reasoning_chain: (parsedResult.reasoning_chain ?? reasoningChain) || `Margin ${marginResult.tier}, Risk ${riskResult.level}`,
    summary: parsedResult.summary ?? parsedResult.recommendation ?? recommendation,
    warnings: parsedResult.warnings ?? riskResult.mitigations,
    created_at: new Date().toISOString(),
  }

  try {
    await supabaseAdmin.from('ai_nego_history').insert({
      id: result.id,
      quotation_id: result.quotation_id,
      user_id: userId,
      barang_id: result.barang_id,
      prompt: JSON.stringify(input),
      response: result,
      reasoning_chain: result.reasoning_chain,
      harga_diminta: result.harga_diminta,
      harga_counter: result.harga_counter,
      margin_percent: result.margin_percent,
      recommendation: result.recommendation,
      approval_level: result.approval_level,
      risk_score: result.risk_score,
    })
  } catch (err) {
    console.error('Failed to save negotiation history:', err)
  }

  return result
}

export async function getNegotiationHistory(
  userId: string,
  limit: number = 50
) {
  const { data, error } = await supabaseAdmin
    .from('ai_nego_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}