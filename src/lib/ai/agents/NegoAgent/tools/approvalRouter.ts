export type ApprovalLevel = 'sales' | 'manager' | 'owner'

export interface ApprovalRoutingResult {
  approval_level: ApprovalLevel
  reason: string
  escalation_needed: boolean
  auto_approved: boolean
}

interface ApprovalRule {
  min_margin: number
  max_margin?: number
  customer_tier?: 'A' | 'B' | 'C'
  payment_terms?: string
  risk_score?: number
  approval_level: ApprovalLevel
  reason: string
  auto_approved: boolean
}

const APPROVAL_RULES: ApprovalRule[] = [
  // High margin - auto accept
  { min_margin: 0.25, approval_level: 'sales', reason: 'Margin >25% - excellent', auto_approved: true },
  { min_margin: 0.20, max_margin: 0.25, approval_level: 'sales', reason: 'Margin 20-25% - very good', auto_approved: true },
  { min_margin: 0.15, max_margin: 0.20, approval_level: 'sales', reason: 'Margin 15-20% - good', auto_approved: true },

  // Acceptable margin - accept with monitoring
  { min_margin: 0.12, max_margin: 0.15, approval_level: 'sales', reason: 'Margin 12-15% - acceptable', auto_approved: false },
  { min_margin: 0.10, max_margin: 0.12, approval_level: 'manager', reason: 'Margin 10-12% - need manager review', auto_approved: false },

  // Thin margin - require approval
  { min_margin: 0.08, max_margin: 0.10, approval_level: 'manager', reason: 'Margin 8-10% - manager approval', auto_approved: false },
  { min_margin: 0.05, max_margin: 0.08, approval_level: 'owner', reason: 'Margin 5-8% - owner approval required', auto_approved: false },

  // Loss - always owner
  { min_margin: 0, max_margin: 0.05, approval_level: 'owner', reason: 'Margin <5% or loss - owner mandatory', auto_approved: false },
  { min_margin: -Infinity, max_margin: 0, approval_level: 'owner', reason: 'Harga di bawah modal - REJECT', auto_approved: false },
]

export function routeApproval(
  margin: number,
  customerTier?: 'A' | 'B' | 'C',
  paymentTerms?: string,
  riskScore?: number
): ApprovalRoutingResult {
  for (const rule of APPROVAL_RULES) {
    const withinMarginRange =
      margin >= rule.min_margin &&
      (rule.max_margin === undefined || margin < rule.max_margin)

    const withinCustomerTier = !rule.customer_tier || rule.customer_tier === customerTier
    const withinRiskThreshold = !rule.risk_score || (riskScore !== undefined && riskScore <= rule.risk_score)

    if (withinMarginRange && withinCustomerTier && withinRiskThreshold) {
      const escalationNeeded = rule.approval_level !== 'sales'
      const autoApproved = rule.auto_approved && !escalationNeeded

      return {
        approval_level: rule.approval_level,
        reason: rule.reason,
        escalation_needed: escalationNeeded,
        auto_approved: autoApproved,
      }
    }
  }

  return {
    approval_level: 'owner',
    reason: 'Default fallback - owner review',
    escalation_needed: true,
    auto_approved: false,
  }
}

export function getApprovalThresholdText(level: ApprovalLevel): string {
  switch (level) {
    case 'sales':
      return 'Sales bisa approve langsung (margin >=15%)'
    case 'manager':
      return 'Manager harus approve (margin 10-15%)'
    case 'owner':
      return 'Owner harus approve (margin <10% atau high-risk)'
  }
}