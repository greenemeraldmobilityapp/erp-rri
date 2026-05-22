# Roadmap ERP RRI

## Fase 1 — Setup & Master Data
- [x] Project setup (Next.js, Tailwind, Drizzle, ESLint)
- [x] Database schema (50+ tables)
- [x] Auth pages (login, register)
- [x] Middleware route protection (`src/middleware.ts`)
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

## Fase 2 — Pre-Sales & Sales
- [x] shadcn/ui initialization + base components (Button, Input, Card, Table, Badge, Select, Dialog, Form, Tabs, Checkbox, DropdownMenu, Separator, Textarea)
- [x] UI/UX theme applied (Lexend + Source Sans 3, navy-blue palette, globals.css with Tailwind v4)
- [x] Migration RFQ: customer_id → supplier_id, add nomor + status
- [x] RFQ CRUD (list, tambah, edit) + API routes + document numbering
- [x] Migration Quotation: add nomor + status
- [x] Quotation CRUD (list, tambah, edit) + API routes
- [x] Migration all Fase 2 tables: add nomor + status
- [x] Negosiasi CRUD (list, tambah, edit) + API routes
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

## Fase 8 — Polish & Production
- [ ] Dark Mode
- [ ] Keyboard Shortcuts
- [ ] Loading Skeleton
- [ ] Print-Friendly CSS
- [ ] Testing Setup (Vitest + Playwright)
- [ ] Deploy ke Vercel
