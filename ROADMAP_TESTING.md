# Roadmap Testing — ERP RRI

**Framework:** Vitest v4 + Testing Library v16 + jsdom
**Setup:** `vitest.config.ts` — jsdom env, path alias `@/`, globals enabled
**Config file:** `vitest.config.ts`
**Setup file:** `src/test/setup.ts`
**Commands:** `npm test` (run once), `npm run test:watch` (watch mode)

---

## Level 1: Unit Test — Zod Schemas

> **Prioritas P1** — Mencegah data invalid masuk database

Semua Zod schema didefinisikan inline di `src/app/api/v1/*/route.ts`. Target: extract ke `src/lib/validations/*.ts` + tulis unit test.

### ✅ Sudah Di-test

| Schema | File Test | Status |
|---|---|---|
| **Absensi** — `karyawan_id`, `tanggal`, `status` (enum: hadir/sakit/izin/alpha/cuti), `keterangan` opsional | `src/test/validations/absensi.test.ts` | ✅ 7 tests |
| **Penggajian** — `karyawan_id`, `bulan` (1-12), `tahun` (2020-2100), `gaji_pokok` (>0), `tunjangan`/`potongan` default 0 | `src/test/validations/penggajian.test.ts` | ✅ 7 tests |

### ⏳ Belum Di-test

| Schema | Lokasi | Test Priority |
|---|---|---|
| **Barang (master)** | `src/app/api/v1/master/barang/route.ts` | P1 |
| **Supplier (master)** | `src/app/api/v1/master/supplier/route.ts` | P1 |
| **Customer (master)** | `src/app/api/v1/master/customer/route.ts` | P1 |
| **Karyawan (master)** | `src/app/api/v1/master/karyawan/route.ts` | P1 |
| **COA** | `src/app/api/v1/master/coa/route.ts` | P1 |
| **Kontrak** | `src/app/api/v1/master/kontrak/route.ts` | P1 |
| **Kategori Barang** | `src/app/api/v1/master/kategori-barang/route.ts` | P2 |
| **Jabatan** | `src/app/api/v1/master/jabatan/route.ts` | P2 |
| **PIC Customer** | `src/app/api/v1/master/pic-customer/route.ts` | P2 |
| **Quotation** (nested: itemSchema) | `src/app/api/v1/quotation/route.ts` | P1 |
| **Sales Order** (nested: itemSchema) | `src/app/api/v1/sales-order/route.ts` | P1 |
| **Invoice** (nested: itemSchema, ppn_rate default 0.11) | `src/app/api/v1/invoice/route.ts` | P1 |
| **Purchase Order** (nested: itemSchema) | `src/app/api/v1/purchase-order/route.ts` | P1 |
| **Purchase Request** (nested: itemSchema) | `src/app/api/v1/purchase-request/route.ts` | P1 |
| **Purchase Receiving** (nested: itemSchema) | `src/app/api/v1/purchase-receiving/route.ts` | P1 |
| **Delivery Order** (nested: itemSchema) | `src/app/api/v1/delivery-order/route.ts` | P2 |
| **Customer PO** (nested: itemSchema) | `src/app/api/v1/customer-po/route.ts` | P2 |
| **DI** (nested: itemSchema) | `src/app/api/v1/di/route.ts` | P2 |
| **RFQ** (nested: rfqItemSchema) | `src/app/api/v1/rfq/route.ts` | P2 |
| **Faktur Pajak** (nested: itemSchema) | `src/app/api/v1/faktur-pajak/route.ts` | P3 |
| **Kwitansi** (nested: itemSchema) | `src/app/api/v1/kwitansi/route.ts` | P3 |
| **Retur Pembelian** (nested: itemSchema) | `src/app/api/v1/retur-pembelian/route.ts` | P3 |
| **Retur Penjualan** (nested: itemSchema) | `src/app/api/v1/retur-penjualan/route.ts` | P3 |
| **Jurnal** (nested: itemSchema, min 2 items) | `src/app/api/v1/jurnal/route.ts` | P2 |
| **GRN** (nested: itemSchema) | `src/app/api/v1/grn/route.ts` | P3 |
| **Data Agent Task** (complex nested, enums, z.record) | `src/app/api/v1/ai/agents/data-agent/route.ts` | P3 |
| **Nego Agent** (analyze + history schemas) | `src/app/api/v1/ai/agents/nego-agent/route.ts` | P3 |
| **Vision Agent** (base64 + url + history) | `src/app/api/v1/ai/agents/vision-agent/route.ts` | P3 |
| **Automation Webhook** | `src/app/api/v1/ai/agents/automation/webhook/route.ts` | P3 |

---

## Level 1: Unit Test — Utility Functions

