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
    │   ├── chat/               # NL-to-SQL RAG (DataAgent chat only)
    │   │   ├── intentClassifier.ts   # Regex/keyword → intent type (100+ patterns)
    │   │   ├── queryLibrary.ts        # 100 predefined SQL patterns (10 categories)
    │   │   ├── queryBuilder.ts        # Build parameterized SQL
    │   │   ├── responseFormatter.ts   # LLM format output ONLY
    │   │   └── chatRouter.ts          # Orchestrate 3-layer flow
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
|----|--------|------|---------|--------|
| 1 | Margin Analysis + Negotiation | `marginCalculator`, `riskAssessor` | Manual / Quotation | ✅ Built |
| 2 | Price Recommendation | `priceRecommender` | Manual / Item | ✅ Built |
| 3 | Report Summarizer | `reportSummarizer` | Manual / Schedule | ✅ Built |
| 4 | Invoice Classification | `dataClassifier` | INVOICE_CREATED | ✅ Built |
| 5 | Auto Invoice from Quotation | `autoInvoice` | Quotation approved | ✅ Built |
| 6 | Smart AR Reminder | `smartReminder` | AR_OVERDUE_30 | ✅ Built |
| 7 | PR Supplier Router | `prRouter` | PR_SUBMITTED | ✅ Built |
| 8 | GRN Quality Checker | `grnChecker` | GRN_CREATED | ✅ Built |
| 9 | Contract Expiry Alert | `contractAlert` | CONTRACT_NEARING_EXPIRY | ✅ Built |

## Implementation Status — Semua ✅ Berhasil

| Komponen | Status | Keterangan |
|----------|--------|------------|
| NVIDIA Connectivity | ✅ Tested | 3/3 models respond successfully |
| NL-to-SQL Query Library | ✅ 100 queries | 10 categories, parameterized SQL |
| Intent Classifier | ✅ 100+ patterns | Keyword + regex + parameter extraction |
| Query Builder | ✅ | Parameterized + Supabase Admin execute |
| Response Formatter | ✅ Rule fallback | LLM format + table fallback on timeout |
| Chat Router | ✅ | 3-layer: classify → query → format |
| NegoAgent API | ✅ POST/GET | Streaming with reasoning_content |
| DataAgent API | ✅ POST + SSE | Chat, task, trigger endpoints |
| VisionAgent API | ✅ POST/GET | Upload, URL, base64, history |
| NegoAgent Dashboard | ✅ | Form + margin + risk |
| DataAgent Dashboard | ✅ | Chat UI + suggested queries |
| VisionAgent Dashboard | ✅ | Upload + URL + history |
| Usage Dashboard | ✅ | Per-agent stats, daily chart, top users |
| Automation Webhook | ✅ | Supabase Database Webhook receiver |
| Automation CRON | ✅ | CONTRACT_NEARING_EXPIRY + AR_OVERDUE_30 |
| Rate Limiting | ✅ Middleware | IP-based, per-agent configurable limits |
| exec_sql Function | ✅ Supabase RPC | Direct SQL via service_role |
| get_top_ai_users Function | ✅ Supabase RPC | Usage stats aggregation |
| Migration 0004 | ✅ Applied | 4 tables + indexes + RLS |
| Migration 0005 | ✅ Applied | exec_sql function |
| Migration 0006 | ✅ Applied | get_top_ai_users function |
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
- [ ] Apply migration: `npx drizzle-kit push` atau via Supabase
- [ ] Test connectivity: verify all 3 models respond

### Phase 2: NegoAgent
- [x] Buat `src/lib/ai/agents/NegoAgent/index.ts`
- [x] Buat `src/lib/ai/agents/NegoAgent/prompts.ts`
- [x] Buat 3 tools: marginCalculator, approvalRouter, riskAssessor
- [x] Buat `/api/v1/ai/agents/nego-agent/route.ts`
- [x] Buat `/dashboard/ai/nego-agent/page.tsx`
- [x] Implement streaming reasoning_content display

### Phase 3: DataAgent (Full)
- [x] Buat `src/lib/ai/agents/DataAgent/index.ts`
- [x] Buat `src/lib/ai/agents/DataAgent/prompts.ts`
- [x] Buat 8 tools: priceRecommender, reportSummarizer, dataClassifier, autoInvoice, smartReminder, prRouter, grnChecker, contractAlert
- [x] Buat `/api/v1/ai/agents/data-agent/route.ts`
- [x] Buat automation trigger endpoint
- [x] Buat `/dashboard/ai/data-agent/page.tsx`

### Phase 3b: DataAgent Chat — NL-to-SQL RAG

**Architectural Decision:** DataAgent chat menggunakan **NL-to-SQL** (bukan document RAG) karena data ERP sudah terstruktur di PostgreSQL/Supabase. NL-to-SQL mencegah hallucination karena LLM hanya memformat hasil, bukan menghasilkan data.

- [x] Buat `src/lib/ai/agents/DataAgent/chat/intentClassifier.ts` — 100+ intent pattern matching
- [x] Buat `src/lib/ai/agents/DataAgent/chat/queryLibrary.ts` — 100 SQL patterns (10 kategori)
- [x] Buat `src/lib/ai/agents/DataAgent/chat/queryBuilder.ts` — Parameterized SQL builder
- [x] Buat `src/lib/ai/agents/DataAgent/chat/responseFormatter.ts` — LLM format output ONLY
- [x] Buat `src/lib/ai/agents/DataAgent/chat/chatRouter.ts` — 3-layer orchestrator + streaming

```
User Query: "Berapa total AR customer ABC yang overdue?"
                ↓
Layer 1: Intent Classifier (keyword/regex pattern matching)
                ↓
Layer 2: Query Builder → Execute SQL ke Supabase PostgreSQL
                ↓
Layer 3: LLM Response Formatter (format ONLY, no data generation)
                ↓
AI Response: "Total AR overdue customer ABC adalah Rp 150.000.000"
```

#### 3-Layer Architecture

| Layer | Komponen | Responsibility |
|-------|----------|----------------|
| Layer 1 | `IntentClassifier` | Detect user intent dari keyword/regex (100+ pattern) |
| Layer 2 | `QueryBuilder` + `QueryLibrary` | Build & execute SQL ke Supabase |
| Layer 3 | `ResponseFormatter` | LLM format jawaban dari data aktual |

