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
- **Component Audit** — raw HTML elements identified for migration (ongoing)
- **New Components:** AlertDialog, Breadcrumb, Tooltip, DeleteConfirmationDialog, BreadcrumbNav, EmptyState, TableRow pattern, ErrorBoundary (done)
- **Pages Updated:** supplier, barang, customer, pic-customer, coa, kontrak, kategori-barang, jabatan, karyawan (done)
- **404 Page:** dashboard/not-found.tsx with friendly error page (done)

## Implementation Status
- **Build:** ✅ Passed
- **Lint:** ✅ Passed (only pre-existing test file errors)
- **Known Issue:** Next.js 15 prerenders "use client" pages, but event handlers (onClick, onChange from register()) can't be serialized. Fixed by setting `export const dynamic = "force-dynamic"` in `dashboard/layout.tsx` — all dashboard pages are now dynamic, which is appropriate for an ERP.
- **Reference Form:** `/dashboard/master/barang/tambah` — use as template for other forms
- **Forms Migrated:** supplier, pic-customer, coa, kontrak, kategori-barang, jabatan, karyawan (tambah pages)

## P4 — Global Components (Updates from ui-ux-pro-max)
- [x] Toast notification position konsisten (top-right sudah)
- [ ] Global Search: hasil dikelompokkan per modul (Barang, Customer, PO, dll) — use Command component
- [ ] Sidebar: active state visual (highlight halaman aktif)
- [ ] Sidebar: collapsible untuk mobile
- [ ] Responsive: mobile bottom navigation atau hamburger menu
- [ ] Loading skeleton untuk semua halaman (sudah partial)
- [ ] Error boundary + fallback UI
- [ ] 404 page custom untuk dashboard
- [ ] Delete confirmation: Gunakan AlertDialog untuk konfirmasi hapus

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
- [ ] Tabel: tambahkan column sorting, filter per kolom, search bar per halaman
- [ ] Tabel: nomor baris (row number) di kolom pertama
- [ ] Form: cancel confirmation dialog jika ada perubahan
- [ ] Detail page untuk setiap entity (bukan hanya edit form)
- [ ] Responsive: tabel scroll horizontal di mobile

### P2 — Pre-Sales (RFQ, Quotation, Negosiasi)
- [ ] Quotation: preview PDF di tab/before print
- [ ] Quotation: status workflow visual (Draft → Terkirim → Deal → Lost)
- [ ] RFQ: file upload drag & drop
- [ ] Negosiasi: chat-like UI untuk riwayat negosiasi
- [ ] Timeline/activity log per dokumen
- [ ] Print button langsung dari halaman detail
- [ ] Nomor dokumen auto-generated — tampilkan dengan copy button

### P2 — Sales (Customer PO, SO, DO, Delivery Order)
- [ ] Customer PO: status visual (Pending → Approved → In Progress → Completed)
- [ ] DO: tracking status pengiriman visual
- [ ] DO: barcode/QR code untuk scanning gudang
- [ ] Auto-generate chain: tampilkan alert/notifikasi saat SO/DO auto-terbuat
- [ ] Dokumen terkait: link ke dokumen sumber (PO → SO → DO)

### P2 — Procurement (PR, PO, Receiving, GRN, Retur)
- [ ] PO Supplier: tampilan seperti invoice (header + line items + total)
- [ ] Receiving: form scan barcode / input cepat
- [ ] GRN: komparasi DO vs GRN (barang yang diterima vs dikirim)
- [ ] Approval flow visual untuk PR/PO
- [ ] Dashboard procurement: PR pending, PO ongoing, receiving hari ini

### P2 — Inventory (Gudang, Stok Masuk/Keluar, Kartu Stok)
- [ ] Kartu Stok: timeline visual pergerakan stok
- [ ] Stok: alert minimum stok (visual warning)
- [ ] Stok: filter By Gudang, By Barang, rentang tanggal
- [ ] Stok: export kartu stok ke PDF/Excel
- [ ] Stok Masuk/Keluar: form cepat dengan auto-complete barang

### P3 — Finance (Invoice, Kwitansi, Faktur Pajak, Jurnal)
- [ ] Invoice: preview PDF langsung di browser
- [ ] Invoice: status pembayaran visual (Unpaid → Partial → Paid)
- [ ] AR/AP Aging: grafik batang aging
- [ ] Jurnal: tampilan seperti buku jurnal (format debit/kredit tradisional)
- [ ] Faktur Pajak: format sesuai Dirjen Pajak
- [ ] Dashboard finance: AR/AP ringkasan, cashflow mini-chart

### P3 — Laporan (AR Aging, AP Aging, Laba/Rugi, Neraca, Arus Kas)
- [ ] Chart visual (gunakan recharts atau chart.js — yang sudah ada di project)
- [ ] Filter periode (bulan/tahun/quarted)
- [ ] Export PDF (bukan cuma Excel)
- [ ] Print-friendly layout untuk semua laporan
- [ ] Comparative period (bulan ini vs bulan lalu)

### P3 — AI Agent (Search Harga, OCR, Rekomendasi, Negosiasi Assistant)
- [ ] AI Search: loading skeleton untuk scraping (progress: mencari di Shopee...)
- [ ] AI Search: hasil dengan perbandingan harga visual
- [ ] OCR Kontrak: drag & drop upload + preview hasil OCR
- [ ] Rekomendasi Harga: tampilan seperti side panel / modal
- [ ] Negosiasi Assistant: chat-like interface

### P4 — HR (Absensi, Penggajian, Slip Gaji)
- [ ] Absensi: kalender view kehadiran
- [ ] Penggajian: form perhitungan gaji dengan komponen (gaji pokok, tunjangan, potongan)
- [ ] Slip Gaji: preview sebelum download PDF

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
- [x] Loading skeleton untuk semua halaman (sudah partial)
- [x] Error boundary + fallback UI — ErrorBoundary component created
- [x] 404 page custom untuk dashboard — dashboard/not-found.tsx
- [ ] Sidebar: active state visual (highlight halaman aktif)
- [ ] Sidebar: collapsible untuk mobile
- [ ] Responsive: mobile bottom navigation atau hamburger menu
- [ ] Toast notification position konsisten (top-right sudah)

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
