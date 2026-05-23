# ROADMAP UI/UX Refinement — ERP RRI

## Design System
- **Pattern:** Enterprise Gateway (professional, trust signals, enterprise-grade)
- **Style:** Data-Dense Dashboard + Accessible & Ethical (existing navy-blue scheme dipertahankan)
- **Colors:** Primary `#0F172A`, Secondary `#1E293B`, CTA `#0369A1` (navy + blue — sesuai existing)
- **Typography:** Lexend (heading) + Source Sans 3 (body) — sesuai existing, tidak perlu ganti
- **Icons:** Lucide (konsisten dengan existing)
- **Stack:** shadcn/ui + Tailwind CSS (existing)

## System Foundation
- **DESIGN_SYSTEM.md** — single source of truth (done, updated with ui-ux-pro-max)
- **Pattern Components:** PageHeader, StatusBadge, FormActions (done)
- **CSS Variables** — completed in globals.css with foreground variants (done)
- **Reference Implementation:** barang/tambah/page.tsx — shadcn Form pattern (done)
- **Form Layout Patterns** — updated in DESIGN_SYSTEM.md section 11 (done)
- **Toast Pattern** — sonner v2 with loading/id pattern (done)
- **Toaster in Layout** — Toaster component added to app/layout.tsx (done)
- **Performance Guidelines** — section 16 in DESIGN_SYSTEM.md (done)
- **Component Audit** — completed: ~290 hardcoded color violations, 42 raw `<select>`, 26 raw `<table>`, 12 raw `<button>`, 10 raw `<input>`, 9 custom spinners
- **New Components:** AlertDialog, Breadcrumb, Tooltip, DeleteConfirmationDialog, BreadcrumbNav, EmptyState, TableRow pattern, ErrorBoundary (done)
- **Pages Updated:** supplier, barang, customer, pic-customer, coa, kontrak, kategori-barang, jabatan, karyawan (done)
- **404 Page:** dashboard/not-found.tsx with friendly error page (done)

## Implementation Status
- **Build:** ✅ Passed
- **Lint:** ✅ Passed (only pre-existing warnings)
- **Known Issue:** Next.js 15 prerenders "use client" pages — event handlers can't be serialized during static generation. Fixed by setting `export const dynamic = "force-dynamic"` in `dashboard/layout.tsx`. All dashboard pages are now dynamic, appropriate for an ERP.
- **Reference Form:** `/dashboard/master/barang/tambah` — use as template for other forms
- **Reference List:** `/dashboard/master/barang` — use as template for master list pages (DataTable + search + inline actions)
- **Master Data Enhancement:** All 9 master pages (barang, supplier, customer, PIC Customer, COA, kontrak, kategori-barang, jabatan, karyawan):
  - [x] Search bar with real-time client-side filtering
  - [x] Column sorting with sort direction indicator
  - [x] Row numbering (auto-increment)
  - [x] Responsive horizontal scroll (`overflow-x-auto`)
  - [x] Inline action buttons (edit/delete) per row with delete confirmation
  - [x] Reusable `MasterDataTable<T>` component with generic column configuration
  - [x] "use client" pattern with client-side data fetching (instant search/sort)

## Design Audit — Raw HTML Element Migration

### P0 — Completed (May 2026)
- **Hardcoded colors → CSS variables:** All 10 edit/tambah pages now use `text-destructive`, `bg-success/10`, `border-border`, `text-muted-foreground`, etc.
- **Raw `<button>` → `<Button>`:** All buttons in edit/tambah pages migrated to shadcn Button
- **Raw `<a>` → `<Button variant="link" asChild><Link>`:** All navigation links migrated
- **Custom spinner → `<Loader2>`:** All custom `animate-spin border-4 border-blue-500` replaced
- **Files:** supplier/[id]/edit, master/barang/[id]/edit, master/karyawan/[id]/edit, master/jabatan/[id]/edit, master/kategori-barang/[id]/edit, master/customer/[id]/edit, master/kontrak/[id]/edit, master/coa/[id]/edit, master/pic-customer/[id]/edit, customer/tambah

### P1 — Raw `<select>` → shadcn `<Select>` + Raw `<input>` → `<Input>` + shadcn `<Form>` pattern
- **All tambah pages** (master + non-master) now use shadcn `<Form>` + `<FormField>` + `<Select>` ✅
- **Total converted:** 20 pages (6 simple + 14 complex useFieldArray) ✅
- **Strategy:** Hybrid approach — `<Form>` wrapper + `<FormField><Select>` for select fields, keep `register()` for `<Input type="number">` to avoid valueAsNumber type issues

