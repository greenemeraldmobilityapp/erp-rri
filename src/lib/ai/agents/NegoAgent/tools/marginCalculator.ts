export interface MarginResult {
  margin_percent: number
  margin_absolute: number
  is_profitable: boolean
  tier: 'excellent' | 'good' | 'acceptable' | 'thin' | 'loss'
  adjustment_suggestion?: string
}

export function calculateMargin(hargaBeli: number, hargaJual: number): MarginResult {
  if (hargaBeli <= 0) {
    return {
      margin_percent: 0,
      margin_absolute: 0,
      is_profitable: false,
      tier: 'loss',
      adjustment_suggestion: 'Harga beli tidak valid',
    }
  }

  const marginAbsolute = hargaJual - hargaBeli
  const marginPercent = (marginAbsolute / hargaBeli) * 100

  let tier: MarginResult['tier']
  let isProfitable: boolean
  let adjustmentSuggestion: string | undefined

  if (marginPercent >= 25) {
    tier = 'excellent'
    isProfitable = true
  } else if (marginPercent >= 15) {
    tier = 'good'
    isProfitable = true
  } else if (marginPercent >= 10) {
    tier = 'acceptable'
    isProfitable = true
  } else if (marginPercent >= 5) {
    tier = 'thin'
    isProfitable = true
    adjustmentSuggestion = `Minimal naikkan ${((5 - marginPercent) * hargaBeli / 100).toLocaleString('id-ID')} untuk margin aman`
  } else if (marginPercent > 0) {
    tier = 'thin'
    isProfitable = true
    adjustmentSuggestion = `Naikkan minimal ${((5 - marginPercent) * hargaBeli / 100).toLocaleString('id-ID')} agar margin >= 5%`
  } else {
    tier = 'loss'
    isProfitable = false
    adjustmentSuggestion = `Harga jual harus minimal ${(hargaBeli * 1.05).toLocaleString('id-ID')} untuk margin 5%`
  }

  return {
    margin_percent: marginPercent,
    margin_absolute: marginAbsolute,
    is_profitable: isProfitable,
    tier,
    adjustment_suggestion: adjustmentSuggestion,
  }
}

export function suggestCounterPrice(
  hargaBeli: number,
  hargaDiminta: number,
  targetMargin: number = 0.15
): number {
  const minimumMarginPrice = hargaBeli * (1 + 0.05) // minimum 5%
  const targetPrice = hargaBeli * (1 + targetMargin)

  if (hargaDiminta >= targetPrice) {
    return hargaDiminta
  }

  if (hargaDiminta >= minimumMarginPrice) {
    const counterPrice = Math.round(hargaDiminta / 1000) * 1000
    return counterPrice >= minimumMarginPrice ? counterPrice : minimumMarginPrice
  }

  return Math.ceil(minimumMarginPrice / 1000) * 1000
}