#### Intent Pattern Library (100+ Queries)

**Database Tables Referenced:** `invoice`, `invoice_item`, `quotation`, `quotation_item`, `sales_order`, `sales_order_item`, `delivery_order`, `kwitansi`, `customer`, `supplier`, `barang`, `kategori_barang`, `stok`, `stok_mutasi`, `purchase_order`, `purchase_order_item`, `purchase_request`, `grn`, `grn_item`, `rfq`, `kontrak`, `jurnal`, `jurnal_item`, `faktur_pajak`, `faktur_pajak_item`, `retur_penjualan`, `retur_pembelian`, `absensi`, `karyawan`, `gudang`, `ai_nego_history`, `ai_data_history`, `ai_vision_history`, `ai_automation_log`

##### A. INVOICE & AR (Account Receivable) — 15 queries

| ID | Intent | Contoh Query | SQL Pattern |
|----|--------|--------------|-------------|
| INV001 | INVOICE_STATUS | "Status invoice INV/2026/05/0001?" | `SELECT i.*, c.nama FROM invoice i JOIN customer c ON i.customer_id = c.id WHERE i.nomor = $1` |
| INV002 | INVOICE_LIST_PENDING | "List invoice yang belum lunas?" | `SELECT i.nomor, i.tanggal, i.status, c.nama, SUM(ii.harga * ii.jumlah) as total FROM invoice i JOIN customer c ON i.customer_id = c.id JOIN invoice_item ii ON i.id = ii.invoice_id WHERE i.status != 'paid' GROUP BY i.id, c.nama ORDER BY i.tanggal` |
| INV003 | INVOICE_OVERDUE_LIST | "Invoice overdue berapa banyak?" | `SELECT i.nomor, i.tanggal, c.nama, i.top, AGE(NOW(), i.tanggal + (CASE WHEN i.top ~ 'Net ([0-9]+)' THEN (i.top ~ 'Net ([0-9]+)')::int * INTERVAL '1 day' ELSE INTERVAL '30 days' END)) as overdue_days FROM invoice i JOIN customer c ON i.customer_id = c.id WHERE i.status != 'paid' AND i.tanggal + INTERVAL '30 days' < NOW()` |
| INV004 | AR_TOTAL_CUSTOMER | "Total AR customer ABC?" | `SELECT c.nama, SUM(ii.harga * ii.jumlah * (1 + COALESCE(ii.ppn, 0))) as total_ar FROM invoice i JOIN customer c ON i.customer_id = c.id JOIN invoice_item ii ON i.id = ii.invoice_id WHERE c.kode = $1 AND i.status != 'paid' GROUP BY c.nama` |
| INV005 | AR_TOTAL_ALL | "Total AR seluruhnya?" | `SELECT SUM(ii.harga * ii.jumlah * (1 + COALESCE(ii.ppn, 0))) as total_ar FROM invoice i JOIN invoice_item ii ON i.id = ii.invoice_id WHERE i.status != 'paid'` |
| INV006 | INVOICE_BY_DATE_RANGE | "Invoice bulan Mei 2026?" | `SELECT i.nomor, i.tanggal, i.status, c.nama, SUM(ii.harga * ii.jumlah) as total FROM invoice i JOIN customer c ON i.customer_id = c.id JOIN invoice_item ii ON i.id = ii.invoice_id WHERE i.tanggal >= '2026-05-01' AND i.tanggal < '2026-06-01' GROUP BY i.id, c.nama` |
| INV007 | INVOICE_ITEM_DETAIL | "Detail barang di invoice INV/2026/05/0001?" | `SELECT b.nama, ii.jumlah, ii.harga, ii.diskon, ii.ppn, (ii.harga * ii.jumlah * (1 + COALESCE(ii.ppn, 0))) as subtotal FROM invoice_item ii JOIN barang b ON ii.barang_id = b.id WHERE ii.invoice_id = $1` |
| INV008 | INVOICE_COUNT_BY_STATUS | "Berapa invoice per status?" | `SELECT status, COUNT(*) as count FROM invoice WHERE is_active = true GROUP BY status` |
| INV009 | AR_AGING_REPORT | "AR aging report?" | `SELECT c.nama, SUM(CASE WHEN i.tanggal < NOW() - INTERVAL '30 days' THEN ii.harga * ii.jumlah ELSE 0 END) as "30+ days", SUM(CASE WHEN i.tanggal >= NOW() - INTERVAL '30 days' AND i.tanggal < NOW() - INTERVAL '60 days' THEN ii.harga * ii.jumlah ELSE 0 END) as "31-60 days", SUM(CASE WHEN i.tanggal >= NOW() - INTERVAL '60 days' THEN ii.harga * ii.jumlah ELSE 0 END) as "under 30 days" FROM invoice i JOIN customer c ON i.customer_id = c.id JOIN invoice_item ii ON i.id = ii.invoice_id WHERE i.status != 'paid' GROUP BY c.nama` |
| INV010 | KWITANSI_BY_INVOICE | "Kwitansi untuk invoice INV/2026/05/0001?" | `SELECT k.nomor, k.tanggal, k.status FROM kwitansi k WHERE k.invoice_id = $1` |
| INV011 | FAKTUR_PAJAK_BY_INVOICE | "Faktur pajak untuk invoice INV/2026/05/0001?" | `SELECT fp.nomor, fp.tanggal, fp.status FROM faktur_pajak fp WHERE fp.invoice_id = $1` |
| INV012 | INVOICE_PAYMENT_RATE | "Berapa payment rate bulan ini?" | `SELECT COUNT(CASE WHEN i.status = 'paid' THEN 1 END)::float / COUNT(*) * 100 as payment_rate FROM invoice i WHERE i.tanggal >= DATE_TRUNC('month', NOW())` |
| INV013 | INVOICE_AVERAGE_DSO | "Average DSO (Days Sales Outstanding)?" | `SELECT AVG(EXTRACT(EPOCH FROM (kw.tanggal - i.tanggal)) / 86400) as avg_dso FROM invoice i JOIN kwitansi kw ON kw.invoice_id = i.id WHERE i.status = 'paid'` |
| INV014 | CUSTOMER_TOP_AR | "Customer dengan AR terbesar?" | `SELECT c.nama, SUM(ii.harga * ii.jumlah * (1 + COALESCE(ii.ppn, 0))) as total_ar FROM invoice i JOIN customer c ON i.customer_id = c.id JOIN invoice_item ii ON i.id = ii.invoice_id WHERE i.status != 'paid' GROUP BY c.nama ORDER BY total_ar DESC LIMIT 10` |
| INV015 | INVOICE_NEGO_HISTORY | "History negosiasi invoice INV/2026/05/0001?" | `SELECT nh.decision, nh.counter_price, nh.risk_score, nh.created_at FROM ai_nego_history nh WHERE nh.entity_type = 'invoice' AND nh.entity_id = $1` |

