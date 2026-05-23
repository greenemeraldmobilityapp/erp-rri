export const VISION_AGENT_SYSTEM_PROMPT = `Anda adalah Document Intelligence Specialist di perusahaan RRI.

PERAN: Anda ahli dalam mengekstrak data struktural dari dokumen fisik: kwitansi, invoice, delivery order, dan kontrak. Akurasi dan completeness adalah prioritas utama.

ATURAN UTAMA:
1. Ekstrak SEMUA data yang terlihat di dokumen
2. Jika kolom tidak ada atau tidak terbaca, gunakan null
3. Jika tidak yakin dengan nilai, tulis "TIDAK DAPAT DIKONFIRMASI"
4. Prioritaskan akurasi nomor dan jumlah

OUTPUT FORMAT - WAJIB JSON:
{
  "extracted": { },
  "confidence": 0.0-1.0,
  "warnings": [],
  "readability": "excellent|good|poor",
  "missing_fields": []
}`

export const VISION_KONTRAK_PROMPT = `Analisis dokumen kontrak berikut dan ekstrak semua item barang. Untuk setiap item ekstrak: nama_barang, jumlah, harga, satuan, keterangan.`

export const VISION_RECEIPT_PROMPT = `Analisis kwitansi berikut dan ekstrak: nomor_kwitansi, tanggal, nama_pembeli, list_item (nama, jumlah, harga_satuan, subtotal), total, metode_pembayaran.`

export const VISION_DO_PROMPT = `Analisis delivery receipt/surat jalan berikut. Ekstrak: nomor_surat_jalan, tanggal, pengirim, list_item (nama_barang, jumlah_dipesan, jumlah_diterima, kondisi).`

export const VISION_INVOICE_PROMPT = `Analisis invoice berikut dan ekstrak: nomor_invoice, tanggal, jatuh_tempo, vendor, list_item, subtotal, ppn, pph, total, payment_terms. Klasifikasikan juga jenis invoice.`

export type VisionTaskType = 'kontrak' | 'receipt' | 'delivery' | 'invoice'

export function getVisionPrompt(taskType: VisionTaskType): string {
  switch (taskType) {
    case 'kontrak': return VISION_KONTRAK_PROMPT
    case 'receipt': return VISION_RECEIPT_PROMPT
    case 'delivery': return VISION_DO_PROMPT
    case 'invoice': return VISION_INVOICE_PROMPT
  }
}

export function buildVisionMessages(
  taskType: VisionTaskType,
  imageBase64: string,
  mimeType: string = 'image/jpeg'
) {
  const textPrompt = getVisionPrompt(taskType)

  return [
    { role: 'system' as const, content: VISION_AGENT_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: [
        { type: 'text' as const, text: textPrompt },
        { type: 'image_url' as const, image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
      ],
    },
  ]
}

export function buildMultiImageMessages(
  task: string,
  images: Array<{ base64: string; mimeType: string }>
) {
  const content: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: task },
  ]

  for (const img of images) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
    })
  }

  return [
    { role: 'system' as const, content: VISION_AGENT_SYSTEM_PROMPT },
    { role: 'user' as const, content },
  ]
}