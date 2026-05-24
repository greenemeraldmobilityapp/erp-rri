# Roadmap ERP RRI

## Fase 1 — Setup & Master Data
- [x] Project setup (Next.js, Tailwind, Drizzle, ESLint)
- [x] Database schema (50+ tables)
- [x] Auth pages (login, register)
- [x] Client-side auth (AuthProvider + AuthGuardClient) — avoids middleware hanging issues
- [x] Dashboard layout + sidebar (navigasi ke semua modul)
- [x] Root layout (`<html><body>`) — fix route group `(dashboard)` → `dashboard/`
- [x] Master Barang (list, tambah, edit)
- [x] Master Supplier (list, tambah, edit)
- [x] Master Customer (list, tambah, edit)
- [x] Master PIC Customer (list, tambah, edit)
- [x] Master COA (list, tambah, edit)
- [x] Master Kontrak (list, tambah, edit)
- [x] Master Kategori Barang (list, tambah, edit)
- [x] Master Jabatan (list, tambah, edit)
- [x] Master Karyawan (list, tambah, edit)
- [x] Document Counter auto-numbering (PostgreSQL function + TypeScript utility)
- [x] API infrastructure: `lib/api/client.ts`, `auth.ts`, `errors.ts`, `supabase-server.ts`
- [x] API routes `/api/v1/master/*` — 20 route handlers (GET/POST/PUT/DELETE) untuk 9 entities
- [x] OpenAPI auto-generate (`/openapi.json`) + Scalar UI (`/api-docs`)
- [x] Frontend refactor: all form pages use `apiFetch()` instead of direct Supabase
- [x] Hybrid pattern: server components → direct Supabase, client components → API routes
- [x] UI/UX Design System: shadcn/ui, color palette, typography (Lexend + Source Sans 3), icon rules
- [x] PRD.md v4.0 — didokumentasi penuh (design system, API architecture, folder structure update)
- [x] Master data pages UI update: BreadcrumbNav + PageHeader + EmptyState + table-row pattern (supplier, barang, customer, pic-customer, coa, kontrak, kategori-barang, jabatan, karyawan)

## Fase 2 — Pre-Sales & Sales
- [x] shadcn/ui initialization + base components (Button, Input, Card, Table, Badge, Select, Dialog, Form, Tabs, Checkbox, DropdownMenu, Separator, Textarea)
- [x] UI/UX theme applied (Lexend + Source Sans 3, navy-blue palette, globals.css with Tailwind v4)
- [x] Migration RFQ: customer_id → supplier_id, add nomor + status
- [x] RFQ CRUD (list, tambah, edit) + API routes + document numbering
- [x] Migration Quotation: add nomor + status
- [x] Quotation CRUD (list, tambah, edit) + API routes
- [x] Migration all Fase 2 tables: add nomor + status
- [x] Negosiasi CRUD (list, tambah, edit) + API routes
- [x] Detail pages for Pre-Sales (Quotation, RFQ, Negosiasi) — status workflow visual, copy button, print PDF, activity timeline
- [x] RFQ file upload drag & drop — FileUpload component + Supabase Storage + rfq_document table
- [x] Negosiasi chat-like UI — bubble messages, original vs new price comparison, inline approve/reject
- [x] Customer PO CRUD (list, tambah, edit) + API routes
- [x] DI — Delivery Instruction CRUD (list, tambah, edit) + API routes
- [x] Sales Order CRUD (list, tambah, edit) + API routes
- [x] Delivery Order CRUD (list, tambah, edit) + API routes
- [x] PDF generation (Quotation, DO, Invoice, Kwitansi)
- [x] Sonner toast integration

## Fase 3 — Procurement & Inventory
- [x] Purchase Request CRUD (list, tambah, edit) + API routes + document numbering
- [x] Purchase Order CRUD (list, tambah, edit) + API routes + document numbering
- [x] Purchase Receiving CRUD (list, tambah, edit) + API routes + document numbering
- [x] GRN CRUD (list, tambah, edit) + API routes + document numbering
- [x] Retur Pembelian CRUD (list, tambah, edit) + API routes + document numbering
- [x] Detail pages for Procurement (PR, PO, Receiving, GRN, Retur) — status workflow visual, copy button, dokumen terkait, activity timeline
- [x] AI Search Harga
- [x] Stok Masuk / Keluar
- [x] Kartu Stok

## Fase 4 — Finance & Dokumen PDF
- [x] Invoice CRUD (list, tambah, edit) + API routes + document numbering + PDF generation
- [x] Kwitansi CRUD (list, tambah, edit) + API routes + document numbering + PDF generation
- [x] Faktur Pajak CRUD (list, tambah, edit) + API routes + document numbering
- [x] Jurnal Umum CRUD (list, tambah, edit) + API routes + document numbering
- [x] AR Aging report
- [x] AP Aging report
- [x] Laba / Rugi report
- [x] Neraca report
- [x] Arus Kas report
- [x] Migration 0007: add nomor + status to invoice, kwitansi, faktur_pajak, jurnal
- [x] Sidebar: Finance + Laporan menu groups
- [x] PPN & PPh kalkulasi otomatis di Invoice
- [x] PDF Quotation & DO
- [x] Slip Gaji PDF
- [x] Detail pages for Sales (Customer PO, SO, DO, DI) — status workflow visual, copy button, dokumen terkait, PDF print (DO)

