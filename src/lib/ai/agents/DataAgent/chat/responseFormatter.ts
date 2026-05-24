import { createNvidiaClient, AI_MODELS } from '@/lib/ai/client'
import { type QueryResult } from './queryBuilder'
import { type IntentMatch } from './intentClassifier'

export interface FormattedResponse {
  answer: string
  rawData: Record<string, unknown>[]
  rowCount: number
  formattedAt: string
  modelUsed: string
}

function buildSystemPrompt(): string {
  return `Anda adalah asisten ERP RRI yang membantu menjawab pertanyaan berdasarkan DATA ASLI dari database.

ATURAN PENTING:
1. ANDA HANYA MEMFORMAT DATA — jangan membuat angka atau informasi palsu.
2. Gunakan data yang diberikan dalam [DATA] section. JANGAN gunakan pengetahuan umum Anda.
3. Jika data kosong, katakan "Tidak ada data" — jangan membuat data.
4. Jawab dalam Bahasa Indonesia yang sopan dan profesional.
5. Gunakan format Rupiah (Rp) untuk nominal uang.
6. Gunakan format tanggal Indonesia (contoh: 23 Mei 2026).
7. Jika ada angka desimal, bulatkan ke 2 angka belakang.
8. Jika lebih dari 5 baris data, berikan ringkasan dan tawarkan detail.
9. Jika query gagal, sampaikan error dengan sopan.
10. Berikan konteks bisnis yang relevan berdasarkan data.`
}

function buildMessageContent(
  intent: IntentMatch,
  result: QueryResult
): Array<{ role: 'system' | 'user'; content: string }> {
  const dataJson = JSON.stringify(result.rows, null, 2)

  const userContent = `Pertanyaan: "${intent.rawQuery}"

Intent terdeteksi: ${intent.pattern.intentName} (${intent.pattern.id})
Kategori: ${intent.pattern.category}
Deskripsi: ${intent.pattern.description}
Confidence: ${intent.confidence}%

[DATA START]
${result.error ? `ERROR: ${result.error}` : `Jumlah data: ${result.rowCount} baris\n${dataJson}`}
[DATA END]

${result.error ? 'Jelaskan error ini ke user dengan sopan dan bantu mereka memperbaiki query.' : 'Berdasarkan data di atas, jawab pertanyaan user dengan informatif dan profesional.'}
${result.rowCount === 0 ? 'Data kosong. Sampaikan bahwa tidak ada data yang ditemukan.' : ''}`

  return [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: userContent },
  ]
}

export async function formatResponse(
  intent: IntentMatch,
  result: QueryResult
): Promise<FormattedResponse> {
  const client = createNvidiaClient()

  const model = AI_MODELS.DATA_AGENT

  const messages = buildMessageContent(intent, result)

  if (result.error) {
    return {
      answer: result.error,
      rawData: result.rows,
      rowCount: result.rowCount,
      formattedAt: new Date().toISOString(),
      modelUsed: 'none',
    }
  }

  const TIMEOUT_MS = 15000
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
      stream: false,
    }, { signal: controller.signal })

    clearTimeout(timeout)

    const answer = response.choices[0]?.message?.content ?? 'Maaf, tidak dapat memformat jawaban.'

    return {
      answer,
      rawData: result.rows,
      rowCount: result.rowCount,
      formattedAt: new Date().toISOString(),
      modelUsed: model,
    }
  } catch {
    clearTimeout(timeout)
    const fallback = formatAsRuleBased(intent, result)
    return {
      answer: fallback,
      rawData: result.rows,
      rowCount: result.rowCount,
      formattedAt: new Date().toISOString(),
      modelUsed: 'fallback',
    }
  }
}

function formatAsRuleBased(intent: IntentMatch, result: QueryResult): string {
  if (result.rowCount === 0) return 'Tidak ada data yang ditemukan.'

  const rows = result.rows
  const headers = Object.keys(rows[0] ?? {})

  if (result.rowCount === 1) {
    const row = rows[0]
    const lines = [`**${intent.pattern.intentName}**\n`]
    for (const key of headers) {
      lines.push(`- **${key.replace(/_/g, ' ')}**: ${String(row[key] ?? '-')}`)
    }
    return lines.join('\n')
  }

  if (result.rowCount <= 5) {
    const lines: string[] = [`**${intent.pattern.intentName}**\n`]
    for (const row of rows) {
      const vals = headers.map(h => String(row[h] ?? '-')).join(' | ')
      lines.push(`| ${vals} |`)
    }
    return lines.join('\n')
  }

  const summary = `Ditemukan **${result.rowCount}** data untuk "${intent.pattern.intentName}".\n\nBerikut 3 data pertama:\n`
  const sampleRows = rows.slice(0, 3)
  const sampleLines = sampleRows.map(r => {
    return headers.map(h => `- ${h.replace(/_/g, ' ')}: ${String(r[h] ?? '-')}`).join('\n')
  })
  return summary + sampleLines.join('\n\n') + `\n\n_Gunakan query yang lebih spesifik untuk detail lengkap._`
}
