import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { extractTextFromPdf, parseExtractedText, saveOcrResult } from '@/lib/ai/ocr-kontrak'

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const formData = await request.formData().catch(() => null)
  if (!formData) return badRequest('Invalid form data')

  const file = formData.get('file') as File | null
  if (!file) return badRequest('File PDF harus diupload')

  if (!file.name.endsWith('.pdf')) return badRequest('Hanya file PDF yang didukung')

  const buffer = Buffer.from(await file.arrayBuffer())

  // Upload to Supabase Storage
  const fileName = `dokumen/kontrak-ocr/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabaseAdmin.storage.from('dokumen').upload(fileName, buffer, {
    contentType: 'application/pdf', upsert: false,
  })
  if (uploadError) return internalError('Gagal upload file')

  const { data: { publicUrl } } = supabaseAdmin.storage.from('dokumen').getPublicUrl(fileName)

  // Extract text from PDF
  const text = await extractTextFromPdf(buffer)
  const items = parseExtractedText(text)

  // Save result
  try {
    const result = await saveOcrResult(auth.user!.id, file.name, publicUrl, items)
    return NextResponse.json({ data: { ...result, extracted_items: items } })
  } catch (err) {
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