## Fase 5 — AI Agent
- [x] AI Search Harga (Playwright) — page + API + Playwright library + mock fallback
- [x] AI OCR Kontrak — PDF upload + extract + Supabase Storage
- [x] AI Rekomendasi Harga — engine based on PO items + kontrak + default margin 15%
- [x] AI Negosiasi Assistant — margin analysis with approval level logic
- [x] AI sidebar menu group

## Fase 6 — HR, Dashboard & Laporan
- [x] Absensi
- [x] Penggajian
- [x] Slip Gaji
- [x] Dashboard Owner → **Executive Command Center** (7 section: Revenue, Pipeline, Procurement, Finance, Inventory, Pending Actions, Recent Activity)
- [x] Dashboard Manager / Sales / Procurement / Gudang / Finance (role-based, future-ready)
- [x] Export Excel / CSV
- [x] Audit Trail
- [x] Global Search

> **Owner Solo Model:** Owner menjalankan semua operasional sendiri. Dashboard Owner adalah Executive Command Center yang menggabungkan semua informasi bisnis dalam satu layar. Role-specific dashboards siap aktif ketika RRI merekrut karyawan — cukup set role di database.

## Fase 7 — Notifikasi, Retur & Onboarding ✅
- [x] Retur Penjualan (CRUD + API routes + sidebar + dokumen auto-number RTJ)
- [x] WhatsApp Notification via Fonnte (utility + 4 trigger events + cron AR reminder + log page + Toaster) — Quotation, DO Dikirim, PO Supplier, AR Reminder H-7/H-3/H+1/H+7
- [x] User Onboarding (react-joyride, 12 step tour mencakup semua modul, welcome modal + guided tour, DB field `onboarding_disabled` untuk disable/enable, tombol "Panduan" permanen di sidebar untuk replay)

## Fase 8 — Polish & Production ✅
- [x] Dark Mode — CSS variables `.dark` + ThemeProvider + lazy initializer + toggle di sidebar
- [x] Keyboard Shortcuts — `/` fokus search, `Ctrl+N` tambah, `Ctrl+S` submit, `?` help (deferred)
- [x] Loading Skeleton — Skeleton/TableSkeleton/FormSkeleton komponen + loading.tsx di direktori utama
- [x] Print-Friendly CSS — `@media print` sembunyikan sidebar/nav, atur margin halaman
- [x] HTML `<a>` → Next.js `<Link>` migration — all internal navigation links across 40+ dashboard pages use `Link` instead of raw `<a>`, fixing `@next/next/no-html-link-for-pages` ESLint errors
- [x] Build: 0 errors, 0 warnings (previously ~30 warnings + ESLint errors) — all unused imports/vars removed, all `<a>` → `<Link>`, all `any` types removed from detail pages
- [ ] ~~Testing Setup (Vitest + Playwright)~~ — dilewati
- [ ] ~~Deploy ke Vercel~~ — dilewati

> **Catatan:** Testing Setup & Deploy ke Vercel sengaja dilewati untuk saat ini. Fokus dilanjutkan ke ROADMAP_UI/UX.md untuk enhancement UI/UX semua halaman.

## Fase 9 — AI Agent Enhancement (May 2026)
- [x] Skeleton loading states di 4 halaman AI (data-agent, nego-agent, vision-agent, usage)
- [x] Query patterns DataAgent dari 100 → 196 (15+ kategori)
- [x] Filter usage dashboard — date range picker + search user
- [x] Documentation OpenAPI spec untuk 4 AI agent endpoints (nego, data, vision, usage)
- [x] Redis-based rate limiting (in-memory fallback + Upstash Redis support via env vars)
- [x] Supabase Database Webhooks (setup script at `scripts/setup-webhooks.sh`)
- [x] Error rate monitoring — `/api/v1/ai/agents/error-stats` + Error Rate tab di usage dashboard
- [x] Migration `0005_ai_error_tracking.sql` — add `status` + `error_message` columns to all agent history tables

## Fase 10 — PRD Gap Features (May 2026)
- [x] **Prediktif Rekomendasi Supplier** — `src/lib/ai/rekomendasi-supplier.ts` + API + dashboard page + sidebar
- [x] **Auto-Suggest Barang** — `src/lib/ai/auto-suggest-barang.ts` + API + dashboard page + sidebar
- [x] **Price Trend Analysis** — `src/lib/ai/price-trend.ts` + API + dashboard page (recharts chart) + sidebar
- [x] **Anomaly Detection** — `src/lib/ai/anomaly-detection.ts` (z-score stats) + API + dashboard page + sidebar
- [x] **PRD.md update** — tech stack NVIDIA NIM, 3-agent architecture, automation triggers, rate limiting, error monitoring, 4 new features
