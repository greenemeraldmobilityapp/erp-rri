import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { extractFromDocument, extractKontrakFromPDF, extractFromImageFile, getVisionHistory, type VisionTaskType } from '@/lib/ai/agents/VisionAgent'

const base64FileSchema = z.object({
  file_base64: z.string().min(1),
  file_name: z.string().min(1),
  mime_type: z.string().min(1),
  task_type: z.enum(['kontrak', 'receipt', 'delivery', 'invoice', 'kwitansi', 'general']),
})

const urlSchema = z.object({
  file_url: z.string().url(),
  file_name: z.string().optional(),
  task_type: z.enum(['kontrak', 'receipt', 'delivery', 'invoice', 'kwitansi', 'general']),
})

function mapTaskType(raw: string): VisionTaskType {
  if (raw === 'kwitansi') return 'receipt'
  if (raw === 'general') return 'receipt'
  return raw as VisionTaskType
}

/**
 * @openapi
 * /api/v1/ai/agents/vision-agent:
 *   post:
 *     tags: [AI Agent]
 *     summary: OCR dokumen (kontrak, invoice, kwitansi, delivery order)
 *     description: |
 *       Menerima file (multipart), base64, atau URL gambar/PDF dan mengekstrak data menggunakan Phi-4 multimodal.
 *       Tipe dokumen: kontrak, invoice, receipt, delivery, kwitansi, general
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               task_type:
 *                 type: string
 *                 enum: [invoice, receipt, delivery, kontrak, kwitansi, general]
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               file_url:
 *                 type: string
 *                 format: uri
 *               file_base64:
 *                 type: string
 *               task_type:
 *                 type: string
 *                 enum: [invoice, receipt, delivery, kontrak, kwitansi, general]
 *     responses:
 *       200:
 *         description: Data terekstrak dari dokumen
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const taskType = (formData.get('task_type') as string) ?? 'general'
      const fileName = file?.name ?? 'uploaded_file'

      if (!file) return badRequest('File tidak ditemukan')

      const buffer = Buffer.from(await file.arrayBuffer())
      const mimeType = file.type || 'application/octet-stream'

      let result
      if (mimeType === 'application/pdf') {
        result = await extractKontrakFromPDF(buffer, fileName, auth.user.id)
      } else {
        result = await extractFromImageFile(
          buffer,
          fileName,
          mimeType,
          mapTaskType(taskType),
          auth.user.id
        )
      }

      return NextResponse.json({ data: result })
    } catch (err) {
      return internalError(err instanceof Error ? err.message : 'Upload gagal')
    }
  }

  if (body.file_base64) {
    const parsed = base64FileSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    try {
      const buffer = Buffer.from(parsed.data.file_base64, 'base64')
      const result = await extractFromDocument(
        mapTaskType(parsed.data.task_type),
        buffer,
        parsed.data.file_name,
        parsed.data.mime_type,
        auth.user.id
      )
      return NextResponse.json({ data: result })
    } catch (err) {
      return internalError(err instanceof Error ? err.message : 'Proses vision gagal')
    }
  }

  if (body.file_url) {
    const parsed = urlSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    try {
      const response = await fetch(parsed.data.file_url)
      const buffer = Buffer.from(await response.arrayBuffer())
      const mimeType = response.headers.get('content-type') ?? 'image/png'
      const fileName = parsed.data.file_name ?? 'from_url'

      const result = await extractFromDocument(
        mapTaskType(parsed.data.task_type),
        buffer,
        fileName,
        mimeType,
        auth.user.id
      )
      return NextResponse.json({ data: result })
    } catch (err) {
      return internalError(err instanceof Error ? err.message : 'Gagal fetch file dari URL')
    }
  }

  return badRequest('Kirim file_base64, file_url, atau multipart/form-data')
}

const historySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
})

/**
 * @openapi
 * /api/v1/ai/agents/vision-agent:
 *   get:
 *     tags: [AI Agent]
 *     summary: History OCR VisionAgent
 *     description: Mengambil riwayat OCR dokumen untuk user yang terautentikasi
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Jumlah history yang diambil (max 100)
 *     responses:
 *       200:
 *         description: Array history OCR
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const parsed = historySchema.safeParse({
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
  })

  const limit = parsed.success ? parsed.data.limit : 50

  try {
    const history = await getVisionHistory(auth.user.id, limit)
    return NextResponse.json({ data: history })
  } catch (err) {
    return internalError(err instanceof Error ? err.message : 'Gagal mengambil history')
  }
}
