#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Supabase Database Webhook Setup Script
# =============================================================================
# Configures Supabase Database Webhooks for AI agent automation triggers.
#
# Prerequisites:
#   1. Supabase Personal Access Token (PAT):
#      - Go to https://supabase.com/dashboard/account/tokens
#      - Create a token with scope "Webhooks: Write" and "Projects: Read"
#      - Export it as SUPABASE_ACCESS_TOKEN
#
#   2. Environment variables:
#      - SUPABASE_PROJECT_REF        (e.g., "abcdefghijklmno")
#      - WEBHOOK_URL                 (your deployed app URL + /api/v1/ai/agents/automation/webhook)
#      - AI_WEBHOOK_SECRET           (shared secret for authentication)
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN="sbp_..."
#   export SUPABASE_PROJECT_REF="your_ref"
#   export WEBHOOK_URL="https://your-app.com/api/v1/ai/agents/automation/webhook"
#   export AI_WEBHOOK_SECRET="your-secret"
#   bash scripts/setup-webhooks.sh
# =============================================================================

: "${SUPABASE_ACCESS_TOKEN:?Required: Supabase PAT (sbp_...)}"
: "${SUPABASE_PROJECT_REF:?Required: Supabase project ref}"
: "${WEBHOOK_URL:?Required: Webhook endpoint URL}"
: "${AI_WEBHOOK_SECRET:?Required: Webhook shared secret}"

API_BASE="https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/webhooks"

create_webhook() {
  local table="$1"
  local events="$2"
  local webhook_name="ai-automation-${table}"

  echo "Creating webhook for table: ${table} (events: ${events})..."

  curl -s -X POST "${API_BASE}" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "'"${webhook_name}"'",
      "table": "'"${table}"'",
      "events": '"${events}"',
      "webhook_url": "'"${WEBHOOK_URL}"'",
      "headers": {
        "x-webhook-secret": "'"${AI_WEBHOOK_SECRET}"'"
      },
      "batch": false
    }' | jq '.'
}

echo "=== Setting up Supabase Database Webhooks ==="
echo "Project: ${SUPABASE_PROJECT_REF}"
echo "Webhook URL: ${WEBHOOK_URL}"
echo ""

# Invoice table -> INVOICE_CREATED trigger
create_webhook "invoice" '["INSERT"]'

# Quotation table -> QUOTATION_CREATED trigger
create_webhook "quotation" '["INSERT"]'

# Purchase Request table -> PR_SUBMITTED trigger
create_webhook "purchase_request" '["INSERT"]'

# GRN table -> GRN_CREATED trigger
create_webhook "grn" '["INSERT"]'

echo ""
echo "=== Done! Webhooks configured successfully ==="
