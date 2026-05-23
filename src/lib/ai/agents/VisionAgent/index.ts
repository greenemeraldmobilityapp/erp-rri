import { createNvidiaClient, AI_MODELS } from '@/lib/ai/client'
import { buildVisionMessages, VisionTaskType } from './prompts'
import { supabaseAdmin } from '@/lib/api/supabase-server'

export interface VisionExtractionResult {
  id: string
  source_type: VisionTaskType
  file_name?: string
  file_url?: string
  extracted: Record<string, unknown>
  confidence: number
  warnings: string[]
  readability: string
  model_used: string
  tokens_used?: number
  latency_ms?: number
  created_at: string
}

export async function extractFromDocument(
  taskType: VisionTaskType,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string
): Promise<VisionExtractionResult> {
  const startTime = Date.now()
  const client = createNvidiaClient()

  const base64 = fileBuffer.toString('base64')
  const messages = buildVisionMessages(taskType, base64, mimeType)

  const response = await client.chat.completions.create({
    model: AI_MODELS.VISION_AGENT,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: messages as any,
    temperature: 0.10,
    top_p: 0.70,
    max_tokens: 512,
    stream: false,
  })

  const content = response.choices[0]?.message?.content ?? ''
  const latencyMs = Date.now() - startTime

  let parsedResult: {
    extracted?: Record<string, unknown>
    confidence?: number
    warnings?: string[]
    readability?: string
  } = {}

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsedResult = JSON.parse(jsonMatch[0])
    }
  } catch {
    parsedResult = {
      extracted: { raw_text: content },
      confidence: 0.3,
      warnings: ['Failed to parse AI response as JSON'],
      readability: 'poor',
    }
  }

  const result: VisionExtractionResult = {
    id: crypto.randomUUID(),
    source_type: taskType,
    file_name: fileName,
    extracted: parsedResult.extracted ?? {},
    confidence: parsedResult.confidence ?? 0.7,
    warnings: parsedResult.warnings ?? [],
    readability: parsedResult.readability ?? 'good',
    model_used: AI_MODELS.VISION_AGENT,
    tokens_used: response.usage?.total_tokens,
    latency_ms: latencyMs,
    created_at: new Date().toISOString(),
  }

  try {
    await supabaseAdmin.from('ai_vision_history').insert({
      id: result.id,
      user_id: userId,
      file_name: result.file_name,
      source_type: result.source_type,
      extracted_data: result.extracted,
      confidence_score: result.confidence,
      model_used: result.model_used,
      tokens_used: result.tokens_used,
      latency_ms: result.latency_ms,
    })
  } catch (err) {
    console.error('Failed to save vision history:', err)
  }

  return result
}

export async function extractKontrakFromPDF(
  pdfBuffer: Buffer,
  fileName: string,
  userId: string
): Promise<VisionExtractionResult> {
  return extractFromDocument('kontrak', pdfBuffer, fileName, 'application/pdf', userId)
}

export async function extractFromImageFile(
  imageBuffer: Buffer,
  fileName: string,
  mimeType: string,
  taskType: VisionTaskType,
  userId: string
): Promise<VisionExtractionResult> {
  return extractFromDocument(taskType, imageBuffer, fileName, mimeType, userId)
}

export async function getVisionHistory(
  userId: string,
  limit: number = 50
) {
  const { data, error } = await supabaseAdmin
    .from('ai_vision_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export function convertExtractedItemsToKontrakFormat(
  extracted: Record<string, unknown>
): Array<{ nama: string; jumlah: number; harga: number; satuan: string; keterangan?: string }> {
  const items: Array<{ nama: string; jumlah: number; harga: number; satuan: string; keterangan?: string }> = []

  const rawItems = Array.isArray(extracted.items)
    ? extracted.items
    : extracted.item_list ?? extracted.products ?? []
  const extractedItems: Array<Record<string, unknown>> = Array.isArray(rawItems) ? rawItems : []

  for (const item of extractedItems) {
    if (typeof item === 'object' && item !== null) {
      items.push({
        nama: String((item as Record<string, unknown>).nama_barang ?? (item as Record<string, unknown>).nama ?? ''),
        jumlah: Number((item as Record<string, unknown>).jumlah ?? (item as Record<string, unknown>).qty ?? 1),
        harga: Number((item as Record<string, unknown>).harga ?? (item as Record<string, unknown>).price ?? 0),
        satuan: String((item as Record<string, unknown>).satuan ?? (item as Record<string, unknown>).unit ?? 'unit'),
        keterangan: (item as Record<string, unknown>).keterangan as string | undefined,
      })
    }
  }

  return items
}