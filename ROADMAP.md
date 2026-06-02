# ROADMAP — Pengembangan ERP RRI

## 🔴 HIGH — Status Management & Quotation Fixes

| # | Task | Status | File |
|---|------|--------|------|
| 1 | **Fix satuan validation mismatch** — client `z.string().min(1)` → `z.string().optional()` | ✅ Done | `edit/page.tsx` |
| 2 | **Fix barang_id null handling** — `i.barang_id ?? ''` → `?? null` | ✅ Done | `edit/page.tsx` |
| 3 | **Conditional item processing di PUT** — JSON.stringify comparison | ✅ Done | `api/v1/quotation/[id]/route.ts` |
| 4a | **Buat PATCH status endpoint** — `/api/v1/quotation/[id]/status` | ✅ Done | `status/route.ts` |
| 4b | **Quick-action buttons** — Kirim, Setujui, Tolak, Revisi, Tutup | ✅ Done | `[id]/page.tsx` |
| 5 | **Validasi status transition** — `ALLOWED_TRANSITIONS` map | ✅ Done | `route.ts`, `status/route.ts` |
| 6a | **Auto-update quotation status** saat nego approved/rejected | ✅ Done | `negoiasi/[id]/route.ts` |
| 6b | **Tampilkan negosiasi** di halaman quotation detail | ✅ Done | `[id]/page.tsx` |
| 6c | **Tombol "Buat Negosiasi"** → navigasi | ✅ Done | `[id]/page.tsx` |

## 🔵 NEW — Proses Negosiasi Status & Revisi Quotation

| # | Task | Status | File |
|---|------|--------|------|
| A | **Status `proses_negosiasi`** — enum + allowed transitions + badge + workflow | ✅ Done | `status/route.ts`, `[id]/route.ts`, `[id]/page.tsx` |
| B | **Auto-set `proses_negosiasi`** di POST negoiasi | ✅ Done | `negoiasi/route.ts` |
| C | **Update quotation items** saat nego approved (harga + PPN recalc) | ✅ Done | `negoiasi/[id]/route.ts` |
| D | **Kolom `revisi`** INTEGER DEFAULT 0 + tampil `-R1` di nomor | ✅ Done | schema, migration, UI, PDF |
| E | **Validasi transisi nego** — hanya `sent`/`proses_negosiasi` bisa dinego | ✅ Done | `negoiasi/[id]/route.ts` |
| F | **Button visibility** — Edit hanya di draft/rejected, Buat Negosiasi hanya di sent/proses_negosiasi | ✅ Done | `[id]/page.tsx` |

## 🟢 DONE — Customer PO Enhancements (TOP, PIC, Waktu Pengiriman, Due Date Logic)

| # | Task | Status | File |
|---|------|--------|------|
| 1 | **TOP Net 14** — tambah opsi Net 14 ke TOP dropdown | ✅ Done | `tambah/page.tsx`, `edit/page.tsx` |
| 2 | **TOP jatuh tempo logic** — hitungan TOP dimulai setelah invoice hardcopy diterima customer, bukan dari tanggal PO. Due date display dihapus dari form tambah, diganti info note | ✅ Done | `tambah/page.tsx`, `[id]/page.tsx` |
| 3 | **PIC Customer auto-load** — saat pilih customer, PIC otomatis fetch dari DB. Kolom `pic_customer_id` langsung di `customer_po` (bukan join table) | ✅ Done | `tambah/page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx`, `api/v1/master/pic-customer/route.ts` |
| 4 | **Waktu Pengiriman (hari)** — kolom `waktu_pengiriman` di `customer_po`, auto-propagate ke `sales_order` → `delivery_order` → `retur_penjualan` | ✅ Done | schema (4 files), migration, `auto-sales.ts`, tambah/detail/edit pages |
| 5 | **API updates** — POST/PUT customer-po + GET join `customer_pic` + PIC customer filter by `customer_id` | ✅ Done | `api/v1/customer-po/route.ts`, `[id]/route.ts`, `api/v1/master/pic-customer/route.ts` |
| 6 | **Database migration** — `0014_customer_po_extras.sql` | ✅ Done | `migrations/0014_customer_po_extras.sql` |

## ✅ DONE — Email Delivery (SMTP via Nodemailer)

