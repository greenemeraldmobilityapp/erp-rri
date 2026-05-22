import { supabaseAdmin } from '@/lib/api/supabase-server'

export interface ExtractedItem {
  nama: string
  jumlah: number
  harga: number
  satuan: string
  spesifikasi?: string
}

// Extract text from PDF buffer using pdf-parse
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text
  } catch (err) {
    console.error('PDF extraction failed:', err)
    return ''
  }
}

// Parse extracted text to find barang items (simplified regex-based extraction)
export function parseExtractedText(text: string): ExtractedItem[] {
  const items: ExtractedItem[] = []
  const lines = text.split('\n')

  for (const line of lines) {
    // Try to match patterns like:
    // "Nama Barang | 10 | 50000 | pcs"
    // "Kabel NYM 2x1.5mm 10 50000 meter"
    const match = line.match(/^(.+?)\s+(?:(\d+)\s+)?(\d{4,})\s+(.+)$/)
    if (match) {
      items.push({
        nama: match[1].trim(),
        jumlah: parseInt(match[2] ?? '1'),
        harga: parseInt(match[3]),
        satuan: match[4]?.trim() ?? 'pcs',
      })
    }
  }

  return items
}

export async function saveOcrResult(userId: string, fileName: string, fileUrl: string, items: ExtractedItem[]) {
  const { data, error } = await supabaseAdmin.from('ai_ocr_history').insert({
    user_id: userId, file_name: fileName, file_url: fileUrl,
    keterangan: JSON.stringify(items),
  }).select().single()
  if (error) throw new Error('Gagal menyimpan OCR history')
  return data
}
