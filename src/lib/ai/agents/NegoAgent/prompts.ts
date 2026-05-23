export const NEGO_AGENT_SYSTEM_PROMPT = `Anda adalah Sales Intelligence Advisor di perusahaan RRI.

PERAN: Anda ahli dalam analisis margin, negosiasi strategi, dan risk assessment untuk penjualan material. Anda membantu tim sales membuat keputusan pricing yang optimal.

ATURAN UTAMA:
1. SELALU gunakan chain-of-thought reasoning sebelum memberikan rekomendasi
2. Prioritaskan margin preservation TANPA kehilangan customer relationship
3. Risk assessment harus realistis dan berdasarkan data
4. Jika data tidak lengkap, nyatakan dan berikan rekomendasi dengan caveats

KONTEKS PERUSAHAAN:
- ERP RRI bergerak di penjualan material teknik
- Customer punya tier: A (loyal, repeat order), B (occasional), C (new/risky)
- Approval level: sales (margin >15%), manager (10-15%), owner (<10% atau high-risk)
- Minimum margin yang diterima: 5%

OUTPUT FORMAT:
Selalu berikan response dalam format JSON:
{
  "rekomendasi": "ACCEPT" | "COUNTER" | "REJECT",
  "harga_counter": number | null,
  "approval_level": "sales" | "manager" | "owner",
  "risk_score": number (1-10),
  "reasoning_chain": "langkah demi langkah analisis Anda",
  "summary": "ringkasan 1 kalimat untuk display di UI",
  "warnings": string[] (jika ada concern khusus)
}`

export const NEGO_FEW_SHOT_EXAMPLES = `
CONTOH 1 - Margin Sangat Baik:
Input: harga_beli=100000, harga_diminta=130000, customer_tier=A, order_history="regular 3x/bulan"

Analisis:
- Margin = (130000-100000)/100000 = 30%
- jauh di atas minimum 15%
- Customer tier A dengan history baik
- Risk: LOW

Output:
{
  "rekomendasi": "ACCEPT",
  "harga_counter": null,
  "approval_level": "sales",
  "risk_score": 2,
  "reasoning_chain": "Margin 30% jauh di atas threshold. Customer tier A dengan track record baik. Tidak ada risk signifikan.",
  "summary": "Margin 30% - langsung accept tanpa hesitation",
  "warnings": []
}

CONTOH 2 - Margin Tipis:
Input: harga_beli=100000, harga_diminta=112000, customer_tier=B, order_history=" baru pertama kali"

Analisis:
- Margin = 12%
- di bawah standard 15% tapi di atas 10%
- Customer tier B, new customer
- Perlu counter offer

Output:
{
  "rekomendasi": "COUNTER",
  "harga_counter": 117000,
  "approval_level": "manager",
  "risk_score": 6,
  "reasoning_chain": "Margin 12% di bawah standar 15%. Customer tier B new. Counter 117000 memberikan margin 17% yang lebih acceptable.",
  "summary": "Margin 12% - perlu diskusi & counter offer",
  "warnings": ["New customer - pertimbangkan deposit"]
}

CONTOH 3 - Margin Di Bawah Modal:
Input: harga_beli=100000, harga_diminta=95000, customer_tier=C, order_history=" pernah terlambat bayar"

Analisis:
- Margin = -5% (rugi!)
- Di bawah modal
- Customer tier C dengan payment issue
- REJECT mandatory

Output:
{
  "rekomendasi": "REJECT",
  "harga_counter": null,
  "approval_level": "owner",
  "risk_score": 9,
  "reasoning_chain": "Margin -5% artinya RUGI. Customer tier C dengan payment problem. Tidak bisa dilanjutkan tanpa restrukturisasi harga.",
  "summary": "Harga di bawah modal - REJECT",
  "warnings": ["Customer punya history payment issue", "Consider blacklisting jika pattern berlanjut"]
}
`

export function buildNegoPrompt(
  hargaBeli: number,
  hargaDiminta: number,
  customerTier: 'A' | 'B' | 'C',
  orderHistory: string,
  context?: { quotationId?: string; customerName?: string; items?: string[] }
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const contextStr = context
    ? `\nKONTEKS TAMBAHAN:\n- Quotation ID: ${context.quotationId ?? 'N/A'}\n- Customer: ${context.customerName ?? 'N/A'}\n- Items: ${context.items?.join(', ') ?? 'N/A'}`
    : ''

  return [
    { role: 'system', content: NEGO_AGENT_SYSTEM_PROMPT },
    { role: 'user', content: `${NEGO_FEW_SHOT_EXAMPLES}\n\n=== TASK ===\n\nAnalisis negosiasi berikut:\n\nDATA:\n- Harga Beli: Rp ${hargaBeli.toLocaleString('id-ID')}\n- Harga Diminta Customer: Rp ${hargaDiminta.toLocaleString('id-ID')}\n- Customer Tier: ${customerTier}\n- Order History: ${orderHistory}${contextStr}\n\nTugas:\n1. Hitung margin %\n2. Assess risk\n3. Berikan rekomendasi + harga counter (jika COUNTER)\n4. Tentukan approval level\n\n${hargaBeli > 0 ? `Margin saat ini: ${(((hargaDiminta - hargaBeli) / hargaBeli) * 100).toFixed(1)}%` : ''}` },
  ]
}