| # | Task | Status | Priority |
|---|------|--------|----------|
| 1 | Install `nodemailer` + types | ✅ Done | Medium |
| 2 | Buat utility `src/lib/utils/email.ts` — kirim email via SMTP dengan auto-log ke `email_log` | ✅ Done | Medium |
| 3 | Buat email template HTML untuk Quotation (body + subject auto saat status → `sent`) | ✅ Done | Medium |
| 4 | Generate PDF Quotation + attach — struktur siap, PDF skip sementara (mismatch type), fallback link portal | ✅ Done | Medium |
| 5 | Tabel `email_log` + schema Drizzle | ✅ Done | Low |
| 6 | SMTP config di `.env.example` | ✅ Done | Low |

**Setup:** App Password di Google Account → `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` di env.

## 🟢 DONE — SO/DO Integration & Navigation Chain

| # | Task | Status | File |
|---|------|--------|------|
| 1 | **PO Detail → Link ke SO** — setelah PO confirm, tampilkan tombol "Lihat SO"; GET endpoint juga include sales_order. Backfill: untuk PO existing (confirmed tanpa SO) tampilkan tombol "Buat SO" | ✅ Done | `customer-po/[id]/page.tsx`, `api/v1/customer-po/[id]/route.ts` |
| 2 | **SO Detail → Link ke DO** — setelah SO processed, tampilkan tombol "Lihat DO" | ✅ Done | `sales-order/[id]/page.tsx` |
| 3 | **Cegah duplicate SO** — cek apakah SO/DO sudah ada sebelum auto-generate | ✅ Done | `auto-sales.ts` |
| 4 | **PO List → Kolom SO status** — tampilkan nomor SO dari list PO | ✅ Done | `customer-po/page.tsx` |
| 5 | **SO List → Kolom DO status** — tampilkan nomor DO dari list SO | ✅ Done | `sales-order/page.tsx` |
| 6 | **Upload dokumen di DO** — foto delivery, signed receipt (schema + migration + API + UI) | ✅ Done | `delivery-order-document.ts`, `0028_add_delivery_order_document.sql`, `documents/route.ts`, `do-documents.tsx`, `[id]/page.tsx` |

## 🟡 SO Enhancement — Sales Order Module Professionalization

### 🔴 Phase 1 — Core Functionality (Critical)

| # | Task | Status | File |
|---|------|--------|------|
| 1 | **Status workflow di detail page** — Konversi SO detail ke `"use client"`, tambah quick-action buttons inline (Konfirmasi, Proses, Kirim, Batalkan) | ✅ Done | `sales-order/[id]/page.tsx` |
| 2 | **Item editing di edit page & API** — Edit page form items (dynamic row, add/remove). PUT handler support `body.items` (delete + re-insert). Tambah field `keterangan` ke edit form | ❌ Removed — SO adalah dokumen binding, items tidak boleh diubah. Edit page dihapus. Status workflow via tombol detail page. | N/A |
| 3 | **Customer info di detail page** — Resolve `customer_po -> customer` join, tampilkan: nama customer, nomor PO, PIC, TOP, waktu_pengiriman, estimasi timeline | ✅ Done | `sales-order/[id]/page.tsx` |
| 4 | **Tab DI di tambah page** — Dua tab: "Dari Customer PO" (existing) dan "Dari Delivery Instruction" (baru). Tab DI: pilih DI (status `active`) → auto-load customer + items dari DI + **harga dari kontrak** | ✅ Done | `sales-order/tambah/page.tsx`, `lib/auto-sales.ts` (generateSOFromDI) |
| 5 | **Document upload SO** — Schema `sales_order_document` + migration `0029` + API `/api/v1/sales-order/[id]/documents` + client `SoDocuments.tsx` + UI di detail page | ✅ Done | new files |

### 🟡 Phase 2 — Professional Standard (High)

| # | Task | Status | File |
|---|------|--------|------|
| 6 | **List page — kolom customer** — Fetch `sales_order` → join `customer_po` → join `customer`. Tampilkan `customer.nama` | ✅ Done | `sales-order/page.tsx` |
| 7 | **Validasi status transisi** — `SO_ALLOWED_TRANSITIONS`: `draft: [confirmed, cancelled]`, `confirmed: [processed]`, `processed: [delivered]`, `delivered: []`, `cancelled: []` | ✅ Done | `api/v1/sales-order/[id]/route.ts` |
| 8 | **waktu_pengiriman display** — Tampilkan di detail card + estimasi tanggal kirim (waktu_pengiriman setelah tanggal SO) | ✅ Done | `sales-order/[id]/page.tsx` |
| 9 | **WhatsApp notification** — Saat SO status → `processed` (auto DO generated), kirim WA ke PIC customer via `sendWhatsapp()` | ✅ Done | `api/v1/sales-order/[id]/route.ts` |