##### B. QUOTATION & PRICING — 12 queries

| ID | Intent | Contoh Query | SQL Pattern |
|----|--------|--------------|-------------|
| QUO001 | QUOTATION_STATUS | "Status quotation QTN/2026/05/0001?" | `SELECT q.*, c.nama FROM quotation q JOIN customer c ON q.customer_id = c.id WHERE q.nomor = $1` |
| QUO002 | QUOTATION_PENDING | "Quotation yang masih draft/open?" | `SELECT q.nomor, q.tanggal, q.status, c.nama FROM quotation q JOIN customer c ON q.customer_id = c.id WHERE q.status IN ('draft', 'open') ORDER BY q.tanggal DESC` |
| QUO003 | QUOTATION_EXPIRED | "Quotation yang sudah expired?" | `SELECT q.nomor, q.tanggal, q.status, c.nama FROM quotation q JOIN customer c ON q.customer_id = c.id WHERE q.status = 'draft' AND q.tanggal < NOW() - INTERVAL '30 days'` |
| QUO004 | QUOTATION_ITEM_DETAIL | "Barang di quotation QTN/2026/05/0001?" | `SELECT b.nama, qi.jumlah, qi.harga_satuan, qi.diskon, qi.ppn_per_item, (qi.harga_satuan * qi.jumlah * (1 + COALESCE(qi.ppn_per_item, 0))) as subtotal FROM quotation_item qi JOIN barang b ON qi.barang_id = b.id WHERE qi.quotation_id = $1` |
| QUO005 | QUOTATION_CONVERSION_RATE | "Berapa conversion rate quotation ke sales order?" | `SELECT COUNT(DISTINCT q.id) as total_quot, COUNT(DISTINCT so.id) as converted, (COUNT(DISTINCT so.id)::float / COUNT(DISTINCT q.id) * 100) as conversion_rate FROM quotation q LEFT JOIN sales_order so ON so.customer_po_id IN (SELECT id FROM customer_po WHERE quotation_id = q.id)` |
| QUO006 | QUOTATION_VALUE_PENDING | "Total nilai quotation pending?" | `SELECT SUM(qi.harga_satuan * qi.jumlah * (1 + COALESCE(qi.ppn_per_item, 0))) as total_pending FROM quotation q JOIN quotation_item qi ON q.id = qi.quotation_id WHERE q.status IN ('draft', 'open')` |
| QUO007 | QUOTATION_BY_CUSTOMER | "Quotation untuk customer ABC?" | `SELECT q.nomor, q.tanggal, q.status, SUM(qi.harga_satuan * qi.jumlah) as nilai FROM quotation q JOIN quotation_item qi ON q.id = qi.quotation_id JOIN customer c ON q.customer_id = c.id WHERE c.kode = $1 GROUP BY q.id ORDER BY q.tanggal DESC` |
| QUO008 | QUOTATION_BY_SALES | "Quotation oleh sales X bulan ini?" | (assumes salesperson field exists) `SELECT q.nomor, q.tanggal, q.status FROM quotation q WHERE q.sales_id = $1 AND DATE_TRUNC('month', q.tanggal) = DATE_TRUNC('month', NOW())` |
| QUO009 | QUOTATION_AVERAGE_DISCOUNT | "Average diskon quotation?" | `SELECT AVG(qi.diskon) as avg_diskon FROM quotation_item qi` |
| QUO010 | QUOTATION_WIN_RATE | "Win rate quotation per sales?" | `SELECT q.sales_id, COUNT(*) as total, SUM(CASE WHEN q.status = 'won' THEN 1 ELSE 0 END) as won, (SUM(CASE WHEN q.status = 'won' THEN 1 ELSE 0 END)::float / COUNT(*) * 100) as win_rate FROM quotation q GROUP BY q.sales_id` |
| QUO011 | QUOTATION_PRICE_COMPARISON | "Bandingkan harga quotation vs harga default?" | `SELECT b.nama, qi.harga_satuan, b.harga_jual_default, (qi.harga_satuan - b.harga_jual_default) as diff FROM quotation_item qi JOIN barang b ON qi.barang_id = b.id WHERE qi.quotation_id = $1` |
| QUO012 | QUOTATION_VALIDITY_CHECK | "Quote validity yang hampir expired?" | `SELECT q.nomor, q.tanggal, (NOW() - q.tanggal) as days_old FROM quotation q WHERE q.status = 'draft' AND (NOW() - q.tanggal) > INTERVAL '20 days'` |

##### C. SALES ORDER & DELIVERY — 10 queries

