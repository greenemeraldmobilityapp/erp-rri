import OpenAI from 'openai'
import { createNvidiaClient, AI_MODELS } from '@/lib/ai/client'
import { buildVisionMessages, buildMultiImageMessages, getVisionPrompt, type VisionTaskType } from './prompts'
export type { VisionTaskType }
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

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

type VisionMessage = {
  role: 'system' | 'user'
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>
}

async function attemptVisionCall(
  messages: VisionMessage[],
  maxTokens: number,
  label: string
): Promise<{
  content: string
  model: string
  usage?: { total_tokens?: number }
  latency_ms: number
}> {
  const startTime = Date.now()
  const client = createNvidiaClient()
  const model = AI_MODELS.VISION_AGENT

  const totalB64 = messages
    .filter((m) => Array.isArray(m.content))
    .flatMap((m) => m.content as Array<{ type: string; image_url?: { url: string } }>)
    .filter((c) => c.type === 'image_url' && c.image_url?.url)
    .reduce((sum, c) => sum + c.image_url!.url.length, 0)

  console.log(`[VisionAgent] ${label}: model=${model} maxTokens=${maxTokens} images_b64_bytes=${totalB64}`)

  let response: OpenAI.ChatCompletion
  let ok = false
  let lastErr: unknown

  const MAX_RETRIES = 2
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await client.chat.completions.create({
        model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages as any,
        temperature: 0.10,
        top_p: 0.70,
        max_tokens: maxTokens,
        stream: false,
      }) as OpenAI.ChatCompletion
      ok = true
      break
    } catch (err: unknown) {
      lastErr = err
      const latencyMs = Date.now() - startTime
      const errorObj = err as Record<string, unknown>
      const status = errorObj.status ?? 'unknown'
      console.log(`[VisionAgent] ${label} attempt ${attempt}/${MAX_RETRIES} FAILED: status=${status} latency=${latencyMs}ms`)
      if (attempt < MAX_RETRIES) {
        const delay = 5000
        console.log(`[VisionAgent] ${label} retrying in ${delay}ms...`)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  if (!ok) {
    const latencyMs = Date.now() - startTime
    const errorObj = (lastErr ?? {}) as Record<string, unknown>
    const status = errorObj.status ?? 'unknown'
    let responseBody = '(no body)'
    try {
      const resp = errorObj.response as { getBody?: () => Promise<string>; body?: unknown }
      if (typeof resp?.getBody === 'function') {
        responseBody = await resp.getBody()
      } else if (resp?.body) {
        responseBody = String(resp.body)
      }
    } catch {
      responseBody = '(failed to read body)'
    }
    console.error(`[VisionAgent] ${label} ALL RETRIES FAILED: status=${status} latency=${latencyMs}ms`)
    console.error(`[VisionAgent] ${label} response_body: ${responseBody.substring(0, 2000)}`)
    throw new Error(`NVIDIA API error (${status}): ${responseBody.substring(0, 500)}`)
  }

  const latencyMs = Date.now() - startTime
  const content = response!.choices[0]?.message?.content ?? ''

  console.log(`[VisionAgent] ${label}: model=${model} latency=${latencyMs}ms tokens=${response!.usage?.total_tokens}`)

  return { content, model, usage: response!.usage, latency_ms: latencyMs }
}

const KNOWN_META_KEYS = new Set(['confidence', 'warnings', 'readability', 'missing_fields', 'extracted'])

function tryAutoCompleteJson(text: string): string {
  let opens = 0, closes = 0
  let bropen = 0, brclose = 0
  for (const ch of text) {
    if (ch === '{') opens++
    else if (ch === '}') closes++
    else if (ch === '[') bropen++
    else if (ch === ']') brclose++
  }
  let result = text
  result += '}'.repeat(Math.max(0, opens - closes))
  result += ']'.repeat(Math.max(0, bropen - brclose))
  return result
}

function extractNestedData(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.extracted && typeof raw.extracted === 'object' && Object.keys(raw.extracted).length > 0) {
    return raw.extracted as Record<string, unknown>
  }
  const data: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (!KNOWN_META_KEYS.has(k)) {
      data[k] = v
    }
  }
  return data
}