### 🟢 Phase 3 — Enhancement (Medium)

| # | Task | Status | File |
|---|------|--------|------|
 | 10 | **Auto-populate items saat pilih PO** — Saat user pilih PO di tab PO, auto-load items + prices dari PO_items | ✅ Done | `sales-order/tambah/page.tsx` |
| 11 | **is_active usage** — Tambahkan toggle/filter di list & detail, atau hapus field jika tidak dibutuhkan | ✅ Done | `sales-order/page.tsx`, `sales-order/[id]/page.tsx` |
| 12 | **DI reference selector** — Di edit page, tampilkan `di_id` jika ada, izinkan replace | ❌ Removed — edit page dihapus, DI reference hanya di set saat creation | N/A |
| 13 | **Backfill SO untuk existing PO** — Confirmed PO tanpa SO: tampilkan tombol "Buat SO" yang trigger generateSOFromPO | ✅ Done | `customer-po/[id]/page.tsx`, `api/v1/customer-po/[id]/route.ts` |

## 🔴 DO Scan Enhancement — Barcode + QR + Hybrid Checkbox

| # | Task | Status | File |
|---|------|--------|------|
| A | **QR Code DO → encode URL** — QR encode `window.location.origin + /dashboard/delivery-order/{id}` bukan UUID mentah | ✅ Done | `do-scan-panel.tsx` |
| B | **Migration 0033** — `ALTER TABLE barang ADD COLUMN barcode text` + unique index | ✅ Done | `drizzle/0033_add_barang_barcode.sql` |
| C | **Schema Drizzle** — tambah field `barcode: text("barcode")` | ✅ Done | `barang.ts` |
| D | **API barang** — validasi + simpan `barcode` di POST/PUT | ✅ Done | `master/barang/route.ts`, `[id]/route.ts` |
| E | **Form Tambah/Edit barang** — input field `Barcode` (opsional) | ✅ Done | `tambah/page.tsx`, `[id]/edit/page.tsx` |
| F | **Detail barang** — tampilkan `Barcode` di card | ✅ Done | `[id]/page.tsx` |
| G | **API DO items** — select include `barang.barcode` | ✅ Done | `delivery-order/[id]/route.ts` |
| H | **Scanner match** — cocokkan `barcode` dulu, fallback `kode` | ✅ Done | `barcode-scanner.tsx` |
| I | **Hybrid checkbox** — checklist per item + Check All di panel scan | ✅ Done | `do-scan-panel.tsx` |
| J | **API scan** — terima `manual_verified_ids` + catat di audit log | ✅ Done | `delivery-order/[id]/scan/route.ts` |

---

### Status Transition SO

```
draft ──→ confirmed ──→ processed ──→ delivered
  │
  └──→ cancelled
```

### Tab DI → SO Flow

```
User pilih tab "Dari DI"
  → Dropdown daftar DI (status='active', join customer)
  → Pilih DI
    → Auto-load:
      - Customer dari DI.customer_id
      - Items dari DI_item (barang_id, jumlah, keterangan)
      - Harga satuan dari kontrak_item WHERE kontrak_id = DI.kontrak_id AND barang_id match
      - Jika tidak ada match di kontrak → harga = 0 (user bisa isi manual)
  → User review/edit items + harga
  → Submit → POST /api/v1/sales-order (set di_id & customer_po_id=null)
```

## 🟡 DI Module Overhaul — Delivery Instruction Professionalization

### Status Transition DI

```
draft ──→ confirmed ──→ (terminal, locked)
  │
  └──→ cancelled
```

### DI → SO Auto-Generation

```
DI diterbitkan (draft)
  → User setujui DI (confirmed)
    → Auto-generate SO via generateSOFromDI()
    → WhatsApp notification ke PIC Customer
  → SO dibuat dengan di_id = DI.id
```

### Migration Overview

