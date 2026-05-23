# AI Agents Roadmap — ERP RRI

**Versi:** Final
**Tanggal:** 2026-05-23
**Status:** Ready for Development

---

## Executive Summary

ERP RRI akan menggunakan **3 AI Agent** berbasis **NVIDIA NIM (Free Endpoint)** untuk mengautomasi workflow bisnis. Semua model adalah **gratis** — tidak ada cost per token. Web scraping untuk price intelligence **ditunda** sementara (bukan Shopee/Tokopedia).

---

## Model Inventory

| Agent | Model ID | Provider | Biaya | Use Case |
|-------|----------|----------|-------|----------|
| **NegoAgent** | `stepfun-ai/step-3.5-flash` | StepFun/NVIDIA | **FREE** | Margin analysis, negotiation, approval routing |
| **DataAgent** | `minimaxai/minimax-m2.7` | MiniMax/NVIDIA | **FREE** | Price recommendation, report summarizer, automation triggers |
| **VisionAgent** | `microsoft/phi-4-multimodal-instruct` | Microsoft/NVIDIA | **FREE** | OCR kontrak, document parsing |

**Base URL:** `https://integrate.api.nvidia.com/v1`
**Auth:** Bearer Token (nvapi-...)

---

## Arsitektur AI Agents

```
src/lib/ai/
├── client.ts                     # NVIDIA OpenAI-compatible client factory
├── streaming.ts                  # SSE streaming utilities
├── cache.ts                      # Response caching (5-min TTL)
└── agents/
    ├── types.ts                 # Shared types: AgentResponse, TriggerType, etc.
    ├── NegoAgent/
    │   ├── index.ts            # Orchestrator + save to ai_nego_history
    │   ├── prompts.ts          # System prompt + few-shot examples
    │   └── tools/
    │       ├── marginCalculator.ts   # Margin calculation + counter price
    │       ├── approvalRouter.ts      # Approval level routing
    │       └── riskAssessor.ts        # Risk scoring
    ├── DataAgent/
    │   ├── index.ts            # Orchestrator + handleAutomationTrigger
    │   ├── prompts.ts          # System prompt + task templates
    │   └── tools/
    │       ├── priceRecommender.ts   # Dynamic pricing rules
    │       ├── reportSummarizer.ts    # AR aging, neraca, laba-rugi summaries
    │       ├── dataClassifier.ts    # Invoice classification
    │       ├── autoInvoice.ts        # Generate invoice from quotation
    │       ├── smartReminder.ts       # WhatsApp reminder generator
    │       ├── prRouter.ts           # Supplier routing for PR
    │       ├── grnChecker.ts         # GRN quality + stock check
    │       └── contractAlert.ts      # Contract expiry alerts
    └── VisionAgent/
        ├── index.ts            # OCR orchestrator + save to ai_vision_history
        └── prompts.ts          # Vision system prompts

src/app/api/v1/ai/agents/
├── nego-agent/route.ts         # NegoAgent streaming API
├── data-agent/route.ts         # DataAgent + triggers
└── vision-agent/route.ts      # VisionAgent document processing
```

---

## 9 Idea Features — Semua Diimplementasi

Berdasarkan diskusi, semua 9 ide fitur automation akan diimplementasi sebagai **DataAgent tools**:

| # | Fitur | Tool | Trigger | Status |
|---|--------|------|---------|--------|
| 1 | Margin Analysis + Negotiation | `marginCalculator`, `riskAssessor` | Manual / Quotation | ✅ Built |
| 2 | Auto-Approval Routing | `approvalRouter` | After NegoAgent | ✅ Built |
| 3 | Counter Offer Generator | `marginCalculator` | After NegoAgent | ✅ Built |
| 4 | Auto-Invoice Generation | `autoInvoice` | QUOTATION_CREATED | ✅ Built |
| 5 | Smart AR Reminder | `smartReminder` | AR_OVERDUE_30 | ✅ Built |
| 6 | Purchase Request Routing | `prRouter` | PR_SUBMITTED | ✅ Built |
| 7 | GRN Quality + Stock Check | `grnChecker` | GRN_CREATED | ✅ Built |
| 8 | Contract Renewal Alert | `contractAlert` | CONTRACT_NEARING_EXPIRY | ✅ Built |
| 9 | Invoice Risk Classification | `dataClassifier` | INVOICE_CREATED | ✅ Built |

---

## Automation Triggers

Semua trigger berjalan otomatis via `handleAutomationTrigger()`:

| Trigger | Event | Action |
|---------|-------|--------|
| `INVOICE_CREATED` | Invoice baru dibuat | → `dataClassifier` → flag risky invoices |
| `QUOTATION_CREATED` | Quotation baru | → trigger pricing analysis |
| `PR_SUBMITTED` | Purchase Request masuk | → `prRouter` → auto-assign supplier |
| `GRN_CREATED` | Delivery received | → `grnChecker` → quality + stock update |
| `CONTRACT_NEARING_EXPIRY` | 30 hari sebelum expiry | → `contractAlert` → notify + suggest renewal |
| `AR_OVERDUE_30` | AR > 30 hari overdue | → `smartReminder` → generate WA message |
| `MANUAL_TRIGGER` | User klik manual | → Any DataAgent task |

---

## Database Schema (Migration 0004)

```sql
-- ai_nego_history      — Negotiation analysis results
-- ai_data_history      — DataAgent task results
-- ai_vision_history    — VisionAgent OCR results
-- ai_automation_log     — Automation trigger audit trail
```

