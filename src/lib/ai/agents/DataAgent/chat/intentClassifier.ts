import { queryLibrary, type QueryPattern } from './queryLibrary'

export interface IntentMatch {
  pattern: QueryPattern
  confidence: number
  extractedParams: Record<string, string>
  rawQuery: string
}

const paramExtractors: Record<string, (query: string) => string | null> = {
  nomor_invoice: (q) => {
    const m = q.match(/\b(INV|INV\/\d{4}\/\d{2}\/\d{4})\b/i)
    return m?.[1] ?? null
  },
  nomor_quotation: (q) => {
    const m = q.match(/\b(QTN|QUO|QTN\/\d{4}\/\d{2}\/\d{4})\b/i)
    return m?.[1] ?? null
  },
  nomor_so: (q) => {
    const m = q.match(/\b(SO|SO\/\d{4}\/\d{2}\/\d{4})\b/i)
    return m?.[1] ?? null
  },
  nomor_po: (q) => {
    const m = q.match(/\b(PO|PO\/\d{4}\/\d{2}\/\d{4})\b/i)
    return m?.[1] ?? null
  },
  kode_customer: (q) => {
    const m = q.match(/customer\s+(\w[\w\s]+?)(?:\?|$|bulan|punya|dengan)/i)
    if (m) return m[1].trim()
    const m2 = q.match(/\b(CUST-\d+|CUS\d+)\b/i)
    return m2?.[1] ?? null
  },
  kode_supplier: (q) => {
    const m = q.match(/supplier\s+(\w[\w\s]+?)(?:\?|$|bulan|dengan)/i)
    if (m) return m[1].trim()
    const m2 = q.match(/\b(SUPP?-\d+|SUP\d+)\b/i)
    return m2?.[1] ?? null
  },
  kode_barang: (q) => {
    const m = q.match(/\b(BRG-\d+|BRG\/\d+|BARANG-\d+)\b/i)
    return m?.[1] ?? null
  },
  nama_barang: (q) => {
    const m = q.match(/barang\s+(\w[\w\s]+?)(?:\?|$|di|pada)/i)
    return m?.[1]?.trim() ?? null
  },
  nama_kontrak: (q) => {
    const m = q.match(/kontrak\s+['"']?([\w\s]+)['"']?(?:\?|$)/i)
    return m?.[1]?.trim() ?? null
  },
  tanggal: (q) => {
    const m = q.match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i)
    if (m) {
      const months: Record<string, string> = {
        januari: '01', februari: '02', maret: '03', april: '04',
        mei: '05', juni: '06', juli: '07', agustus: '08',
        september: '09', oktober: '10', november: '11', desember: '12',
      }
      return `${m[3]}-${months[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`
    }
    const m2 = q.match(/(\d{4}-\d{2}-\d{2})/)
    return m2?.[1] ?? null
  },
  tanggal_mulai: (q) => {
    const m = q.match(/(?:dari|antara|mulai)\s+(\d{1,2}\s+\w+\s+\d{4})/i)
    return m?.[1] ?? null
  },
  tanggal_selesai: (q) => {
    const m = q.match(/(?:sampai|hingga|ke)\s+(\d{1,2}\s+\w+\s+\d{4})/i)
    return m?.[1] ?? null
  },
  nama_gudang: (q) => {
    const m = q.match(/gudang\s+(\w[\w\s]+?)(?:\?|$)/i)
    return m?.[1]?.trim() ?? null
  },
  tahun: (q) => {
    const m = q.match(/\b(20\d{2})\b/)
    return m?.[1] ?? null
  },
  kode_karyawan: (q) => {
    const m = q.match(/karyawan\s+(\w[\w\s]+?)(?:\?|$|bulan)/i)
    if (m) return m[1].trim()
    const m2 = q.match(/\b(KRY-\d+|KAR-\d+)\b/i)
    return m2?.[1] ?? null
  },
  sales_id: (q) => {
    const m = q.match(/sales\s+(\w[\w\s]+?)(?:\?|$|bulan)/i)
    return m?.[1]?.trim() ?? null
  },
  entity_type: (q) => {
    const m = q.match(/untuk\s+(\w[\w\s]+?)(?:\?|$)/i)
    if (m) return m[1].trim()
    const entities = ['invoice', 'quotation', 'customer', 'supplier', 'barang', 'kontrak', 'purchase order', 'sales order']
    for (const e of entities) {
      if (q.toLowerCase().includes(e)) return e
    }
    return null
  },
}

