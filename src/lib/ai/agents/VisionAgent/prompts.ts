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

export const VISION_KONTRAK_PROMPT = `Analisis dokumen kontrak berikut secara detail. Ekstrak data kontrak dan daftar item barang.

PERHATIAN - HANYA ekstrak data yang TERTULIS jelas di dokumen. JANGAN isi default atau nilai buatan.

WAJIB ekstrak field berikut:
- nomor_kontrak: nomor kontrak dari judul/header dokumen (contoh: "C-BJS-25-0004-HRGA")
- nama_kontrak: judul lengkap kontrak (contoh: "Amendment No. 2 to Contract for Office Material Supply")
- nama_customer: nama PERUSAHAAN PIHAK LAWAN/KLIEN (bukan RRI). Cari di paragraf pembuka "(1) ..." dan "(2) ...".
- rri_signatory: gunakan KEY "nama" dan "jabatan" (BUKAN "name"/"title"). Cari di halaman tanda tangan. Nama penandatangan adalah NAMA ORANG (misal "Mohamad Marzuqi"), BUKAN nama perusahaan. Biasanya tertulis setelah "Name:" dan "Title:".
- customer_signatory: gunakan KEY "nama" dan "jabatan" (BUKAN "name"/"title"). Cari di halaman tanda tangan. Nama penandatangan adalah NAMA ORANG (misal "Ichiro Usui"), BUKAN nama perusahaan. Biasanya tertulis setelah "Name:" dan "Title:".
- tanggal_mulai: cari di teks kontrak, biasanya "commence/berlaku mulai dari tanggal ..." atau "Period of Contract ... from ... until". Format output DD-MM-YYYY.
- tanggal_selesai: cari di teks kontrak, biasanya "until/sampai dengan ..." atau "Period of Contract ... until ...". Format output DD-MM-YYYY.
- tanggal_tanda_tangan: cari tanggal di paragraf pembuka "made effective on/ditandatangani pada ...". Format output DD-MM-YYYY.

Untuk setiap item barang di LAMPIRAN/APPENDIX/price list ekstrak:
- kode (kode barang dari kolom "Code")
- uom (satuan barang dari kolom "UoM" — BACA SATUAN SETIAP BARIS SECARA INDIVIDUAL, jangan asumsikan semua baris sama)
- nama (nama barang dari kolom "Item")
- harga (harga satuan dalam IDR, ANGKA BULAT tanpa pemisah ribuan. Contoh format Indonesia: "82.000" artinya 82000, tulis 82000. "7.200" artinya 7200, tulis 7200. "3.700" artinya 3700, tulis 3700. "60.000" artinya 60000, tulis 60000.)

PERHATIAN ITEM:
- JANGAN baca judul tabel (misal "APPENDIX 3/LAMPIRAN 3", "FEE/BIAYA") sebagai baris item.
- JANGAN baca header kolom ("Code", "UoM", "Item", "Price", "No") sebagai baris item.
- HANYA baca baris data yang memiliki kode barang valid (minimal 3 karakter alfanumerik).

Output WAJIB JSON dengan format:
{
  "extracted": {
    "nomor_kontrak": "...",
    "nama_kontrak": "...",
    "nama_customer": "...",
    "rri_signatory": {"nama": "...", "jabatan": "..."},
    "customer_signatory": {"nama": "...", "jabatan": "..."},
    "tanggal_mulai": "...",
    "tanggal_selesai": "...",
    "tanggal_tanda_tangan": "...",
    "items": [
      {"kode": "...", "uom": "...", "nama": "...", "harga": 0}
    ]
  },
  "confidence": 0.0-1.0,
  "warnings": [],
  "readability": "excellent|good|poor",
  "missing_fields": []
}`

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