RLS Policies: User hanya bisa lihat history mereka sendiri.

---

## Development Phases

### Phase 1: Foundation (Foundation)
- [x] Install `openai` SDK
- [x] Buat `src/lib/ai/client.ts` — NVIDIA client factory
- [x] Buat `src/lib/ai/streaming.ts` — SSE utilities
- [x] Buat `src/lib/ai/agents/types.ts` — shared types
- [x] Buat `drizzle/0004_ai_agents_history.sql` — migrations
- [ ] Install: `npm install openai --legacy-peer-deps` ← DONE
- [ ] Apply migration: `npx drizzle-kit push` atau via Supabase
- [ ] Test connectivity: verify all 3 models respond

### Phase 2: NegoAgent
- [x] Buat `src/lib/ai/agents/NegoAgent/index.ts`
- [x] Buat `src/lib/ai/agents/NegoAgent/prompts.ts`
- [x] Buat 3 tools: marginCalculator, approvalRouter, riskAssessor
- [ ] Buat `/api/v1/ai/agents/nego-agent/route.ts`
- [ ] Buat `/dashboard/ai/nego-agent/page.tsx`
- [ ] Implement streaming reasoning_content display

### Phase 3: DataAgent (Full)
- [x] Buat `src/lib/ai/agents/DataAgent/index.ts`
- [x] Buat `src/lib/ai/agents/DataAgent/prompts.ts`
- [x] Buat 8 tools: priceRecommender, reportSummarizer, dataClassifier, autoInvoice, smartReminder, prRouter, grnChecker, contractAlert
- [ ] Buat `/api/v1/ai/agents/data-agent/route.ts`
- [ ] Buat automation trigger endpoint
- [ ] Buat `/dashboard/ai/data-agent/page.tsx`

### Phase 4: VisionAgent
- [x] Buat `src/lib/ai/agents/VisionAgent/index.ts`
- [x] Buat `src/lib/ai/agents/VisionAgent/prompts.ts`
- [ ] Buat `/api/v1/ai/agents/vision-agent/route.ts`
- [ ] Buat document upload UI
- [ ] Integration dengan existing OCR page

### Phase 5: Integration
- [ ] Wire automation triggers ke database events
- [ ] Add rate limiting middleware
- [ ] Add usage dashboard (per user, per agent)
- [ ] Fallback to rule-based jika AI timeout
- [ ] Documentation: API reference

---

## Environment Variables

```env
# NVIDIA NIM Configuration
NVIDIA_API_KEY="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"
NVIDIA_BASE_URL="https://integrate.api.nvidia.com/v1"

# Model IDs
NVIDIA_MODEL_NEGO="stepfun-ai/step-3.5-flash"
NVIDIA_MODEL_DATA="minimaxai/minimax-m2.7"
NVIDIA_MODEL_VISION="microsoft/phi-4-multimodal-instruct"

# Rate Limiting (optional)
# AI_RATE_LIMIT_NEGO=50
# AI_RATE_LIMIT_DATA=100
# AI_RATE_LIMIT_VISION=30
```

---

## Technical Notes

### Streaming
- **NegoAgent**: `stream: true`, handle `reasoning_content` + `content` separately
  - `reasoning_content` → display as collapsible "AI Thinking" section
  - `content` → final answer
- **DataAgent**: `stream: true`, plain text content
- **VisionAgent**: `stream: false` recommended for image processing

### API Call Pattern
```typescript
import { createNvidiaClient, AI_MODELS, MODEL_CONFIGS } from '@/lib/ai/client'

const client = createNvidiaClient()
const response = await client.chat.completions.create({
  model: AI_MODELS.NEGO_AGENT,
  messages: [...],
  ...MODEL_CONFIGS.NEGO_AGENT,
})
```

### Caching
- Default TTL: 5 minutes
- Cache key: `${agentType}:${hash(JSON.stringify(input))}`
- Use `getCache()`, `setCache()`, `deleteCache()` dari `lib/ai/cache.ts`

---

## Status File

| File | Created | Status |
|------|---------|--------|
| `src/lib/ai/client.ts` | ✅ | Done |
| `src/lib/ai/streaming.ts` | ✅ | Done |
| `src/lib/ai/cache.ts` | ✅ | Done |
| `src/lib/ai/agents/types.ts` | ✅ | Done |
| `src/lib/ai/agents/NegoAgent/*` | ✅ | Done |
| `src/lib/ai/agents/DataAgent/*` | ✅ | Done |
| `src/lib/ai/agents/VisionAgent/*` | ✅ | Done |
| `drizzle/0004_ai_agents_history.sql` | ✅ | Done |
| `/api/v1/ai/agents/*` | ⏳ | Pending |
| `/dashboard/ai/*` pages | ⏳ | Pending |
| Trigger integration | ⏳ | Pending |

---

## Next Steps (Immediate)

1. **Apply migration** ke database: `npx drizzle-kit push`
2. **Test AI connectivity** — verify all 3 models respond
3. **Build API routes** untuk setiap agent
4. **Build dashboard pages** untuk user interaction
5. **Integrate automation triggers** dengan database events

---

## References

- NVIDIA AI Gateway: `https://integrate.api.nvidia.com/v1`
- NVIDIA NIM Catalog: `https://build.nvidia.com/explore/discover`
- stepfun-ai/step-3.5-flash — reasoning with chain-of-thought
- minimaxai/minimax-m2.7 — general purpose
- microsoft/phi-4-multimodal-instruct — multimodal vision