function parseVisionResponse(
  content: string,
  model: string,
  usage: { total_tokens?: number } | undefined,
  latencyMs: number,
  taskType: VisionTaskType,
  fileName: string,
  userId: string
): VisionExtractionResult {
  let parsedResult: Record<string, unknown> = {}

  const logTag = Date.now()
  try {
    let rawJson = content.trim()

    if (rawJson.startsWith('[') && rawJson.endsWith(']')) {
      rawJson = rawJson.slice(1, -1).trim()
    }

    const jsonMatch = rawJson.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        parsedResult = JSON.parse(jsonMatch[0])
      } catch {
        const completed = tryAutoCompleteJson(jsonMatch[0])
        parsedResult = JSON.parse(completed)
        console.log(`[DIAG] ${logTag} JSON was truncated, auto-completed ${completed.length - jsonMatch[0].length} chars`)
      }
      fs.writeFileSync(`/tmp/vision-diag-${logTag}.json`, JSON.stringify({ stage: 'parsed', parsedResult }, null, 2))
      console.log(`[DIAG] ${logTag} RAW JSON keys:`, Object.keys(parsedResult))
    } else {
      fs.writeFileSync(`/tmp/vision-diag-${logTag}.txt`, content)
      console.log(`[DIAG] ${logTag} NO JSON FOUND. Content written to /tmp/vision-diag-${logTag}.txt`)
    }
  } catch {
    fs.writeFileSync(`/tmp/vision-diag-${logTag}.txt`, content)
    console.log(`[DIAG] ${logTag} JSON PARSE FAILED. Content written to /tmp/vision-diag-${logTag}.txt`)
    parsedResult = {
      extracted: { raw_text: content },
      confidence: 0.3,
      warnings: ['Failed to parse AI response as JSON'],
      readability: 'poor',
    }
  }

  const extractedData = extractNestedData(parsedResult)
  fs.writeFileSync(`/tmp/vision-diag-${logTag}-extracted.json`, JSON.stringify({ extractedData }, null, 2))
  console.log(`[DIAG] ${logTag} extractedData keys:`, Object.keys(extractedData))

  const metaConfidence = (parsedResult.confidence as number) ?? (extractedData.confidence as number) ?? 0.7
  const metaWarnings = (parsedResult.warnings as string[]) ?? (extractedData.warnings as string[]) ?? []
  const metaReadability = (parsedResult.readability as string) ?? (extractedData.readability as string) ?? 'good'

  const result: VisionExtractionResult = {
    id: crypto.randomUUID(),
    source_type: taskType,
    file_name: fileName,
    extracted: extractNestedData(parsedResult),
    confidence: metaConfidence,
    warnings: metaWarnings,
    readability: metaReadability,
    model_used: model,
    tokens_used: usage?.total_tokens,
    latency_ms: latencyMs,
    created_at: new Date().toISOString(),
  }

  try {
    supabaseAdmin.from('ai_vision_history').insert({
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

export async function extractFromDocument(
  taskType: VisionTaskType,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string
): Promise<VisionExtractionResult> {
  const base64 = fileBuffer.toString('base64')
  const messages = buildVisionMessages(taskType, base64, mimeType)
  const maxTokens = taskType === 'kontrak' ? 16384 : 512

  const { content, model, usage, latency_ms } = await attemptVisionCall(messages, maxTokens, 'extractFromDocument')

  return parseVisionResponse(content, model, usage, latency_ms, taskType, fileName, userId)
}

function convertPdfToJpeg(pdfBuffer: Buffer): Buffer[] {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-ocr-'))
  const pdfPath = path.join(tmpDir, 'input.pdf')

  fs.writeFileSync(pdfPath, pdfBuffer)

  execSync(`pdftoppm -jpeg -jpegopt quality=75 -r 150 "${pdfPath}" "${path.join(tmpDir, 'page')}"`, {
    stdio: 'pipe',
    timeout: 120000,
  })

  const files = fs.readdirSync(tmpDir)
    .filter((f) => f.endsWith('.jpg'))
    .sort()
    .map((f) => {
      const buf = fs.readFileSync(path.join(tmpDir, f))
      console.log(`[VisionAgent] PDF page ${f}: ${buf.length} bytes`)
      return buf
    })

  fs.rmSync(tmpDir, { recursive: true, force: true })

  console.log(`[VisionAgent] PDF converted: ${files.length} pages, total ${files.reduce((s, b) => s + b.length, 0)} bytes raw`)
  return files
}

async function extractFromImages(
  taskType: VisionTaskType,
  jpegBuffers: Buffer[],
  fileName: string,
  userId: string
): Promise<VisionExtractionResult> {
  const images = jpegBuffers.map((buf) => ({
    base64: buf.toString('base64'),
    mimeType: 'image/jpeg',
  }))

  const totalRaw = jpegBuffers.reduce((s, b) => s + b.length, 0)
  const totalB64 = images.reduce((s, i) => s + i.base64.length, 0)
  console.log(`[VisionAgent] extractFromImages: pages=${images.length} raw_total=${totalRaw} b64_total=${totalB64}`)

  const messages = buildMultiImageMessages(getVisionPrompt(taskType), images)
  const maxTokens = taskType === 'kontrak' ? 16384 : 512

  const { content, model, usage, latency_ms } = await attemptVisionCall(messages, maxTokens, 'extractFromImages')

  return parseVisionResponse(content, model, usage, latency_ms, taskType, fileName, userId)
}

const PAGE_BATCH_SIZE = 3

const COMPANY_INDICATORS = ['PT ', 'CV ', 'INC', 'LTD', 'TBK', 'LLC']

function isCompanyName(name: string): boolean {
  const upper = name.toUpperCase()
  return COMPANY_INDICATORS.some((ind) => upper.includes(ind))
}

function isValidItemCode(kode: string): boolean {
  if (!kode || kode.length < 3 || kode.length > 20) return false
  if (/^(lampiran|appendix|fee|biaya|code|uom|item|price|no|jumlah|harga)/i.test(kode)) return false
  return true
}

function mergeSignatoryField(existing: string | undefined, incoming: string | undefined): string | undefined {
  if (!incoming) return existing
  if (!existing) return incoming
  const existingCompany = isCompanyName(existing)
  const incomingCompany = isCompanyName(incoming)
  if (existingCompany && !incomingCompany) return incoming
  if (!existingCompany && incomingCompany) return existing
  if (incoming.length < existing.length) return incoming
  return existing
}

function mergeSignatoryObjects(
  existing: Record<string, unknown> | null | undefined,
  incoming: Record<string, unknown> | null | undefined
): Record<string, unknown> | null | undefined {
  if (!incoming) return existing
  if (!existing) return incoming
  const merged: Record<string, string> = {}
  const allKeys = new Set([...Object.keys(existing), ...Object.keys(incoming)])
  for (const key of allKeys) {
    const exVal = typeof existing[key] === 'string' ? (existing[key] as string) : undefined
    const inVal = typeof incoming[key] === 'string' ? (incoming[key] as string) : undefined
    const mergedVal = mergeSignatoryField(exVal, inVal)
    if (mergedVal) merged[key] = mergedVal
  }
  return Object.keys(merged).length > 0 ? merged : null
}

function mergeVisionResults(results: VisionExtractionResult[]): VisionExtractionResult {
  if (results.length === 0) throw new Error('No results to merge')
  if (results.length === 1) return results[0]

  const mergedExtracted: Record<string, unknown> = {}
  const seenItems = new Set<string>()

  const SIGNATORY_KEYS = new Set(['rri_signatory', 'customer_signatory'])

  for (const r of results) {
    for (const [k, v] of Object.entries(r.extracted)) {
      if (k === 'items') {
        const items = Array.isArray(v) ? (v as Array<Record<string, unknown>>) : []
        for (const item of items) {
          const code = String(item.kode ?? '')
          if (isValidItemCode(code) && !seenItems.has(code)) {
            seenItems.add(code)
            if (!Array.isArray(mergedExtracted.items)) mergedExtracted.items = []
            ;(mergedExtracted.items as Array<Record<string, unknown>>).push(item)
          }
        }
      } else if (SIGNATORY_KEYS.has(k) && v && typeof v === 'object') {
        mergedExtracted[k] = mergeSignatoryObjects(
          mergedExtracted[k] as Record<string, unknown> | null | undefined,
          v as Record<string, unknown>
        )
      } else if (v !== null && v !== undefined && v !== '' && !(k in mergedExtracted)) {
        mergedExtracted[k] = v
      } else if (k in mergedExtracted && (mergedExtracted[k] === null || mergedExtracted[k] === undefined || mergedExtracted[k] === '')) {
        if (v !== null && v !== undefined && v !== '') mergedExtracted[k] = v
      }
    }
  }

  const avgConfidence = results.reduce((s, r) => s + r.confidence, 0) / results.length
  const allWarnings = [...new Set(results.flatMap((r) => r.warnings))]
  const readabilityLevels = ['excellent', 'good', 'poor']
  const worstReadability = results.reduce((worst, r) => {
    return readabilityLevels.indexOf(r.readability) > readabilityLevels.indexOf(worst) ? r.readability : worst
  }, 'excellent')

  return {
    ...results[0],
    extracted: mergedExtracted,
    confidence: avgConfidence,
    warnings: allWarnings,
    readability: worstReadability,
  }
}

export async function extractKontrakFromPDF(
  pdfBuffer: Buffer,
  fileName: string,
  userId: string
): Promise<VisionExtractionResult> {
  const jpegs = convertPdfToJpeg(pdfBuffer)
  if (jpegs.length === 0) {
    throw new Error('Gagal mengkonversi PDF ke gambar')
  }

  if (jpegs.length <= PAGE_BATCH_SIZE) {
    return extractFromImages('kontrak', jpegs, fileName, userId)
  }

  console.log(`[VisionAgent] PDF has ${jpegs.length} pages, processing in batches of ${PAGE_BATCH_SIZE}`)
  const results: VisionExtractionResult[] = []
  for (let i = 0; i < jpegs.length; i += PAGE_BATCH_SIZE) {
    const batch = jpegs.slice(i, i + PAGE_BATCH_SIZE)
    console.log(`[VisionAgent] Processing batch ${Math.floor(i / PAGE_BATCH_SIZE) + 1}: pages ${i + 1}-${i + batch.length}`)
    const result = await extractFromImages('kontrak', batch, fileName, userId)
    results.push(result)
  }

  return mergeVisionResults(results)
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