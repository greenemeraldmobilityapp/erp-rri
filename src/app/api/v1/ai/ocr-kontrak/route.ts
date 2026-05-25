import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { extractTextFromPdf, parseExtractedText, saveOcrResult } from '@/lib/ai/ocr-kontrak'
import { storageService } from '@/lib/storage'

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const formData = await request.formData().catch(() => null)
  if (!formData) return badRequest('Invalid form data')

  const file = formData.get('file') as File | null
  if (!file) return badRequest('File PDF harus diupload')

  if (!file.name.endsWith('.pdf')) return badRequest('Hanya file PDF yang didukung')

  const buffer = Buffer.from(await file.arrayBuffer())

  const filePath = `dokumen/kontrak-ocr/${Date.now()}-${file.name}`
  let uploadResult
  try {
    uploadResult = await storageService.upload(buffer, filePath, 'application/pdf')
  } catch (err) {
    return internalError('Gagal upload file ke Google Drive: ' + (err instanceof Error ? err.message : 'unknown error'))
  }

  const text = await extractTextFromPdf(buffer)
  const items = parseExtractedText(text)

  try {
    const result = await saveOcrResult(auth.user!.id, file.name, uploadResult.webViewLink, items, uploadResult.fileId)
    return NextResponse.json({ data: { ...result, extracted_items: items } })
  } catch (err) {
    await storageService.delete(uploadResult.fileId).catch(() => {})
    return internalError(err instanceof Error ? err.message : 'Gagal menyimpan')
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('ai_ocr_history')
    .select('*').eq('user_id', auth.user!.id).order('created_at', { ascending: false }).limit(20)
  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}
