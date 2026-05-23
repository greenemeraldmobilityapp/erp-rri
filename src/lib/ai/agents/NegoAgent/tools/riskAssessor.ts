export interface RiskFactors {
  financial: number
  relationship: number
  operational: number
  compliance: number
}

export interface RiskAssessmentResult {
  overall_score: number
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  factors: RiskFactors
  mitigations: string[]
  recommendation: string
}

export function assessNegotiationRisk(
  margin: number,
  customerTier: 'A' | 'B' | 'C',
  paymentTerms: string,
  orderHistory: string,
  customerPaymentHistory?: 'good' | 'slow' | 'defaulted'
): RiskAssessmentResult {
  const factors: RiskFactors = {
    financial: 0,
    relationship: 0,
    operational: 0,
    compliance: 0,
  }
  const mitigations: string[] = []

  // Financial risk
  if (margin < 0) {
    factors.financial += 4
    mitigations.push('Harga di bawah modal - potensi rugi langsung')
  } else if (margin < 0.05) {
    factors.financial += 3
    mitigations.push('Margin sangat tipis - pastikan volume cukup')
  } else if (margin < 0.10) {
    factors.financial += 2
  } else if (margin >= 0.15) {
    factors.financial -= 1
  }

  // Relationship risk
  if (customerTier === 'C') {
    factors.relationship += 2
    mitigations.push('Customer tier C - new atau risky customer')
  } else if (customerTier === 'A') {
    factors.relationship -= 1
  }

  if (orderHistory.includes('new') || orderHistory === 'baru pertama kali') {
    factors.relationship += 1
    mitigations.push('Customer baru - belum ada track record')
  }

  if (customerPaymentHistory === 'slow') {
    factors.relationship += 2
    mitigations.push('History pembayaran lambat')
  } else if (customerPaymentHistory === 'defaulted') {
    factors.relationship += 3
    mitigations.push('Customer punya history tidak bayar')
  }

  // Operational risk
  if (paymentTerms.includes('30 hari') || paymentTerms.includes('net 30')) {
    factors.operational += 1
  } else if (paymentTerms.includes('60 hari') || paymentTerms.includes('net 60')) {
    factors.operational += 2
    mitigations.push('Payment terms panjang - impact cashflow')
  } else if (paymentTerms.includes('cash') || paymentTerms.includes('COD')) {
    factors.operational -= 1
  }

  // Compliance risk
  if (margin < 0.05) {
    factors.compliance += 2
    mitigations.push('Margin di bawah threshold minimum')
  }

  // Calculate overall score (1-10)
  const totalFactorScore =
    Math.max(0, factors.financial) +
    Math.max(0, factors.relationship) +
    Math.max(0, factors.operational) +
    Math.max(0, factors.compliance)

  const overallScore = Math.min(10, Math.max(1, Math.round(totalFactorScore * 1.5)))

  let level: RiskAssessmentResult['level']
  if (overallScore <= 3) {
    level = 'LOW'
  } else if (overallScore <= 6) {
    level = 'MEDIUM'
  } else if (overallScore <= 8) {
    level = 'HIGH'
  } else {
    level = 'CRITICAL'
  }

  let recommendation: string
  if (level === 'LOW') {
    recommendation = 'Transaksi aman untuk dilanjutkan'
  } else if (level === 'MEDIUM') {
    recommendation = 'Lanjutkan dengan monitoring ketat'
  } else if (level === 'HIGH') {
    recommendation = 'Perlu approval tambahan dan mitigasi risiko'
  } else {
    recommendation = 'Tidak direkomendasikan - risiko terlalu tinggi'
  }

  return {
    overall_score: overallScore,
    level,
    factors,
    mitigations,
    recommendation,
  }
}