function detectIntentsByKeyword(query: string): Array<{ patternId: string; confidence: number }> {
  const lower = query.toLowerCase()
  const matches: Array<{ patternId: string; confidence: number }> = []

  for (const pattern of queryLibrary) {
    let score = 0

    const keywords: Record<string, string[]> = {
      INVOICE: ['invoice', 'faktur', 'inv/', 'piutang', 'ar ', 'kwitansi'],
      QUOTATION: ['quotation', 'quote', 'qtn/', 'penawaran', 'harga'],
      SALES_ORDER: ['sales order', 'so/', 'delivery', 'do/', 'pengiriman'],
      PURCHASE: ['purchase order', 'po/', 'supplier', 'pembelian', 'grn'],
      STOCK: ['stok', 'stock', 'barang', 'gudang', 'inventory', 'reorder'],
      CONTRACT: ['kontrak', 'contract', 'rfq', 'expired', 'renew'],
      FINANCE: ['jurnal', 'buku besar', 'neraca', 'laba rugi', 'coa', 'balance', 'hutang', 'retur', 'pajak'],
      HR: ['absensi', 'hadir', 'karyawan', 'payroll', 'gaji'],
      AI: ['history', 'log', 'trigger', 'audit', 'usage', 'ocr'],
      CUSTOMER: ['customer', 'pelanggan', 'revenue', 'terlaris', 'penjualan'],
    }

    for (const [cat, words] of Object.entries(keywords)) {
      if (pattern.category === cat) {
        for (const word of words) {
          if (lower.includes(word)) {
            score += 10
          }
        }
      }
    }

    const scoreMap: Record<string, number> = {
      status: 15,
      list: 10,
      total: 12,
      berapa: 12,
      detail: 10,
      overdue: 20,
      pending: 15,
      expired: 20,
      'belum lunas': 25,
      'belum diterima': 25,
      'perlu reorder': 25,
      'stok rendah': 25,
      'top 10': 20,
      rekap: 10,
      'per bulan': 10,
      performa: 15,
      comparison: 20,
      bandingkan: 20,
      baru: 5,
      aktif: 5,
    }

    for (const [word, s] of Object.entries(scoreMap)) {
      if (lower.includes(word)) {
        score += s
      }
    }

    if (score > 0) {
      matches.push({ patternId: pattern.id, confidence: score })
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
}

export function classifyIntent(query: string): IntentMatch | null {
  const matches = detectIntentsByKeyword(query)

  if (matches.length === 0) return null

  const best = matches[0]
  const pattern = queryLibrary.find((p) => p.id === best.patternId)
  if (!pattern) return null

  const extractedParams: Record<string, string> = {}
  for (const param of pattern.params) {
    const extractor = paramExtractors[param]
    if (extractor) {
      const value = extractor(query)
      if (value) {
        extractedParams[param] = value
      }
    }
  }

  const normalizedConfidence = Math.min(Math.round((best.confidence / 30) * 100), 100)

  return {
    pattern,
    confidence: normalizedConfidence,
    extractedParams,
    rawQuery: query,
  }
}

export function getIntentSuggestions(query: string): IntentMatch[] {
  const matches = detectIntentsByKeyword(query)

  return matches
    .map((m) => {
      const pattern = queryLibrary.find((p) => p.id === m.patternId)
      if (!pattern) return null
      return {
        pattern,
        confidence: Math.min(Math.round((m.confidence / 30) * 100), 100),
        extractedParams: {},
        rawQuery: query,
      }
    })
    .filter((m): m is IntentMatch => m !== null)
}