| # | Task | Status | File |
|---|------|--------|------|
| 1 | **Migration 0038** — add `harga_satuan` to `di_item`, `pic_customer_id` to `di`, drop `di_pic` | ✅ Done | `0038_add_di_harga_satuan_pic.sql` |
| 2 | **API POST** — Zod + handler for `pic_customer_id`, `harga_satuan` | ✅ Done | `api/v1/di/route.ts` |
| 3 | **API PUT** — status transitions (draft→confirmed|cancelled), full edit, SO auto-gen on confirmed | ✅ Done | `api/v1/di/[id]/route.ts` |
| 4 | **Auto-sales** — `generateSOFromDI()` prefers `di_item.harga_satuan` over kontrak | ✅ Done | `auto-sales.ts` |
| 5 | **Detail page** — CPO-style: Konfirmasi/Batal buttons, PIC/kontrak info, pricing, SO link | ✅ Done | `di/[id]/page.tsx` |
| 6 | **Create page** — kontrak picker (non-expired), PIC dropdown, harga_satuan, auto-populate | ✅ Done | `di/tambah/page.tsx` |
| 7 | **Edit page** — full edit form (same as create, pre-populated) | ✅ Done | `di/[id]/edit/page.tsx` |
| 8 | **List page** — add PIC Customer column | ✅ Done | `di/page.tsx` |
| 9 | **Item Barang card redesign** — ganti 137-row table + Select dengan 2 opsi input: Import JSON dari Gemini AI (paste array kode+nama+jumlah → auto-match harga_satuan) + Input Manual (ketik kode → auto-lookup). Hapus fetch master barang, hapus render 137 Select options. Performance: load kontrak <500ms (dari 10s), ganti PIC <50ms (dari 4s) | ✅ Done | `di/tambah/page.tsx`, `di/[id]/edit/page.tsx` |
| 10 | **Harga cross-check validation** — simpan `harga_satuan_kontrak` di AddedItem (client-side), visual warning saat harga berbeda dari kontrak (amber bg + AlertTriangle icon + "≠ kontrak: Rp X"), modal konfirmasi submit jika ada perbedaan dengan tabel selisih, user bisa "Kembali Edit" atau "Lanjutkan Simpan" | ✅ Done | `di/tambah/page.tsx`, `di/[id]/edit/page.tsx` |

## 📄 Documentation

| # | Task | Status | File |
|---|------|--------|------|
| 7 | Update PRD.md — flow Quotation status + integrasi Negosiasi | ✅ Done | `PRD.md` |

---

## 🟡 Invoice & Kwitansi Module — Post DO "Dikirim"

### 🔴 Phase 1 — Auto-generate Kwitansi + GRN Input (Critical)

| # | Task | Status | File |
|---|------|--------|------|
| 1 | **Migration** — add `nomor_grn` to `invoice` table | ✅ Done | `migrations/0016_add_nomor_grn_to_invoice.sql` |
| 2 | **Schema update** — add `nomor_grn: text("nomor_grn")` to `invoice.ts` | ✅ Done | `src/lib/db/schema/invoice.ts` |
| 3 | **Auto-generate Kwitansi** di DO PUT — saat DO → `dikirim`, generate Kwitansi barengan Invoice (reference ke Invoice ID) | ✅ Done | `src/app/api/v1/delivery-order/[id]/route.ts` |
| 4 | **Invoice detail — GRN input** — form input `nomor_grn` + save button + upload file GRN via existing invoice document upload (`dokumen/invoice/{id}/`) | ✅ Done | `src/app/dashboard/invoice/[id]/page.tsx` |
| 5 | **Invoice detail — Kwitansi reference** — tampilkan nomor Kwitansi + link ke halaman Kwitansi | ✅ Done | `src/app/dashboard/invoice/[id]/page.tsx` |

### 🟢 Phase 2 — Payment & Jurnal Masuk (High)

| # | Task | Status | File |
|---|------|--------|------|
| 6 | **Schema** — `invoice_payment` table (id, invoice_id, tanggal, amount, metode, keterangan) | ✅ Done | `src/lib/db/schema/invoice-payment.ts` + `migrations/0017_add_invoice_payment.sql` |
| 7 | **API** — Payment recording `POST /api/v1/invoice/{id}/payment` → update invoice status partial/paid | ✅ Done | `src/app/api/v1/invoice/[id]/payment/route.ts` |
| 8 | **Auto-jurnal payment** — saat payment tercatat, generate jurnal debit Cash/Bank, credit AR | ✅ Done | `src/lib/auto-jurnal.ts` |
| 9 | **Invoice detail — Payment form** — UI: input amount, metode bayar, tanggal bayar | ✅ Done | `src/app/dashboard/invoice/[id]/page.tsx` |
| 10 | **Jurnal PDF component** — PDF template untuk jurnal umum | ✅ Done | `src/lib/pdf/jurnal.ts` + `src/app/api/v1/jurnal/[id]/pdf/route.ts` |