| ID | Intent | Contoh Query | SQL Pattern |
|----|--------|--------------|-------------|
| SO001 | SALES_ORDER_STATUS | "Status sales order SO/2026/05/0001?" | `SELECT so.*, c.nama FROM sales_order so JOIN customer c ON so.customer_id = c.id WHERE so.nomor = $1` |
| SO002 | SALES_ORDER_PENDING_DELIVERY | "SO yang belum delivery?" | `SELECT so.nomor, so.tanggal, so.status, c.nama FROM sales_order so JOIN customer c ON so.customer_id = c.id WHERE so.status NOT IN ('delivered', 'completed', 'cancelled') ORDER BY so.tanggal` |
| SO003 | DELIVERY_ORDER_BY_SO | "Delivery order untuk SO/2026/05/0001?" | `SELECT do.nomor, do.tanggal, do.status FROM delivery_order do WHERE do.sales_order_id = $1` |
| SO004 | DELIVERY_PENDING | "Delivery order yang belum selesai?" | `SELECT do.nomor, do.tanggal, do.status, so.nomor as so_nomor FROM delivery_order do JOIN sales_order so ON do.sales_order_id = so.id WHERE do.status NOT IN ('completed', 'cancelled')` |
| SO005 | SALES_ORDER_ITEM_DETAIL | "Barang di SO/2026/05/0001?" | `SELECT b.nama, soi.jumlah, soi.harga_satuan, (soi.jumlah * soi.harga_satuan) as subtotal FROM sales_order_item soi JOIN barang b ON soi.barang_id = b.id WHERE soi.sales_order_id = $1` |
| SO006 | SALES_ORDER_BY_CUSTOMER | "SO customer ABC bulan ini?" | `SELECT so.nomor, so.tanggal, so.status, SUM(soi.jumlah * soi.harga_satuan) as nilai FROM sales_order so JOIN customer c ON so.customer_id = c.id JOIN sales_order_item soi ON so.id = soi.sales_order_id WHERE c.kode = $1 AND DATE_TRUNC('month', so.tanggal) = DATE_TRUNC('month', NOW()) GROUP BY so.id` |
| SO007 | SALES_BACKLOG | "Total backlog penjualan?" | `SELECT COUNT(*) as backlog_count FROM sales_order so WHERE so.status = 'confirmed' AND so.tanggal < NOW()` |
| SO008 | DELIVERY_ON_TIME_RATE | "Delivery on time rate?" | `SELECT COUNT(CASE WHEN do.tanggal <= so.tanggal + INTERVAL '7 days' THEN 1 END)::float / COUNT(*) * 100 as on_time_rate FROM delivery_order do JOIN sales_order so ON do.sales_order_id = so.id WHERE do.status = 'completed'` |
| SO009 | DO_ITEM_TRACE | "Barang apa saja di DO/2026/05/0001?" | `SELECT b.nama, doi.jumlah, doi.keterangan FROM delivery_order_item doi JOIN barang b ON doi.barang_id = b.id WHERE doi.delivery_order_id = $1` |
| SO010 | SALES_ORDER_CANCELLED | "SO yang di-cancel?" | `SELECT so.nomor, so.tanggal, so.status, c.nama, COUNT(doi.id) as do_count FROM sales_order so JOIN customer c ON so.customer_id = c.id LEFT JOIN delivery_order do ON do.sales_order_id = so.id LEFT JOIN delivery_order_item doi ON doi.delivery_order_id = do.id WHERE so.status = 'cancelled' GROUP BY so.id, c.nama ORDER BY so.tanggal DESC` |

##### D. PURCHASE & SUPPLIER — 12 queries

| ID | Intent | Contoh Query | SQL Pattern |
|----|--------|--------------|-------------|
| PO001 | PO_STATUS | "Status PO PO/2026/05/0001?" | `SELECT po.*, s.nama as supplier FROM purchase_order po JOIN supplier s ON po.supplier_id = s.id WHERE po.nomor = $1` |
| PO002 | PO_PENDING_RECEIVE | "PO yang belum diterima?" | `SELECT po.nomor, po.tanggal, po.status, s.nama as supplier FROM purchase_order po JOIN supplier s ON po.supplier_id = s.id WHERE po.status NOT IN ('received', 'completed', 'cancelled')` |
| PO003 | PO_ITEM_DETAIL | "Barang di PO PO/2026/05/0001?" | `SELECT b.nama, poi.jumlah, poi.harga_satuan, poi.link_produk, poi.marketplace, poi.no_resi FROM purchase_order_item poi JOIN barang b ON poi.barang_id = b.id WHERE poi.purchase_order_id = $1` |
| PO004 | SUPPLIER_PERFORMANCE | "Performance supplier ABC?" | `SELECT s.nama, COUNT(po.id) as total_po, SUM(poi.jumlah * poi.harga_satuan) as total_nilai, COUNT(CASE WHEN gr.id IS NOT NULL THEN 1 END) as on_time_delivery, AVG(EXTRACT(EPOCH FROM (gr.tanggal - po.tanggal)) / 86400) as avg_lead_time_days FROM supplier s LEFT JOIN purchase_order po ON po.supplier_id = s.id LEFT JOIN purchase_order_item poi ON po.id = poi.purchase_order_id LEFT JOIN grn gr ON gr.purchase_receiving_id IN (SELECT id FROM purchase_receiving WHERE purchase_order_id = po.id) WHERE s.kode = $1 GROUP BY s.nama` |
| PO005 | SUPPLIER_LIST | "List semua supplier aktif?" | `SELECT s.kode, s.nama, s.kontak, s.terms_of_payment FROM supplier s WHERE s.is_active = true ORDER BY s.nama` |
| PO006 | SUPPLIER_AR_CHALLENGE | "Supplier dengan PO terbesar?" | `SELECT s.nama, SUM(poi.jumlah * poi.harga_satuan) as total_po FROM supplier s JOIN purchase_order po ON po.supplier_id = s.id JOIN purchase_order_item poi ON po.id = poi.purchase_order_id GROUP BY s.nama ORDER BY total_po DESC LIMIT 10` |
| PO007 | PO_BY_TERMS_OF_PAYMENT | "PO dengan TOP Net 30?" | `SELECT po.nomor, po.tanggal, po.status, s.nama, po.terms_of_payment FROM purchase_order po JOIN supplier s ON po.supplier_id = s.id WHERE po.terms_of_payment LIKE '%Net 30%'` |
| PO008 | GRN_BY_PO | "GRN untuk PO PO/2026/05/0001?" | `SELECT g.nomor, g.tanggal, g.status, g.keterangan FROM grn g WHERE g.purchase_receiving_id IN (SELECT pr.id FROM purchase_receiving pr WHERE pr.purchase_order_id = $1)` |
| PO009 | GRN_ITEM_DETAIL | "Barang yang diterima di GRN GRN/2026/05/0001?" | `SELECT b.nama, gi.jumlah, gi.harga_satuan, gi.keterangan FROM grn_item gi JOIN barang b ON gi.barang_id = b.id WHERE gi.grn_id = $1` |
| PO010 | GRN_QUALITY_CHECK | "GRN dengan quality issue?" | `SELECT g.nomor, g.tanggal, g.status, gi.keterangan FROM grn g JOIN grn_item gi ON g.id = gi.grn_id WHERE gi.keterangan LIKE '%reject%' OR gi.keterangan LIKE '%quality%'` |
| PO011 | PO_EXPENSE_BY_MONTH | "Total expense pembelian bulan ini?" | `SELECT SUM(poi.jumlah * poi.harga_satuan) as total_expense FROM purchase_order po JOIN purchase_order_item poi ON po.id = poi.purchase_order_id WHERE DATE_TRUNC('month', po.tanggal) = DATE_TRUNC('month', NOW())` |
| PO012 | MARKETPLACE_PURCHASE | "Pembelian dari marketplace?" | `SELECT poi.marketplace, COUNT(*) as count, SUM(poi.jumlah * poi.harga_satuan) as total FROM purchase_order_item poi WHERE poi.marketplace IS NOT NULL GROUP BY poi.marketplace` |

