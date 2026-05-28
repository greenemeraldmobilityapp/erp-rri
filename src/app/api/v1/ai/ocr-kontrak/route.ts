import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError, unauthorized } from '@/lib/api/errors'
import { extractKontrakFromPDF } from '@/lib/ai/agents/VisionAgent'
import { storageService } from '@/lib/storage'
import * as fs from 'fs'

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

const COMPANY_INDICATORS = ['PT ', 'CV ', 'INC', 'LTD', 'TBK', 'LLC']

function isCompanyName(name: string): boolean {
  const upper = name.toUpperCase()
  return COMPANY_INDICATORS.some((ind) => upper.includes(ind))
}

function isValidItemKode(kode: string): boolean {
  if (!kode || kode.length < 3 || kode.length > 20) return false
  if (/^(lampiran|appendix|fee|biaya|code|uom|item|price|no|jumlah|harga)/i.test(kode)) return false
  return true
}

function correctIndonesianPrice(raw: number | string): number {
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (/^\d+(?:\.\d+)*$/.test(trimmed)) {
      return parseInt(trimmed.replace(/\./g, ''), 10)
    }
    return Number(trimmed) || 0
  }
  if (raw <= 0) return raw
  if (!Number.isInteger(raw)) {
    return Math.round(raw * 1000)
  }
  if (raw < 1000) {
    const multiplied = raw * 1000
    if (multiplied > 1000) return multiplied
    return raw
  }
  return raw
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  if (!auth.user) return unauthorized('Unauthorized')

  const formData = await request.formData().catch(() => null)
  if (!formData) return badRequest('Invalid form data')

  const file = formData.get('file') as File | null
  if (!file) return badRequest('File harus diupload')

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) return badRequest('Ukuran file maksimal 10MB')

  const buffer = Buffer.from(await file.arrayBuffer())

  const filePath = `dokumen/ocr-kontrak/${Date.now()}-${file.name}`
  let uploadResult
  try {
    uploadResult = await storageService.upload(buffer, filePath, file.type || 'application/pdf')
  } catch (err) {
    return internalError('Gagal upload file: ' + (err instanceof Error ? err.message : 'unknown error'))
  }

  let visionResult
  try {
    visionResult = await extractKontrakFromPDF(buffer, file.name, auth.user.id)
  } catch (err) {
    await storageService.delete(uploadResult.fileId).catch(() => {})
    return internalError('Gagal memproses OCR: ' + (err instanceof Error ? err.message : 'unknown error'))
  }

  const extracted = visionResult.extracted as Record<string, unknown>
  const diagTag = Date.now()
  fs.writeFileSync(`/tmp/ocr-diag-${diagTag}.json`, JSON.stringify({
    visionResultKeys: Object.keys(extracted),
    visionResult: extracted,
  }, null, 2))

  function signatoryNama(sig: Record<string, string> | null | undefined): string {
    return sig?.nama ?? sig?.name ?? ''
  }

  function signatoryJabatan(sig: Record<string, string> | null | undefined): string {
    return sig?.jabatan ?? sig?.title ?? sig?.jabatan_en ?? ''
  }

  function cleanSignatory(sig: Record<string, string> | null | undefined): { nama: string; jabatan: string } | null {
    if (!sig) return null
    const nama = signatoryNama(sig)
    const jabatan = signatoryJabatan(sig)
    if (!nama && !jabatan) return null
    return {
      nama: isCompanyName(nama) ? '' : nama,
      jabatan: isCompanyName(jabatan) ? '' : jabatan,
    }
  }

  const result: OcrKontrakResult = {
    nomor_kontrak: (extracted.nomor_kontrak as string) ?? null,
    nama_kontrak: (extracted.nama_kontrak as string) ?? null,
    nama_customer: (extracted.nama_customer as string) ?? null,
    rri_signatory: cleanSignatory(extracted.rri_signatory as Record<string, string> | null | undefined),
    customer_signatory: cleanSignatory(extracted.customer_signatory as Record<string, string> | null | undefined),
    tanggal_mulai: (extracted.tanggal_mulai as string) ?? null,
    tanggal_selesai: (extracted.tanggal_selesai as string) ?? null,
    tanggal_tanda_tangan: (extracted.tanggal_tanda_tangan as string) ?? null,
    items: Array.isArray(extracted.items)
      ? (extracted.items as Array<Record<string, unknown>>)
          .filter((item) => isValidItemKode(String(item.kode ?? '')))
          .map((item) => {
            const harga = correctIndonesianPrice((item.harga ?? item.price ?? 0) as number | string)
            return {
              kode: String(item.kode ?? ''),
              uom: String(item.uom ?? item.satuan ?? ''),
              nama: String(item.nama ?? ''),
              harga,
            }
          })
      : [],
  }
  fs.writeFileSync(`/tmp/ocr-diag-${diagTag}-result.json`, JSON.stringify({ result }, null, 2))
  console.log(`[DIAG] ocr-diag-${diagTag} written to /tmp/`)

  try {
    await supabaseAdmin.from('ai_ocr_history').insert({
      user_id: auth.user.id,
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
  if (!auth.user) return unauthorized('Unauthorized')
  const { data, error } = await supabaseAdmin.from('ai_ocr_history')
    .select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(20)
  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}