### 🟢 Phase 3 — Enhancement (Medium)

| # | Task | Status | File |
|---|------|--------|------|
| 11 | **AR Dashboard** — enhance AR aging dengan data payment & outstanding, filter by status | ✅ Done | `src/app/dashboard/laporan/ar-aging/page.tsx` |

---

## 🟢 Rencana Lanjutan — Post Invoice & Kwitansi

### ✅ Done — Faktur Pajak PDF + Auto-generate

| # | Task | Status | File |
|---|------|--------|------|
| FP-1 | **Faktur Pajak PDF route** — `GET /api/v1/faktur-pajak/[id]/pdf` + PDF component rewritten with proper PKP Penjual/Pembeli layout, company data from site_settings, NPWP, multi-column item table with DPP/PPN/PPh | ✅ Done | `src/app/api/v1/faktur-pajak/[id]/pdf/route.ts` + `src/lib/pdf/faktur-pajak.tsx` |
| FP-2 | **Auto-generate dari Invoice** — tombol "Buat Faktur Pajak" di invoice detail + dialog input nomor_faktur + API auto-compute DPP/PPN/PPh dari invoice items | ✅ Done | `src/app/dashboard/invoice/[id]/page.tsx` + `src/lib/auto-faktur-pajak.ts` + `src/app/api/v1/invoice/[id]/auto-faktur-pajak/route.ts` |
| FP-3 | **Faktur Pajak detail page — PKP & NPWP** — ambil data company profile dari site_settings (bukan hardcoded), tampilkan NPWP dari database + PDF Preview/Download buttons | ✅ Done | `src/app/dashboard/faktur-pajak/[id]/page.tsx` + `src/components/faktur-pajak-pdf-actions.tsx` |

### 🔴 High Priority — Kwitansi & Invoice Polish

| # | Task | Status | File |
|---|------|--------|------|
| K-1 | **Kwitansi detail page** — halaman `/dashboard/kwitansi/{id}` (sekarang cuma ada edit page) | ✅ Done | `src/app/dashboard/kwitansi/[id]/page.tsx` |
| K-2 | **Invoice detail → link ke Kwitansi detail** (bukan edit) | ✅ Done | `src/app/dashboard/invoice/[id]/page.tsx` |

---

## 🟡 Kwitansi Module — Gaps & Perbaikan (berdasarkan audit)

### 🔴 High Priority — Critical Bugs

| # | Task | Status | File |
|---|------|--------|------|
| KW-1 | **Document upload broken** — detail page panggil `/api/v1/kwitansi/{id}/documents` tapi tidak ada API route. Buat schema `kwitansi_document` + drizzle export + API route (GET/POST/DELETE) + migration | ✅ Done | `kwitansi-document.ts`, `index.ts`, `documents/route.ts` |
| KW-2 | **Create page unusable** — input `invoice_item_id` masih UUID manual, tidak auto-load items saat pilih invoice. Ganti dengan checkbox pilih item dari invoice + auto-fill jumlah | ✅ Done | `kwitansi/tambah/page.tsx` |
| KW-3 | **Detail page — item display raw UUID** — kolom menampilkan `barang_id` (UUID) bukan nama barang. Tampilkan nama barang, kode, harga satuan | ✅ Done | `kwitansi/[id]/page.tsx`, `api/v1/kwitansi/[id]/route.ts` |

### 🟡 Medium Priority — UX & Workflow

| # | Task | Status | File |
|---|------|--------|------|
| KW-4 | **Status quick-actions** — Tambah "Selesaikan" button di detail page (draft → completed), tanpa perlu edit page | ✅ Done | `kwitansi/[id]/page.tsx` |
| KW-5 | **Filter kwitansi by invoice_id server-side** — ganti fetch all + client filter di invoice detail page | ✅ Done | `api/v1/kwitansi/route.ts`, `invoice/[id]/page.tsx` |
| KW-6 | **Confirmation dialog** — konfirmasi sebelum ubah status ke completed | ✅ Done | `kwitansi/[id]/page.tsx` |
| KW-7 | **PDF — redesign sesuai format contoh** — desain klasik dengan border biru ganda, bilingual labels, terbilang, signature block, ref DI/PO, tinggi setengah A4 | ✅ Done | `lib/pdf/kwitansi.tsx`, `lib/utils/terbilang.ts`, `api/v1/kwitansi/[id]/pdf/route.ts` |