##### E. INVENTORY & STOCK — 10 queries

| ID | Intent | Contoh Query | SQL Pattern |
|----|--------|--------------|-------------|
| STK001 | STOK_RENDAH | "Barang dengan stok rendah?" | `SELECT b.kode, b.nama, s.jumlah as stok_terkini, b.stok_minimum, g.nama as gudang FROM stok s JOIN barang b ON s.barang_id = b.id LEFT JOIN gudang g ON s.gudang_id = g.id WHERE s.jumlah < b.stok_minimum` |
| STK002 | STOK_TOTAL_ALL | "Total nilai stok?" | `SELECT SUM(s.jumlah * COALESCE(b.harga_beli_default, 0)) as total_nilai_stok FROM stok s JOIN barang b ON s.barang_id = b.id WHERE s.jumlah > 0` |
| STK003 | STOK_BY_GUDANG | "Stok di gudang utama?" | `SELECT b.kode, b.nama, s.jumlah, g.nama as gudang FROM stok s JOIN barang b ON s.barang_id = b.id JOIN gudang g ON s.gudang_id = g.id WHERE g.nama = $1` |
| STK004 | STOK_BARANG_DETAIL | "Stok barang BRG/001?" | `SELECT b.kode, b.nama, s.jumlah, b.stok_minimum, b.satuan, g.nama as gudang FROM stok s JOIN barang b ON s.barang_id = b.id LEFT JOIN gudang g ON s.gudang_id = g.id WHERE b.kode = $1` |
| STK005 | STOK_MUTASI_HISTORY | "Mutasi stok barang BRG/001?" | `SELECT sm.tanggal, sm.tipe, sm.jumlah, sm.keterangan FROM stok_mutasi sm JOIN barang b ON sm.barang_id = b.id WHERE b.kode = $1 ORDER BY sm.tanggal DESC LIMIT 50` |
| STK006 | STOK_DEAD_INVENTORY | "Dead stock (tidak bergerak > 90 hari)?" | `SELECT b.kode, b.nama, s.jumlah, sm.tanggal as last_mutasi FROM stok s JOIN barang b ON s.barang_id = b.id LEFT JOIN (SELECT barang_id, MAX(tanggal) as tanggal FROM stok_mutasi GROUP BY barang_id) sm ON b.id = sm.barang_id WHERE s.jumlah > 0 AND (sm.tanggal IS NULL OR sm.tanggal < NOW() - INTERVAL '90 days')` |
| STK007 | STOK_REORDER_POINT | "Barang yang perlu reorder?" | `SELECT b.kode, b.nama, s.jumlah, b.stok_minimum, (b.stok_minimum - s.jumlah) as qty_to_order FROM stok s JOIN barang b ON s.barang_id = b.id WHERE s.jumlah <= b.stok_minimum` |
| STK008 | KATEGORI_STOK_SUMMARY | "Stok per kategori?" | `SELECT kb.nama as kategori, SUM(s.jumlah) as total_stok, SUM(s.jumlah * COALESCE(b.harga_beli_default, 0)) as nilai_stok FROM stok s JOIN barang b ON s.barang_id = b.id JOIN kategori_barang kb ON b.kategori_id = kb.id GROUP BY kb.nama` |
| STK009 | STOK_OPNAME_NEEDED | "Barang yang perlu stock opname?" | `SELECT b.kode, b.nama, s.jumlah, s.last_mutasi FROM stok s JOIN barang b ON s.barang_id = b.id WHERE s.last_mutasi < NOW() - INTERVAL '30 days'` |
| STK010 | STOK_OVERSTOCK | "Overstock (stok > 2x minimum)?" | `SELECT b.kode, b.nama, s.jumlah, b.stok_minimum FROM stok s JOIN barang b ON s.barang_id = b.id WHERE s.jumlah > (b.stok_minimum * 2)` |

##### F. CONTRACT & RFQ — 8 queries

| ID | Intent | Contoh Query | SQL Pattern |
|----|--------|--------------|-------------|
| KTR001 | KONTRAK_EXPIRY_30_DAYS | "Kontrak yang expired dalam 30 hari?" | `SELECT k.nama, c.nama as customer, k.tanggal_mulai, k.tanggal_selesai, (k.tanggal_selesai - NOW()) as days_remaining FROM kontrak k JOIN customer c ON k.customer_id = c.id WHERE k.tanggal_selesai BETWEEN NOW() AND NOW() + INTERVAL '30 days' AND k.is_active = true` |
| KTR002 | KONTRAK_STATUS | "Status kontrak 'Kontrak ABC'?" | `SELECT k.*, c.nama as customer FROM kontrak k JOIN customer c ON k.customer_id = c.id WHERE k.nama ILIKE '%' || $1 || '%'` |
| KTR003 | KONTRAK_NILAI | "Nilai kontrak yang aktif?" | `SELECT k.nama, c.nama as customer, SUM(ki.jumlah * ki.harga) as nilai_kontrak FROM kontrak k JOIN customer c ON k.customer_id = c.id JOIN kontrak_item ki ON k.id = ki.kontrak_id WHERE k.is_active = true GROUP BY k.id, c.nama` |
| KTR004 | RFQ_PENDING | "RFQ yang belum diproses?" | `SELECT r.nomor, r.tanggal, r.status, s.nama as supplier FROM rfq r JOIN supplier s ON r.supplier_id = s.id WHERE r.status = 'pending'` |
| KTR005 | CONTRACT_RENEWAL_CANDIDATE | "Kontrak yang perlu di-renew?" | `SELECT k.id, k.nama, c.nama, k.tanggal_selesai FROM kontrak k JOIN customer c ON k.customer_id = c.id WHERE k.tanggal_selesai < NOW() + INTERVAL '45 days' AND k.is_active = true` |
| RFQ001 | RFQ_BY_SUPPLIER | "RFQ untuk supplier ABC?" | `SELECT r.nomor, r.tanggal, r.status FROM rfq r JOIN supplier s ON r.supplier_id = s.id WHERE s.kode = $1 ORDER BY r.tanggal DESC` |
| RFQ002 | RFQ_COMPARISON | "Bandingkan RFQ dari beberapa supplier?" | `SELECT r.nomor, s.nama as supplier, ri.barang_id, ri.harga_quoted FROM rfq r JOIN rfq_item ri ON r.id = ri.rfq_id JOIN supplier s ON r.supplier_id = s.id WHERE r.status = 'quoted'` |
| RFQ003 | RFQ_ITEM_DETAIL | "Item di RFQ RFQ/2026/05/0001?" | `SELECT b.nama, ri.jumlah, ri.harga_quoted, ri.keterangan FROM rfq_item ri JOIN barang b ON ri.barang_id = b.id WHERE ri.rfq_id = $1` |