### P2 — Raw `<table>` → shadcn `<Table>`
- **ALL 27 non-master list pages** now use shadcn `<Table>` ✅
- **Master list pages** (9 pages) already use shadcn `<Table>` with table-row.tsx pattern ✅
- **Absensi** was reference (converted earlier) ✅
- **Converted:** delivery-order, sales-order, jurnal, invoice, kwitansi, faktur-pajak, penggajian, negoiasi, customer-po, di, purchase-order, grn, purchase-receiving, purchase-request, retur-pembelian, retur-penjualan, rfq, quotation, notifikasi, audit-log, inventory/gudang, inventory/stok, laporan/neraca, laporan/ar-aging, laporan/ap-aging, supplier, customer, ai/ocr-kontrak ✅

## P4 — Global Components (Updates from ui-ux-pro-max)
- [x] Toast notification position konsisten (top-right sudah)
- [x] Global Search: hasil dikelompokkan per modul (Barang, Customer, PO, dll) — use Command component
- [x] Sidebar: active state visual (highlight halaman aktif) — usePathname, bg-accent, font-medium for current page
- [x] Sidebar: collapsible untuk mobile — Sheet drawer with hamburger button, collapsible section groups with ChevronDown toggle
- [x] Responsive: mobile bottom navigation atau hamburger menu — hamburger button (md:hidden) + Sheet sidebar drawer, section groups auto-expand when child active
- [x] Loading skeleton untuk semua halaman (Phase 1 Master Data ✅, Phase 2 Transactions ✅) ⚠️ See `roadmap-skeleton.md` for full implementation roadmap
  - **Centralized Components:** `/src/components/ui/skeleton.tsx` — single source of truth, update 1 file untuk affect semua halaman
  - **Implemented:** AI pages (search-harga, ocr-kontrak), Master list (barang, supplier, customer, pic-customer, coa, kontrak, kategori-barang, jabatan, karyawan), HR (absensi), Inventory (stok) ✅
  - **Phase 1 Master Data (9/9):** All 9 master data pages now use TableSkeleton ✅
  - **Phase 2 Transactions (2/2 client list pages):** absensi (CalendarSkeleton), inventory/stok (TableSkeleton). All 19 other transaction list pages are Server Components — block on server, no skeleton needed.
  - **Remaining:** ~100 pages — mostly Server Components (no skeleton needed), plus detail/edit pages (use spinner pattern). See roadmap-skeleton.md for detail.
- [x] Error boundary + fallback UI — ErrorBoundary component created
- [x] 404 page custom untuk dashboard — dashboard/not-found.tsx
- [x] Delete confirmation: Gunakan AlertDialog untuk konfirmasi hapus

## Prioritas & Halaman

### P1 — Master Data (Barang, Supplier, Customer, PIC, COA, Kontrak, Kategori, Jabatan, Karyawan)
- [x] Migrate all master data forms to shadcn Form pattern (barang/tambah as reference)
- [x] Form: success/error toast setelah submit (using sonner v2)
- [x] Form: loading state saat submit (button disabled + spinner) — FormActions pattern
- [x] Form: validasi error inline — shadcn Form + FormMessage pattern
- [x] Tabel: status badge konsisten (Active = hijau, Non-Active = merah) — using inline badge with CSS variables
- [x] Delete confirmation dialog dengan warning — using DeleteConfirmationDialog component
- [x] Breadcrumb navigasi — using BreadcrumbNav component
- [x] Empty state dengan ilustrasi + pesan "Belum ada data" — using EmptyState component
- [x] Tabel: tambahkan column sorting, filter per kolom, search bar per halaman — via MasterDataTable component
- [x] Tabel: nomor baris (row number) di kolom pertama — via MasterDataTable component
- [x] Form: cancel confirmation dialog jika ada perubahan — via useUnsavedChanges hook + ConfirmLeaveDialog component
- [x] Detail page untuk setiap entity (bukan hanya edit form) — 9 detail pages created
- [x] Responsive: tabel scroll horizontal di mobile — via MasterDataTable + overflow-x-auto

### P2 — Pre-Sales (RFQ, Quotation, Negosiasi)
- [x] Quotation: preview PDF di tab (Preview PDF + Download PDF buttons, print-friendly layout, cetak PDF di bottom)
- [x] Quotation: status workflow visual (Draft → Terkirim → Deal → Lost) — StatusWorkflow component
- [x] RFQ: file upload drag & drop — FileUpload component with Supabase Storage
- [x] Negosiasi: chat-like UI untuk riwayat negosiasi — bubble messages + inline approve/reject
- [x] Timeline/activity log per dokumen — ActivityTimeline component using audit_log table
- [x] Print button langsung dari halaman detail — Quotation detail has PDF print button
- [x] Nomor dokumen auto-generated — tampilkan dengan copy button — CopyButton component