### ✅ Done

| # | Task | Status |
|---|------|--------|
| K-1 | Kwitansi detail page | ✅ Done |
| K-2 | Invoice → link ke Kwitansi | ✅ Done |

### ✅ Done — Invoice PDF Finalization

| # | Task | Status | File |
|---|------|--------|------|
| IP-1 | **urutan column on invoice_item** — migration `0021` add `urutan integer` + backfill. All insert handlers assign `urutan`. GET route `.order('urutan')` | ✅ Done | `0021_add_urutan_to_invoice_item.sql`, `invoice-item.ts`, `invoice/route.ts`, `[id]/route.ts` |
| IP-2 | **Bank fields in site_settings** — add `company_bank_name`, `company_rekening_nama`, `company_rekening_nomor` to COMPANY_KEYS + company settings page form | ✅ Done | `system/company/route.ts`, `system/company/page.tsx` |
| IP-3 | **Invoice PDF route update** — remove signature/stamp fields, add bank fields, remove PPN/PPh computation, `.order('urutan')`, include `urutan` in item mapping | ✅ Done | `invoice/[id]/pdf/route.ts` |
| IP-4 | **Invoice PDF component rewrite** — `.ts` + `createEl()`. Remove DPP/PPN/PPh rows, no signature/stamp images, wet signature only. Bank data from site_settings. Multi-page pagination (15 ROWS_PER_PAGE). Page numbers (`Page X of Y`). Format alignment with quotation.ts. "Hal" → "Perihal", "DI Number" → "No. Ref. DI". Sequential item numbering via `urutan` from DB | ✅ Done | `invoice.ts` |

### ✅ Done — Resi Packing & Multi-Page PDF

| # | Task | Status | File |
|---|------|--------|------|
| RP-1 | **Migration — add packing_number to delivery_order_item** | ✅ Done | `migrations/0019_add_packing_number_to_doi.sql` |
| RP-2 | **Schema drizzle — packingNumber field** | ✅ Done | `delivery-order-item.ts` |
| RP-3 | **API — PUT packing assignments** — validasi max 10 items/packing | ✅ Done | `api/v1/delivery-order/[id]/packing/route.ts` |
| RP-4 | **PDF component — multi-page packing** — `packingGroups` input, per-group page, "packing i of n" | ✅ Done | `resi-pengiriman.ts` |
| RP-5 | **Route handler — group items by packing_number** — backward compatible (all NULL = single group) | ✅ Done | `resi-pdf/route.ts` |
| RP-6 | **Packing dialog** — dialog modal, packing tabs, checklist items, Simpan + Preview/Download Resi | ✅ Done | `resi-packing-dialog.tsx` |
| RP-7 | **DO detail page** — ganti DOPdfDownload dengan DOHeaderActions (SJ buttons + button Resi Packing) | ✅ Done | `page.tsx`, `do-header-actions.tsx` |
| RP-8 | **Packing dialog enhancement** — search by kode/nama di Item Tersedia, kolom No. Urut (fixed dari SJ) + Kode Barang, nomor urut tetap berdasarkan index original items | ✅ Done | `resi-packing-dialog.tsx` |
| RP-9 | **urutan column — sinkron nomor item SJ & Resi PDF** — migration `0020` add `urutan integer` ke `delivery_order_item` + backfill. Semua insert handler assign `urutan`. SJ & Resi PDF sort by `urutan` | ✅ Done | `0020_add_urutan_to_doi.sql`, `delivery-order-item.ts`, `delivery-order/route.ts`, `[id]/route.ts`, `auto-sales.ts`, `pdf/route.ts`, `delivery-order.ts`, `resi-pdf/route.ts` |

### ✅ Done — Export & Precision