> **Prioritas P1** — Document numbering kritis untuk akurasi nomor dokumen

### ✅ Sudah Di-test

| Utility | File Test | Status |
|---|---|---|
| **generateDocumentNumber** — format `KODE/RRI/YY/MM/0000`, counter padding, year/month handling | `src/test/utils/document-number.test.ts` | ✅ 6 tests (with mocked Supabase RPC) |

### ⏳ Belum Di-test

| Utility | Lokasi | Test Priority |
|---|---|---|
| **sendWhatsapp** — format pesan, error handling | `src/lib/utils/whatsapp.ts` | P2 |
| **PPN calculation** — 11% rate, PPh, rounding | inline di route handlers | P2 |
| **formatCurrency** / number formatting | `src/lib/utils.ts` (cn utility) | P3 |

---

## Level 2: Component Test — UI Components

> Target: komponen shadcn/ui dan shared components

### ✅ Sudah Di-test

| Component | File Test | Status |
|---|---|---|
| **Badge** — render text, variant classes (default/destructive/success), custom className | `src/test/components/badge.test.tsx` | ✅ 5 tests |

### ⏳ Belum Di-test

| Component | Lokasi | Test Priority |
|---|---|---|
| **Button** — variants, disabled state, asChild | `src/components/ui/button.tsx` | P2 |
| **PageHeader** — title, description, actions slot | `src/components/page-header.tsx` | P2 |
| **EmptyState** — icon, title, description, action button | `src/components/empty-state.tsx` | P2 |
| **StatusBadge** — status mapping, color variants | `src/components/status-badge.tsx` | P2 |
| **BreadcrumbNav** — items rendering, active state | `src/components/breadcrumb-nav.tsx` | P2 |
| **CopyButton** — copy to clipboard | `src/components/copy-button.tsx` | P3 |
| **DeleteConfirmationDialog** — dialog open/close, confirm callback | `src/components/delete-confirmation-dialog.tsx` | P3 |
| **StatusWorkflow** — steps rendering, active step highlight | `src/components/status-workflow.tsx` | P3 |
| **PeriodFilter** — month/year select, onChange | `src/components/period-filter.tsx` | P3 |
| **GlobalSearch** — command dialog, search results rendering | `src/components/global-search.tsx` | P3 |

---

## Level 2: Integration Test — API Handlers + DB

> **Prioritas P1** — CRUD operations, auth

Belum ada integration tests. Setup diperlukan:

| Area | Deskripsi | Test Priority |
|---|---|---|
| **verifyAuth** — valid token, expired token, no token | P1 | 
| **apiFetch** — success response, error response, network error | P1 |
| **CRUD flow per entity** — create → read → update → delete chain | P2 |
| **PPN auto-calc** — invoice creation with 11% PPN | P2 |
| **Document auto-numbering** — counter increment, year reset | P2 |

---

## Level 3: E2E Test — Playwright

> **Prioritas P1** — Critical business flows

Belum ada setup Playwright. Target flows:

| Flow | Description | Test Priority |
|---|---|---|
| **Login → Dashboard** | Auth flow, role-based redirect | P1 |
| **RFQ → Quotation → Deal** | Full pre-sales cycle | P1 |
| **PO → Receiving → GRN** | Full procurement cycle | P2 |
| **Invoice → Payment** | Finance cycle with PDF generation | P2 |

---

## Test Structure

```
src/test/
├── setup.ts                    # Global test setup (jest-dom matchers)
├── components/                 # Component tests
│   ├── badge.test.tsx          # ✅ Badge component
│   ├── button.test.tsx         # ⏳
│   ├── page-header.test.tsx    # ⏳
│   └── ...
├── validations/                # Zod schema tests
│   ├── absensi.test.ts         # ✅
│   ├── penggajian.test.ts      # ✅
│   ├── barang.test.ts          # ⏳
│   ├── invoice.test.ts         # ⏳
│   └── ...
└── utils/                      # Utility function tests
    ├── document-number.test.ts # ✅
    └── ...
```

---

## Running Tests

```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode (auto-rerun on changes)
npx vitest run        # Same as npm test
npx vitest --ui       # (optional) Vitest UI dashboard
```

---

## Status Ringkasan

| Level | Total | Done | Remaining |
|---|---|---|---|
| Schema Validation (Zod) | ~28 entities | 2 (Absensi, Penggajian) | 26 |
| Utility Functions | ~3 files | 1 (document-number) | 2 |
| Component (UI) | ~10 components | 1 (Badge) | 9 |
| Integration (API) | ~5 areas | 0 | 5 |
| E2E (Playwright) | ~4 flows | 0 | 4 |
| **Total** | **~50** | **4 test files (25 tests)** | **~46** |