### P2 — Sales (Customer PO, SO, DO, Delivery Order)
- [x] Customer PO: status visual (Draft → Dikonfirmasi → Batal) — StatusWorkflow + detail page
- [x] DO: tracking status pengiriman visual (Draft → Siap Kirim → Dikirim → Selesai) — StatusWorkflow + detail page
- [x] Sales Order: status visual (Draft → Dikonfirmasi → Diproses → Dikirim) — StatusWorkflow + detail page
- [x] DI: status visual (Draft → Aktif → Selesai) — StatusWorkflow + detail page
- [x] Dokumen terkait: link ke dokumen sumber (PO → SO → DO) — di semua 4 detail pages
- [ ] DO: barcode/QR code untuk scanning gudang
- [x] Auto-generate chain: ketika Customer PO dikonfirmasi → SO auto-terbuat (items di-copy dari PO), ketika SO diproses → DO auto-terbuat (items di-copy dari SO). Notifikasi toast + tombol "Lihat SO/DO" yang navigasi ke detail dokumen baru

### P2 — Procurement (PR, PO, Receiving, GRN, Retur)
- [x] PR: status visual (Draft → Disetujui/Ditolak) — StatusWorkflow + detail page
- [x] PO Supplier: status visual (Draft → Terkirim → Dikonfirmasi) — StatusWorkflow + detail page
- [x] PO Supplier: tampilan seperti invoice (header + line items)
- [x] Purchase Receiving: status visual (Draft → Selesai) — StatusWorkflow + detail page
- [x] GRN: status visual (Draft → Selesai) — StatusWorkflow + detail page
- [x] Retur Pembelian: status visual (Draft → Dikirim → Diproses) — StatusWorkflow + detail page
- [x] Dokumen terkait: link ke dokumen sumber (PR → PO → Receiving → GRN, PO → Retur) — di semua 5 detail pages
- [x] PO Supplier: tampilan total per item (subtotal) — sudah ada subtotal per item + grand total
- [x] Receiving: input cepat — auto-populate item dari PO yang dipilih
- [x] GRN: komparasi source vs GRN (barang source, GRN qty, selisih dengan color-coding)
- [x] Approval flow visual untuk PR/PO — inline Setujui/Tolak (PR), Kirim/Konfirmasi (PO) buttons
- [x] Dashboard procurement: PR pending, PO ongoing, receiving hari ini — enhanced procurement dashboard

### P2 — Inventory (Gudang, Stok Masuk/Keluar, Kartu Stok)
- [x] Kartu Stok: timeline visual pergerakan stok (icon color-coded per tipe mutasi, timeline with running balance)
- [x] Stok: alert minimum stok (visual warning — Badge destructive di kolom status)
- [x] Stok: filter By Gudang (dropdown), By Barang (search input), toggle Stok Minimum Saja
- [x] Stok: export ke CSV
- [x] Stok Masuk/Keluar: form cepat dengan auto-complete barang (searchable barang dropdown)

### P3 — Finance (Invoice, Kwitansi, Faktur Pajak, Jurnal)
- [x] Invoice: preview PDF langsung di browser (Preview PDF + Download buttons on new detail page)
- [x] Invoice: status pembayaran visual (Draft → Dikirim → Partial → Lunas, plus Overdue) — PaymentStatusWorkflow on detail page
- [x] Invoice: detail page with items table, PPN/PPh breakdown, grand total, auto-journal info
- [x] Invoice: eye button on list page navigates to detail page
- [x] AR/AP Aging: grafik batang aging (recharts BarChart, 4 bucket cards dengan nominal Rp, detail table link ke invoice/PO)
- [x] Jurnal: tampilan seperti buku jurnal (format debit/kredit tradisional) — detail page with timestamp, COA code, debit/credit columns, running totals, balance check
- [x] Faktur Pajak: format sesuai Dirjen Pajak — detail page with official format (kode & nomor seri, PKP Penjual/Pembeli, DPP/PPN/PPh breakdown, cetak button)
- [x] Dashboard finance: AR/AP ringkasan (grouped bar chart + per-bucket breakdown) + cashflow mini-chart (6-month area chart revenue vs expense)