| # | Task | Status | File |
|---|------|--------|------|
| E-1 | **Export Excel UI buttons** — reusable `ExportButton` component + ditambahkan ke 24 list pages (semua halaman utama: invoice, kwitansi, quotation, sales-order, delivery-order, customer-po, di, faktur-pajak, jurnal, dll) + whitelist tabel export diperluas | ✅ Done | `src/components/export-button.tsx` + 24 list pages + `src/app/api/v1/export/route.ts` |
| E-2 | **Financial data type precision** — migrasi `real` → `numeric(18,2)` untuk 8 tabel keuangan (invoice, invoice_item, kwitansi_item, faktur_pajak, faktur_pajak_item, jurnal_item, supplier_payment) + update Drizzle schema + `$type<number>()` agar kompatibel TS | ✅ Done | `0022_financial_numeric_precision.sql` + 8 schema files |

### ✅ Done — Email Delivery (dari ROADMAP existing)

| # | Task | Status | Priority |
|---|------|--------|----------|
| EM-1 | Install `nodemailer` + `@types/nodemailer` | ✅ Done | Medium |
| EM-2 | Buat utility `src/lib/utils/email.ts` — kirim email via SMTP dengan auto-log ke `email_log` | ✅ Done | Medium |
| EM-3 | Buat email template HTML untuk Quotation di status route | ✅ Done | Medium |
| EM-4 | Generate PDF Quotation + attach — struktur attachment API siap | ✅ Done | Medium |
| EM-5 | Tabel `email_log` — migration + schema Drizzle | ✅ Done | Low |
| EM-6 | SMTP config di `.env.example` — Gmail App Password | ✅ Done | Low |

## ✅ Done — Tanda Terima PDF Revision & Delivery Slip Integration

| # | Task | Status | File |
|---|------|--------|------|
| TT-1 | **Font + layout revisions** — font sizes 10pt/9pt, "No. Ref. PO/DI" → "No. PO Ref./No. DI Ref.", "Tanggal" → "Tempat/Tanggal", checkbox gap 8, tighter margins/padding, signature stamp image, Page 1 of 1 footer | ✅ Done | `src/lib/pdf/tanda-terima.ts` |
| TT-2 | **API route updated** — fetch referensi PO/DI + signature stamp from site_settings | ✅ Done | `api/v1/invoice/[id]/tanda-terima/pdf/route.ts` |
| TT-3 | **Schema changes** — add `invoice_id` to `grn`, remove `nomor_grn` from `invoice`, add `delivery_slip_nomor` + `delivery_slip_file_url` to `delivery_order` | ✅ Done | `grn.ts`, `invoice.ts`, `delivery-order.ts` |
| TT-4 | **Migration 0024** — all 3 schema changes applied | ✅ Done | `migrations/0024_fix_grn_invoice_delivery_slip.sql` |
| TT-5 | **DO API PUT** — include delivery_slip fields in select/update, auto-link GRN → Invoice via `grn.invoice_id` | ✅ Done | `api/v1/delivery-order/[id]/route.ts` |
| TT-6 | **DO detail page** — add `DoDeliverySlip` client component (nomor input + file upload) | ✅ Done | `do-delivery-slip.tsx`, `delivery-order/[id]/page.tsx` |
| TT-7 | **Invoice detail/edit** — remove nomor_grn field from detail & edit pages + API | ✅ Done | `invoice/[id]/page.tsx`, `invoice/[id]/edit/page.tsx`, `api/v1/invoice/[id]/route.ts` |
| TT-8 | **API route rewrite** — fetch all 11 document numbers (RFQ, SPH, PO, Kontrak, DI, Delivery Slip, Surat Jalan, GRN, Invoice, Kwitansi) via joined chain | ✅ Done | `api/v1/invoice/[id]/tanda-terima/pdf/route.ts` |
| TT-9 | **PDF component** — change "Jenis Dokumen" → "Nama Dokumen", replace "Kelengkapan" checkbox column with "Nomor Dokumen" text column, dynamic `dokumenList` data | ✅ Done | `lib/pdf/tanda-terima.ts` |

## Catatan

### Flow Quotation Status
```
draft ──→ sent ──→ proses_negosiasi ──→ approved ──→ closed
  │         │            │
  │         │            └──→ rejected
  │         └──→ rejected
  └──→ rejected ──→ draft (revisi)
```

### Status Transitions Allowed
| From | To |
|------|----|
| draft | sent, rejected |
| sent | approved, rejected, **proses_negosiasi** |
| **proses_negosiasi** | **approved, rejected** |
| approved | closed |
| rejected | draft |
| closed | (terminal) |