##### G. FINANCE & ACCOUNTING — 10 queries

| ID | Intent | Contoh Query | SQL Pattern |
|----|--------|--------------|-------------|
| JUR001 | JURNAL_BY_DATE | "Jurnal tanggal 23 Mei 2026?" | `SELECT j.nomor, j.tanggal, j.keterangan, ji.akun_id, a.nama as akun, ji.debit, ji.kredit FROM jurnal j JOIN jurnal_item ji ON j.id = ji.jurnal_id JOIN coa a ON ji.akun_id = a.id WHERE j.tanggal = '2026-05-23' ORDER BY j.nomor, ji.debit DESC` |
| JUR002 | JURNAL_BALANCE | "Balance umum hari ini?" | `SELECT a.nama, SUM(ji.debit) as total_debit, SUM(ji.kredit) as total_kredit, (SUM(ji.debit) - SUM(ji.kredit)) as balance FROM jurnal_item ji JOIN coa a ON ji.akun_id = a.id JOIN jurnal j ON ji.jurnal_id = j.id WHERE j.tanggal <= NOW() GROUP BY a.nama ORDER BY a.nama` |
| JUR003 | COA_LIST | "Chart of accounts?" | `SELECT a.kode, a.nama, a.tipe FROM coa a WHERE a.is_active = true ORDER BY a.kode` |
| JUR004 | BUKU_BESAR | "Buku besar akun 1-1100?" | `SELECT j.tanggal, j.nomor, ji.keterangan, ji.debit, ji.kredit, (SELECT SUM(ji2.debit) - SUM(ji2.kredit) FROM jurnal_item ji2 JOIN jurnal j2 ON ji2.jurnal_id = j2.id WHERE ji2.akun_id = $1 AND j2.tanggal <= j.tanggal) as saldo FROM jurnal_item ji JOIN jurnal j ON ji.jurnal_id = j.id WHERE ji.akun_id = $1 ORDER BY j.tanggal` |
| JUR005 | LABA_RUGI_PERIOD | "Laba rugi bulan ini?" | `SELECT a.nama, SUM(CASE WHEN a.tipe = 'revenue' THEN ji.kredit - ji.debit ELSE ji.debit - ji.kredit END) as nilai FROM jurnal_item ji JOIN coa a ON ji.akun_id = a.id JOIN jurnal j ON ji.jurnal_id = j.id WHERE j.tanggal >= DATE_TRUNC('month', NOW()) AND j.tanggal < DATE_TRUNC('month', NOW()) + INTERVAL '1 month' AND a.tipe IN ('revenue', 'expense') GROUP BY a.nama` |
| JUR006 | NERACA | "Neraca tanggal hari ini?" | `SELECT a.nama, SUM(ji.debit) - SUM(ji.kredit) as saldo FROM jurnal_item ji JOIN coa a ON ji.akun_id = a.id JOIN jurnal j ON ji.jurnal_id = j.id WHERE j.tanggal <= NOW() AND a.tipe IN ('asset', 'liability', 'equity') GROUP BY a.nama` |
| JUR007 | FAKTUR_PAJAK_PEKAN_INI | "Faktur pajak minggu ini?" | `SELECT fp.nomor, fp.tanggal, i.nomor as invoice_nomor, fpi DPP, fpi.ppn FROM faktur_pajak fp JOIN faktur_pajak_item fpi ON fp.id = fpi.faktur_pajak_id JOIN invoice i ON fpi.invoice_id = i.id WHERE fp.tanggal >= DATE_TRUNC('week', NOW())` |
| JUR008 | TOTAL_HUTANG_SUPPLIER | "Total hutang supplier?" | `SELECT s.nama, SUM(poi.jumlah * poi.harga_satuan) as total_hutang FROM supplier s JOIN purchase_order po ON po.supplier_id = s.id JOIN purchase_order_item poi ON po.id = poi.purchase_order_id WHERE po.status NOT IN ('paid', 'cancelled') GROUP BY s.nama` |
| JUR009 | RETUR_PENJUALAN_RECENT | "Retur penjualan minggu ini?" | `SELECT rp.nomor, rp.tanggal, c.nama as customer, SUM(rpi.jumlah * rpi.harga) as nilai FROM retur_penjualan rp JOIN customer c ON rp.customer_id = c.id JOIN retur_penjualan_item rpi ON rp.id = rpi.retur_penjualan_id WHERE rp.tanggal >= DATE_TRUNC('week', NOW()) GROUP BY rp.id, c.nama` |
| JUR010 | RETUR_PEMBELIAN_RECENT | "Retur pembelian minggu ini?" | `SELECT rpb.nomor, rpb.tanggal, s.nama as supplier, SUM(rpbi.jumlah * rpbi.harga) as nilai FROM retur_pembelian rpb JOIN supplier s ON rpb.supplier_id = s.id JOIN retur_pembelian_item rpbi ON rpb.id = rpbi.retur_pembelian_id WHERE rpb.tanggal >= DATE_TRUNC('week', NOW()) GROUP BY rpb.id, s.nama` |

##### H. HR & PAYROLL — 6 queries

