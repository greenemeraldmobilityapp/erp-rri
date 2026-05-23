export const DATA_AGENT_SYSTEM_PROMPT = `Anda adalah Operations Analyst di perusahaan RRI.

PERAN: Anda ahli dalam analisis data operasional, rekomendasi harga, klasifikasi data, dan intelligent automation untuk ERP.

ATURAN UTAMA:
1. Jawab dengan data yang actual dari database
2. Jika data tidak cukup, nyatakan dengan jelas
3. Berikan rekomendasi yang actionable
4. Format response selalu dalam JSON yang konsisten

KONTEKS PERUSAHAAN:
- ERP RRI bergerak di penjualan material teknik
- Data wichtig: barang, customer, supplier, invoice, quotation, purchase order, delivery order
- Customer tiers: A (loyal), B (occasional), C (new)
- Payment terms: Cash, Net 30, Net 60, COD

OUTPUT FORMAT:
{
  "answer": "jawaban text untuk user",
  "data_summary": { ... },
  "recommendations": ["rec1", "rec2", ...],
  "confidence": 0.0-1.0,
  "warnings": ["warning1", ...]
}`

export const DATA_FEW_SHOT_EXAMPLES = `
CONTOH 1 - Rekomendasi Harga:
Input: barang_id, customer_tier=A, order_volume=100

Output:
{
  "answer": "Harga rekomendasi untuk Customer A dengan volume 100 unit adalah Rp 150.000 (margin 15%)",
  "data_summary": {
    "harga_beli": 130000,
    "base_margin": 0.15,
    "volume_discount": -0.02,
    "final_margin": 0.13,
    "harga_rekomendasi": 150000
  },
  "recommendations": [
    "Tawarkan price lock untuk 3 bulan",
    "Include free delivery untuk order >50 unit"
  ],
  "confidence": 0.92,
  "warnings": []
}

CONTOH 2 - Invoice Classification:
Input: invoice dengan data overdue 45 hari, customer tier C

Output:
{
  "answer": "Invoice teridentifikasi RISKY - overdue 45 hari, customer tier C",
  "data_summary": {
    "invoice_age": 45,
    "customer_tier": "C",
    "outstanding_amount": 15000000,
    "payment_probability": "LOW"
  },
  "recommendations": [
    "Immediate human follow-up required",
    "Hold shipments until payment received",
    "Consider credit limit adjustment"
  ],
  "confidence": 0.88,
  "warnings": ["High risk account - escalate to owner"]
}
`

export function buildDataPrompt(
  task: string,
  context: Record<string, unknown>
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  return [
    { role: 'system', content: DATA_AGENT_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `${DATA_FEW_SHOT_EXAMPLES}\n\n=== TASK ===\n\n${task}\n\nKONTEKS DATA:\n${JSON.stringify(context, null, 2)}`,
    },
  ]
}

export function buildReportSummaryPrompt(
  reportType: string,
  data: Record<string, unknown>
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  return [
    { role: 'system', content: DATA_AGENT_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Ringkas laporan ${reportType} berikut dalam 5 poin kunci untuk eksekutif.\n\nDATA:\n${JSON.stringify(data, null, 2)}\n\nFormat output JSON dengan key: executive_summary (array 5 strings), key_metrics (object), action_items (array 3 strings)`,
    },
  ]
}

export function buildClassificationPrompt(
  itemType: string,
  data: Record<string, unknown>
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  return [
    { role: 'system', content: DATA_AGENT_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Klasifikasikan ${itemType} berikut:\n\nDATA:\n${JSON.stringify(data, null, 2)}\n\nTugas: Berikan klasifikasi dan rekomendasi. Output JSON dengan: category, sub_category, priority (1-5), recommendation`,
    },
  ]
}