### P3 — Laporan (AR Aging, AP Aging, Laba/Rugi, Neraca, Arus Kas)
- [x] Chart visual — recharts BarChart (Laba/Rugi revenue vs COGS), PieChart (Neraca aset/liabilitas/ekuitas), AreaChart (Arus Kas pemasukan/pengeluaran)
- [x] Filter periode — PeriodFilter shared component: tahun + bulan/kuartal dropdown, URL search params driven
- [x] Export PDF — ExportPdfButton client component: downloads PDF via `/api/v1/laporan/[type]/pdf?download=1` API route with full report data (KPI ringkasan, rincian per bulan, grand total)
- [x] Print-friendly layout — `print:shadow-none print:border` on Cards, hidden sidebar on print, print watermark
- [x] Comparative period — bulan ini vs bulan lalu for all Laporan pages (KPI comparison cards with diff + percentage)

### P3 — AI Agent (Search Harga, OCR, Rekomendasi, Negosiasi Assistant)
- [x] AI Search: loading skeleton untuk scraping (progress: mencari di Shopee...) — implemented in search-harga page
- [x] AI Search: hasil dengan perbandingan harga visual — price range bar, min/max/average display
- [ ] OCR Kontrak: drag & drop upload + preview hasil OCR
- [ ] Rekomendasi Harga: tampilan seperti side panel / modal
- [ ] Negosiasi Assistant: chat-like interface

### P4 — HR (Absensi, Penggajian, Slip Gaji)
- [x] Absensi: kalender view kehadiran
- [x] Penggajian: form perhitungan gaji dengan komponen (gaji pokok, tunjangan, potongan)
- [x] Slip Gaji: preview sebelum download PDF

### P4 — Dashboard (Home)
- [ ] Owner Command Center: KPI cards dengan icon + trend indicator (naik/turun)
- [ ] Revenue chart (line chart 6 bulan)
- [ ] Pipeline: pipeline visual (RFQ → Quotation → PO → SO)
- [ ] Pending Actions: list dengan urgency badge
- [ ] Recent Activity: timeline dengan avatar + timestamp
- [ ] Quick Actions: grid tombol shortcut

### P4 — Global Components
- [x] Global Search: hasil dikelompokkan per modul (Barang, Customer, PO, dll) — use Command component
- [x] Delete confirmation: Gunakan AlertDialog untuk konfirmasi hapus
- [x] TooltipProvider: wrap app dengan TooltipProvider untuk tooltip consistency
- [ ] Loading skeleton untuk semua halaman (sudah partial) ⚠️ See `roadmap-skeleton.md` for full implementation plan
- [x] Error boundary + fallback UI — ErrorBoundary component created
- [x] 404 page custom untuk dashboard — dashboard/not-found.tsx
- [x] Sidebar: active state visual (highlight halaman aktif) — usePathname, bg-accent, font-medium for current page
- [x] Sidebar: collapsible untuk mobile — Sheet drawer with hamburger button, collapsible section groups with ChevronDown toggle
- [x] Responsive: mobile bottom navigation atau hamburger menu — hamburger button (md:hidden) + Sheet sidebar drawer, section groups auto-expand when child active
- [x] Toast notification position konsisten (top-right sudah)

### P4 — Auth (Login, Register)
- [x] Login: loading spinner di button + disabled state
- [x] Login: error message yang jelas dengan role="alert" + styling desteductive
- [x] Login: password visibility toggle (Eye/EyeOff icons)
- [x] Login: desain split-screen (brand panel + form card)
- [x] Register: shadcn Form + Select components
- [x] Register: password strength indicator (4 level bar + checklist)
- [x] Register: password visibility toggle
- [x] Register: role select dengan shadcn Select
- [x] Auth layout: gradient brand panel dengan company info
- [x] Semua form pakai shadcn/ui Card, Input, Button, Label
- [x] Bahasa Indonesia untuk semua label dan pesan error

## Implementation Notes
1. **Tidak perlu ganti font** — Lexend + Source Sans 3 sudah sesuai rekomendasi
2. **Tidak perlu ganti warna** — navy-blue scheme sudah enterprise-grade
3. **Fokus ke improvement** — loading state, empty state, error state, responsive, interaksi
4. **Semua ikon pakai Lucide** — sudah konsisten
5. **shadcn/ui Table component** — ganti custom table dengan shadcn Table jika ada
6. **react-hook-form + Zod** — sudah sesuai best practice, tinggal perbaiki tampilan error
7. **sonner toast** — sudah terintegrasi, konsisten dipakai semua form
8. **Gunakan recharts** jika perlu chart — sudah ada di dependencies
9. **Next.js 15 prerendering issue:** Event handlers (onClick, onChange from register(), onSubmit) can't be serialized during static generation, even on "use client" pages. Pages wrapped in shadcn `<Form>`/`FormActions` work around this via proper client boundaries. Raw `<form>` + `{...register()}` + `<Button onClick>` patterns in page JSX trigger the error. Fix: `export const dynamic = "force-dynamic"` at the layout level skips prerendering for those routes.