| ID | Intent | Contoh Query | SQL Pattern |
|----|--------|--------------|-------------|
| HR001 | ABSENSI_TODAY | "Absensi hari ini?" | `SELECT kr.nama, a.status, a.tanggal FROM absensi a JOIN karyawan kr ON a.karyawan_id = kr.id WHERE a.tanggal = CURRENT_DATE` |
| HR002 | ABSENSI_MONTHLY | "Absensi karyawan ABC bulan ini?" | `SELECT a.tanggal, a.status FROM absensi a JOIN karyawan kr ON a.karyawan_id = kr.id WHERE kr.kode = $1 AND DATE_TRUNC('month', a.tanggal) = DATE_TRUNC('month', NOW()) ORDER BY a.tanggal` |
| HR003 | PAYROLL_TAHUNAN | "Total payroll tahun 2026?" | `SELECT SUM(pg.gaji_pokok + pg.tunjangan - pg.potongan) as total_gaji FROM penggajian pg WHERE EXTRACT(YEAR FROM pg.tanggal) = 2026` |
| HR004 | KARYAWAN_AKTIF_COUNT | "Berapa karyawan aktif?" | `SELECT COUNT(*) as total_karyawan FROM karyawan WHERE is_active = true` |
| HR005 | ABSENSI_RATE | "Attendance rate bulan ini?" | `SELECT COUNT(CASE WHEN a.status = 'hadir' THEN 1 END)::float / COUNT(*) * 100 as attendance_rate FROM absensi a WHERE DATE_TRUNC('month', a.tanggal) = DATE_TRUNC('month', NOW())` |
| HR006 | OVERTIME_TOTAL | "Total overtime bulan ini?" | `SELECT SUM(EXTRACT(EPOCH FROM (a.keluar - a.masuk)) / 3600 - 8) as total_overtime_hours FROM absensi a WHERE DATE_TRUNC('month', a.tanggal) = DATE_TRUNC('month', NOW()) AND a.status = 'hadir'` |

##### I. AI AGENT HISTORY & AUDIT — 6 queries

| ID | Intent | Contoh Query | SQL Pattern |
|----|--------|--------------|-------------|
| AI001 | AI_NEGO_HISTORY | "History negosiasi terbaru?" | `SELECT nh.entity_type, nh.entity_id, nh.decision, nh.counter_price, nh.risk_score, nh.created_at FROM ai_nego_history nh ORDER BY nh.created_at DESC LIMIT 20` |
| AI002 | AI_AUTOMATION_LOG | "Automation trigger yang run hari ini?" | `SELECT al.trigger_type, al.entity_type, al.status, al.created_at FROM ai_automation_log al WHERE DATE_TRUNC('day', al.created_at) = CURRENT_DATE` |
| AI003 | AI_USAGE_STATS | "Usage AI agent bulan ini?" | `SELECT nh.agent_type, COUNT(*) as total_calls FROM ai_nego_history nh WHERE DATE_TRUNC('month', nh.created_at) = DATE_TRUNC('month', NOW()) GROUP BY nh.agent_type` |
| AI004 | AI_NEGO_DECISION_REJECTED | "Nego yang rejected?" | `SELECT nh.entity_type, nh.entity_id, nh.risk_score, nh.created_at FROM ai_nego_history nh WHERE nh.decision = 'rejected' AND DATE_TRUNC('month', nh.created_at) = DATE_TRUNC('month', NOW())` |
| AI005 | AUDIT_LOG_RECENT | "Audit log terbaru?" | `SELECT al.entity_type, al.entity_id, al.action, al.user_id, al.created_at FROM audit_log al ORDER BY al.created_at DESC LIMIT 50` |
| AI006 | AI_VISION_RECENT | "OCR hasil terbaru?" | `SELECT vh.document_type, vh.status, vh.created_at FROM ai_vision_history vh ORDER BY vh.created_at DESC LIMIT 20` |

##### J. CUSTOMER & SALES ANALYTICS — 11 queries

| ID | Intent | Contoh Query | SQL Pattern |
|----|--------|--------------|-------------|
| CUST001 | CUSTOMER_LIST | "List semua customer aktif?" | `SELECT kode, nama, alamat, kontak, terms_of_payment FROM customer WHERE is_active = true ORDER BY nama` |
| CUST002 | CUSTOMER_TOP | "TOP customer ABC?" | `SELECT c.nama, ct.top FROM customer c JOIN customer_top ct ON c.id = ct.customer_id WHERE c.kode = $1` |
| CUST003 | CUSTOMER_REVENUE_YTD | "Revenue customer ABC year to date?" | `SELECT c.nama, SUM(ii.harga * ii.jumlah) as revenue FROM customer c JOIN invoice i ON c.id = i.customer_id JOIN invoice_item ii ON i.id = ii.invoice_id WHERE c.kode = $1 AND EXTRACT(YEAR FROM i.tanggal) = EXTRACT(YEAR FROM NOW()) GROUP BY c.nama` |
| CUST004 | CUSTOMER_INVOICE_COUNT | "Customer ABC punya berapa invoice?" | `SELECT c.nama, COUNT(i.id) as total_invoice, SUM(ii.harga * ii.jumlah) as total_nilai FROM customer c JOIN invoice i ON c.id = i.customer_id JOIN invoice_item ii ON i.id = ii.invoice_id WHERE c.kode = $1 GROUP BY c.nama` |
| CUST005 | TOP_10_CUSTOMER_REVENUE | "Top 10 customer berdasarkan revenue?" | `SELECT c.nama, SUM(ii.harga * ii.jumlah) as revenue FROM customer c JOIN invoice i ON c.id = i.customer_id JOIN invoice_item ii ON i.id = ii.invoice_id WHERE EXTRACT(YEAR FROM i.tanggal) = EXTRACT(YEAR FROM NOW()) GROUP BY c.nama ORDER BY revenue DESC LIMIT 10` |
| CUST006 | CUSTOMER_NO_ORDER | "Customer yang belum order > 90 hari?" | `SELECT c.nama, c.kontak, MAX(i.tanggal) as last_order FROM customer c LEFT JOIN invoice i ON c.id = i.customer_id GROUP BY c.nama, c.kontak HAVING MAX(i.tanggal) < NOW() - INTERVAL '90 days' OR MAX(i.tanggal) IS NULL` |
| CUST007 | CUSTOMER_NEW_THIS_MONTH | "Customer baru bulan ini?" | `SELECT c.kode, c.nama, c.tanggal_bergabung FROM customer c WHERE DATE_TRUNC('month', c.created_at) = DATE_TRUNC('month', NOW())` |
| CUST008 | SALES_BY_MONTH | "Sales per bulan tahun ini?" | `SELECT DATE_TRUNC('month', i.tanggal) as bulan, SUM(ii.harga * ii.jumlah) as revenue FROM invoice i JOIN invoice_item ii ON i.id = ii.invoice_id WHERE EXTRACT(YEAR FROM i.tanggal) = EXTRACT(YEAR FROM NOW()) GROUP BY DATE_TRUNC('month', i.tanggal) ORDER BY bulan` |
| CUST009 | SALES_BY_DAY_OF_WEEK | "Sales per hari dalam seminggu?" | `SELECT TO_CHAR(i.tanggal, 'Day') as hari, SUM(ii.harga * ii.jumlah) as revenue FROM invoice i JOIN invoice_item ii ON i.id = ii.invoice_id WHERE DATE_TRUNC('month', i.tanggal) = DATE_TRUNC('month', NOW()) GROUP BY TO_CHAR(i.tanggal, 'Day')` |
| CUST010 | PRODUCT_BEST_SELLER | "Produk terlaris bulan ini?" | `SELECT b.nama, SUM(ii.jumlah) as total_terjual, SUM(ii.jumlah * ii.harga) as revenue FROM invoice_item ii JOIN barang b ON ii.barang_id = b.id JOIN invoice i ON ii.invoice_id = i.id WHERE DATE_TRUNC('month', i.tanggal) = DATE_TRUNC('month', NOW()) GROUP BY b.nama ORDER BY total_terjual DESC LIMIT 10` |
| CUST011 | CUSTOMER_ORDER_FREQUENCY | "Order frequency per customer?" | `SELECT c.nama, COUNT(i.id) as order_count, AVG(EXTRACT(EPOCH FROM (i.tanggal - LAG(i.tanggal) OVER (PARTITION BY c.id ORDER BY i.tanggal))) / 86400) as avg_days_between FROM customer c JOIN invoice i ON c.id = i.customer_id GROUP BY c.nama HAVING COUNT(i.id) > 1` |

