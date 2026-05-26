import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { extractKontrakFromPDF } from '@/lib/ai/agents/VisionAgent'
import { storageService } from '@/lib/storage'

export interface OcrKontrakResult {
  nomor_kontrak: string | null
  nama_kontrak: string | null
  nama_customer: string | null
  rri_signatory: { nama: string; jabatan: string } | null
  customer_signatory: { nama: string; jabatan: string } | null
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  tanggal_tanda_tangan: string | null
  items: Array<{ kode: string; uom: string; nama: string; harga: number }>
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const formData = await request.formData().catch(() => null)
  if (!formData) return badRequest('Invalid form data')

  const file = formData.get('file') as File | null
  if (!file) return badRequest('File harus diupload')

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) return badRequest('Ukuran file maksimal 10MB')

  const buffer = Buffer.from(await file.arrayBuffer())

  const filePath = `dokumen/kontrak-ocr/${Date.now()}-${file.name}`
  let uploadResult
  try {
    uploadResult = await storageService.upload(buffer, filePath, file.type || 'application/pdf')
  } catch (err) {
    return internalError('Gagal upload file: ' + (err instanceof Error ? err.message : 'unknown error'))
  }

  let visionResult
  try {
    visionResult = await extractKontrakFromPDF(buffer, file.name, auth.user!.id)
  } catch (err) {
    await storageService.delete(uploadResult.fileId).catch(() => {})
    return internalError('Gagal memproses OCR: ' + (err instanceof Error ? err.message : 'unknown error'))
  }

  const extracted = visionResult.extracted as Record<string, unknown>
  const result: OcrKontrakResult = {
    nomor_kontrak: (extracted.nomor_kontrak as string) ?? null,
    nama_kontrak: (extracted.nama_kontrak as string) ?? null,
    nama_customer: (extracted.nama_customer as string) ?? null,
    rri_signatory: extracted.rri_signatory
      ? {
          nama: (extracted.rri_signatory as Record<string, string>)?.nama ?? null,
          jabatan: (extracted.rri_signatory as Record<string, string>)?.jabatan ?? null,
        }
      : null,
    customer_signatory: extracted.customer_signatory
      ? {
          nama: (extracted.customer_signatory as Record<string, string>)?.nama ?? null,
          jabatan: (extracted.customer_signatory as Record<string, string>)?.jabatan ?? null,
        }
      : null,
    tanggal_mulai: (extracted.tanggal_mulai as string) ?? null,
    tanggal_selesai: (extracted.tanggal_selesai as string) ?? null,
    tanggal_tanda_tangan: (extracted.tanggal_tanda_tangan as string) ?? null,
    items: Array.isArray(extracted.items)
      ? (extracted.items as Array<Record<string, unknown>>).map((item) => ({
          kode: String(item.kode ?? ''),
          uom: String(item.uom ?? item.satuan ?? ''),
          nama: String(item.nama ?? ''),
          harga: Number(item.harga ?? item.price ?? 0),
        }))
      : [],
  }

  try {
    await supabaseAdmin.from('ai_ocr_history').insert({
      user_id: auth.user!.id,
      file_name: file.name,
      file_url: uploadResult.webViewLink,
      drive_file_id: uploadResult.fileId ?? null,
      keterangan: JSON.stringify(result),
    })
  } catch (err) {
    console.error('Failed to save OCR history:', err)
  }

  return NextResponse.json({ data: result })
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('ai_ocr_history')
    .select('*').eq('user_id', auth.user!.id).order('created_at', { ascending: false }).limit(20)
  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}