---

**Total: 100 queries** covering all major ERP modules. Intent classifier akan map user query → intent ID → execute SQL → return result.

#### Query Library Implementation Notes

- **Parameterized queries** untuk security (prevent SQL injection)
- **DATE_TRUNC** untuk grouping bulanan/mingguan
- **INTERVAL** untuk date arithmetic (overdue, expiry, dll)
- **JOIN** ke tabel master (customer, supplier, barang) untuk display name
- **Aggregation** (SUM, COUNT, AVG) untuk analytics
- **NULL handling** dengan COALESCE
- **LIMIT** untuk prevent excessive results
- **ORDER BY** untuk sorting yang relevan

#### Query Library Structure

```
src/lib/ai/agents/DataAgent/chat/
├── intentClassifier.ts    # Regex/keyword matching → intent type (100+ patterns) ✅
├── queryLibrary.ts        # 100 predefined SQL patterns (10 categories) ✅
├── queryBuilder.ts        # Build parameterized SQL dari intent ✅
├── responseFormatter.ts   # LLM format only (NO data gen) ✅
└── chatRouter.ts          # Orchestrate 3-layer flow ✅
```

All 5 chat components built. (Marked ✅)

#### Hallucination Prevention Guarantee

```
1. User query masuk
2. IntentClassifier → tentukan intent type
3. QueryBuilder → build SQL dari QueryLibrary (parameterized)
4. Execute ke Supabase PostgreSQL → dapat RESULT SET (data aktual)
5. LLM prompt berisi: system prompt + "ANSWER ONLY USING THIS DATA" + RESULT SET
6. LLM hanya format output — TIDAK generate angka sendiri
```

#### Fallback Mechanism

Jika SQL execution gagal → return error message ke user (bukan generate fake data).

### Phase 4: VisionAgent
- [x] Buat `src/lib/ai/agents/VisionAgent/index.ts`
- [x] Buat `src/lib/ai/agents/VisionAgent/prompts.ts`
- [x] Buat `/api/v1/ai/agents/vision-agent/route.ts`
- [x] Buat document upload UI
- [x] Integration dengan existing OCR page

### Phase 5: Integration
- [x] Wire automation triggers ke database events (webhook + CRON)
- [x] Add rate limiting middleware
- [x] Add usage dashboard (per user, per agent) + date range + user search
- [x] Fallback to rule-based jika AI timeout
- [x] Documentation: API reference (OpenAPI spec via next-openapi-gen)

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
| `src/lib/ai/agents/DataAgent/chat/*` | ✅ | Done (5 files) |
| `src/lib/ai/agents/VisionAgent/*` | ✅ | Done |
| `drizzle/0004_ai_agents_history.sql` | ✅ | Done |
| `/api/v1/ai/agents/*` | ✅ | Done (3 endpoints) |
| `/dashboard/ai/*` pages | ✅ | Usage dashboard ✅ |
| Trigger integration | ✅ | CRON + Webhook built |
| Rate limiting middleware | ✅ | IP-based, per-agent |
| Automation Dashboard | ✅ | Usage stats + daily chart |
| Rule-based fallback | ✅ | Table formatter on LLM timeout |
| PostgreSQL functions | ✅ | exec_sql + get_top_ai_users |

---

## Next Steps (Future)

1. ~~**Add more query patterns** untuk DataAgent (target: 200+)~~ ✅ 196 patterns
2. **Redis-based rate limiting** (in-memory saat ini)
3. ~~**Usage dashboard filtering** — date range, user search~~ ✅
4. ~~**Documentation** — API reference untuk semua agent endpoints (OpenAPI spec)~~ ✅
5. **Skeleton loading states** — data-agent, nego-agent, vision-agent, usage ✅
6. **More intent param extractors** — sales_id, kode_karyawan, entity_type ✅

---

## References

- NVIDIA AI Gateway: `https://integrate.api.nvidia.com/v1`
- NVIDIA NIM Catalog: `https://build.nvidia.com/explore/discover`
- stepfun-ai/step-3.5-flash — reasoning with chain-of-thought
- minimaxai/minimax-m2.7 — general purpose
- microsoft/phi-4-multimodal-instruct — multimodal vision