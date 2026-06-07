# ROADMAP — Pengembangan ERP RRI

## ✅ DONE — Sidebar Navigation & Document Management Page

| # | Task | Status | File |
|---|------|--------|------|
| SN-1 | **Sidebar: "Delivery Instr." → "Delivery Instruction"** — rename + pindah posisi di bawah "Customer PO" | ✅ Done | `src/components/sidebar-content.tsx` |
| SN-2 | **Sidebar: category heading color** — default `text-muted-foreground`, jadi `text-primary` saat ada child link active | ✅ Done | `src/components/sidebar-content.tsx` |
| SN-3 | **Sidebar: "Manajemen Dokumen" pindah** — dari top-level ke dalam grup Master Data, di bawah "Kategori Barang" | ✅ Done | `src/components/sidebar-content.tsx` |
| DM-1 | **Migration all_documents view** — tambah `recordid` column + 4 UNION baru (DO, Delivery Slip, GRN Customer, Kwitansi) | ✅ Done | `0027_update_all_documents_view.sql` |
| DM-2 | **Migration virtual PDF entries** — 5 UNION virtual PDF (Quotation, DO/Surat Jalan, Invoice, Tanda Terima, Kwitansi) dengan prefix `pdf-{modul}-{id}` | ✅ Done | `0028_add_virtual_pdf_entries.sql` |
| DM-3 | **Migration Resi Pengiriman** — add virtual PDF entries untuk Resi Pengiriman | ✅ Done | `0029_add_virtual_pdf_resi_pengiriman.sql` |
| DM-4 | **API dokumen — filter nomorPo & nomorDi** — tambah filter via `.or('and(...)')` | ✅ Done | `src/app/api/v1/dokumen/route.ts` |
| DM-5 | **Frontend dokumen page** — semua modul dropdown, smart filters, PDF buttons per modul | ✅ Done | `src/app/dashboard/dokumen/page.tsx` |
| DM-6 | **PDF blob fetch pattern** — virtual PDF entries (fileurl `/api/...`) di-fetch dengan auth token via blob fetch → `URL.createObjectURL()` → `window.open(blobUrl)`. Storage files tetap `window.open(url)` langsung. Anti-popup blocker: buka tab kosong dulu, set `location.href` setelah blob siap. | ✅ Done | `src/app/dashboard/dokumen/page.tsx` |
| DM-7 | **Download button storage files** — tombol Download terpisah (icon `Download`) di samping tombol Buka per baris. Untuk semua tipe file: blob fetch (dengan auth jika API route, tanpa jika public URL) → download via `<a download>` click. | ✅ Done | `src/app/dashboard/dokumen/page.tsx` |
| DM-8 | **Fix: Missing modules in all_documents view** — tambah Retur Pembelian, RFQ Supplier, GRN ke view (supplier-side, NULL customer) | ✅ Done | `0030_add_missing_document_modules.sql` |
| DM-9 | **Fix: Sales Order document upload 404** — buat `sales_order_document` table + API route + Drizzle schema + tambah ke view | ✅ Done | `0031_create_sales_order_document.sql`, `0032_add_sales_order_to_documents_view.sql`, `sales-order/[id]/documents/route.ts` |
| DM-10 | **Update frontend dropdown** — tambah 5 modul baru (Resi Pengiriman, Retur Pembelian, RFQ Supplier, GRN, Sales Order) ke filter dan badge colors | ✅ Done | `src/app/dashboard/dokumen/page.tsx` |
| DM-11 | **Smart Filter DI & PO** — autocomplete combobox untuk cari nomor DI / PO Customer. Resolve chain DI → SO → DO/Invoice/Kwitansi/Retur/GRN Customer/Kontrak. UI: Popover + Command, debounced search (300ms), auto-fill customer dropdown. API: `/api/v1/dokumen/autocomplete/di`, `/api/v1/dokumen/autocomplete/po` | ✅ Done | `route.ts`, `document-search-combobox.tsx`, `page.tsx` |

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

## 🟡 Import dari PO — Master Barang Enhancement

| # | Task | Status | File |
|---|------|--------|------|
| PO-1 | **Planning & Design** — Final plan documented | ✅ Done | `.opencode/plans/import-dari-po.md` |
| PO-2 | **DB Migration — `customer_prompt` table** — CREATE TABLE untuk simpan prompt per customer | ✅ Done | `0041_create_customer_prompt.sql` |
| PO-3 | **Drizzle Schema `customer-prompt.ts`** — schema TypeScript untuk `customer_prompt` | ✅ Done | `src/lib/db/schema/customer-prompt.ts` |
| PO-4 | **`generateDocumentNumber` — tambah parameter tahun/bulan** — agar nomor dokumen bisa menggunakan tanggal PO dari PDF | ✅ Done | `src/lib/utils/document-number.ts` |
| PO-5 | **`generateCustomerAutoKode`** — auto-generate kode customer `CUST-{NNNNN}` | ✅ Done | `src/lib/utils/barang-auto-create.ts` |
| PO-6 | **API: GET customer/[id]/prompt** — fetch prompt template per customer | ✅ Done | `src/app/api/v1/master/customer/[id]/prompt/route.ts` |
| PO-7 | **API: POST import-from-po** — validasi JSON, auto-match customer/PIC, auto-create barang, create PO+items | ✅ Done | `src/app/api/v1/master/barang/import-from-po/route.ts` |
| PO-8 | **Frontend Tab "Import dari PO"** — dropdown customer, prompt, upload PDF, paste JSON, preview, import | ✅ Done | `src/app/dashboard/master/barang/tambah/page.tsx` |
| PO-9 | **Seed data prompt BJS & MKP** — isi `customer_prompt` untuk 2 customer | ✅ Done | Supabase — BJS + MKP aktif |
| PO-10 | **Migration `nomor_quotation_rri`** — tambah column ke `customer_po` | ✅ Done | `0042_add_nomor_quotation_rri_to_customer_po.sql` |
| PO-11 | **Fix: `apiFetch` → `apiFetchFormData`** — FormData import kirim Content-Type application/json (salah), ganti dengan `apiFetchFormData` yang tidak set Content-Type agar browser set multipart boundary | ✅ Done | `src/app/dashboard/master/barang/tambah/page.tsx` |
| PO-12 | **Fix: status 'linked' untuk barang existing dgn harga beda** — ganti 'skipped' misleading jadi 'linked' di response API | ✅ Done | `src/app/api/v1/master/barang/import-from-po/route.ts` |
| PO-13 | **Fix: tampilkan `nomor_quotation_rri` di detail PO** — tambah field ke interface + grid display di halaman detail customer PO | ✅ Done | `src/app/dashboard/customer-po/[id]/page.tsx` |
| PO-14 | **Add `nama_penandatangan` + `jabatan_penandatangan` ke `customer_po`** — migration + drizzle schema + API insert + Zod validation | ✅ Done | `0043_add_signatory_fields_to_customer_po.sql`, `customer-po.ts`, `import-from-po/route.ts` |
| PO-15 | **Update prompt BJS & MKP** — BJS: PIC/Jabatan dari header, Penandatangan dari signature block. MKP: PIC & Penandatangan dari signature block (duplikat) | ✅ Done | Supabase `customer_prompt` (BJS + MKP) |
| PO-16 | **Display Penandatangan PO di detail page** — section baru "Penandatangan PO" di bawah PIC Customer di halaman detail customer PO | ✅ Done | `src/app/dashboard/customer-po/[id]/page.tsx` |
| PO-17 | **Fix missing fields + duplicate prevention** — tambah `nomor_pr_customer` (migration 0044 + schema + API insert + detail page), fix `nama_penandatangan`/`jabatan_penandatangan` tidak tersimpan (sudah ada di API insert sejak PO-14), duplicate check `nomor_po_customer` (case-insensitive, non-cancelled) + UNIQUE INDEX di migration 0044 | ✅ Done | `0044_add_nomor_pr_customer_and_unique_index.sql`, `customer-po.ts`, `import-from-po/route.ts`, `customer-po/[id]/page.tsx` |

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

### ✅ Done — Kwitansi Page Polish (from audit vs Invoice)

| # | Task | Status | File |
|---|------|--------|------|
| K-8 | **Tampilkan customer info di list & detail** — join `invoice → customer`, tampilkan `customer.nama` di tabel list dan customer card di detail (nama, kode) | ✅ Done | `page.tsx`, `[id]/page.tsx`, `api/v1/kwitansi/route.ts`, `[id]/route.ts` |
| K-9 | **Perbaiki edit page** — tambah edit tanggal, tampilkan items current, shadcn `<Select>` not raw `<select>`, navigasi balik ke detail page | ✅ Done | `[id]/edit/page.tsx` |
| K-13 | **shadcn Select di edit page** — subsumed by K-9 | ❌ Removed | N/A |
| K-15 | **Navigasi edit → detail** — subsumed by K-9 | ❌ Removed | N/A |

### ✅ Done — Medium Priority

| # | Task | Status | File |
|---|------|--------|------|
| K-10 | **Running total saat create** — tampilkan total pembayaran agregat dari item yang dipilih | ✅ Done | `tambah/page.tsx` |
| K-11 | **Kolom total amount di list** — tampilkan nominal kwitansi di tabel list | ✅ Done | `page.tsx` |
| K-12 | **Error state di detail page** — set error state variable, tampilkan error UI (bukan silent "not found") | ✅ Done | `[id]/page.tsx` |

### ✅ Done — Low Priority

| # | Task | Status | File |
|---|------|--------|------|
| K-14 | **Loading skeleton di create** — skeleton loading saat inisialisasi form | ✅ Done | `tambah/page.tsx` |

### ✅ Done

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

## ✅ Done — Skenario B: Non-PKP (PPN/PPh Removal)

| # | Task | Status | File |
|---|------|--------|------|
| SB-1 | **Invoice API POST** — hapus `ppn_rate`, `pph_rate`, per-item `ppn`/`pph` dari Zod schema dan insert logic | ✅ Done | `api/v1/invoice/route.ts` |
| SB-2 | **Invoice API PUT** — hapus field PPN/PPh dari update | ✅ Done | `api/v1/invoice/[id]/route.ts` |
| SB-3 | **Invoice create page** — hapus input PPN Rate, PPh Rate, PPN/PPh columns dari item table & form | ✅ Done | `invoice/tambah/page.tsx` |
| SB-4 | **Invoice edit page** — hapus PPN Rate, PPh Rate inputs + PPN/PPh columns | ✅ Done | `invoice/[id]/edit/page.tsx` |
| SB-5 | **Invoice detail page** — hapus PPh column, "Buat Faktur Pajak" button/dialog; grand total = DPP only | ✅ Done | `invoice/[id]/page.tsx` |
| SB-6 | **DO → auto-invoice route** — hapus `getConfigNumber`, `ppnRate`, `ppn_rate` from invoice insert | ✅ Done | `api/v1/delivery-order/[id]/route.ts` |
| SB-7 | **Sidebar** — hapus "Faktur Pajak" menu item | ✅ Done | `sidebar-content.tsx` |
| SB-8 | **Dashboard main** — hapus pending faktur pajak count & alert | ✅ Done | `dashboard/page.tsx` |
| SB-9 | **Finance dashboard** — hapus faktur pajak stat card & quick action | ✅ Done | `dashboards/finance.tsx` |
| SB-10 | **Quotation** — default `ppn_enabled: false` di schema, form, dan API POST | ✅ Done | `quotation/tambah/page.tsx`, `[id]/edit/page.tsx`, `api/v1/quotation/route.ts` |
| SB-11 | **Kwitansi PDF redesign** — blue border → double black, terbilang single-line with auto-wrap, DI ref dari `nomor_di_customer`, padding 40pt, amount styling | ✅ Done | `lib/pdf/kwitansi.ts` |
| SB-12 | **Finance dashboard** — remove unused `ReceiptText` import | ✅ Done | `dashboards/finance.tsx` |

**Keputusan:** PPN=0 (non-PKP), PPh dibayar langsung perusahaan ke kantor pajak, tidak dipotong dari invoice customer. DB columns (`ppn_rate`, `pph_rate`, `ppn`, `pph`) tetap ada untuk skenario PKP masa depan — API dan UI hanya mengabaikannya.

## 🔴 Phase 4 — Flow Procurement & Inventory — Gap Fixes

### 🔴 Critical — Blocking End-to-End Flow

| # | Task | Status | File |
|---|------|--------|------|
| SP-1 | **Supplier Payment — Schema & API** — buat API route GET/POST/PUT untuk `supplier_payment` + Zod validation | ✅ Done | `api/v1/procurement/supplier-payment/` |
| SP-2 | **Supplier Payment — Create page** — form tambah pembayaran (inline dialog di list page) + PO URL bug fixed | ✅ Done | `procurement/supplier-payment/page.tsx` |
| SP-3 | **Supplier Payment — Detail page** — info supplier, PO ref, nominal, metode, bukti transfer, link ke PO, edit button | ✅ Done | `procurement/supplier-payment/[id]/page.tsx` |
| SP-4 | **Supplier Payment — Edit page** — update metode, bukti transfer, keterangan (read-only: supplier, PO, nominal, tanggal) | ✅ Done | `procurement/supplier-payment/[id]/edit/page.tsx` |
| SP-5 | **Supplier Payment — Auto-jurnal** — debit Hutang (COA 2-1000), credit Kas/Bank (COA 1-1101) + PO status → completed on payment | ✅ Done | `lib/auto-jurnal.ts`, `api/v1/procurement/supplier-payment/route.ts` |
| SO-1 | **Stock Opname — Schema & API** — buat API route GET/POST/PUT + migration tabel `stock_opname` + `stock_opname_item` | ✅ Done | `api/v1/inventory/stock-opname/` |
| SO-2 | **Stock Opname — Create page** — form opname via inline dialog di list page (pilih petugas, gudang) | ✅ Done | `inventory/stock-opname/page.tsx` |
| SO-3 | **Stock Opname — Detail page** — lihat item, input stok fisik per barang, selisih auto-hitung, tambah/hapus barang, ubah status (selesai/dibatalkan) | ✅ Done | `inventory/stock-opname/[id]/page.tsx` |
| SO-4 | **Stock Opname — Edit page** — edit stok fisik, keterangan per item, tambah/hapus barang, edit keterangan sesi | ✅ Done | `inventory/stock-opname/[id]/edit/page.tsx` |

### 🟡 Medium — Enhancement

| # | Task | Status | File |
|---|------|--------|------|
| GD-1 | **Gudang — Detail page** — tambah halaman `[id]/page.tsx` untuk lihat detail warehouse | ✅ Done | `inventory/gudang/[id]/page.tsx` |
| MC-1 | **Master Customer — Create page** — tambah halaman `tambah/page.tsx` di master customer | ✅ Done | `master/customer/tambah/page.tsx` |

## 🔴 Global Single Document Counter (Replaces Reservation System)

**Keputusan Arsitektur:** Mengganti sistem reservasi per-modul dengan single global counter (`GLB`). Hanya 2 entry points (RFQC, DI) yang memanggil counter langsung. Semua dokumen anak menyalin nomor dari parent.

| # | Task | Status | File | Priority |
|---|------|--------|------|----------|
| GC-1 | **Migration — `increment_document_counter()` updated** — PG function untuk global counter, accept `p_kode_dokumen: 'GLB'` | ✅ Done | `0034_global_document_counter.sql` | 🔴 High |
| GC-2 | **Utility — `generateGlobalDocumentNumber()` + `formatChildNumber()`** — di `src/lib/utils/document-number.ts` | ✅ Done | `document-number.ts` | 🔴 High |
| GC-3 | **Parent POST handlers** — RFQC, DI call `generateGlobalDocumentNumber(kode)` | ✅ Done | `rfq-customer/route.ts`, `di/route.ts` | 🔴 High |
| GC-4 | **Manual POST handlers** — quotation, customer-po, sales-order: copy parent number or fallback to global | ✅ Done | `quotation/route.ts`, `customer-po/route.ts`, `sales-order/route.ts` | 🔴 High |
| GC-5 | **Auto-sales.ts** — 3 functions use `formatChildNumber()` | ✅ Done | `auto-sales.ts` | 🔴 High |
| GC-6 | **DO auto-generate on `dikirim`** — invoice, kwitansi use `formatChildNumber()` | ✅ Done | `delivery-order/[id]/route.ts` | 🔴 High |
| GC-7 | **Direct POST paths** — invoice, kwitansi, retur-penjualan: copy parent or fallback to global | ✅ Done | `invoice/route.ts`, `kwitansi/route.ts`, `retur-penjualan/route.ts` | 🔴 High |
| GC-8 | **Frontend tambah pages** — hapus `nomorAuto` state, next-number API calls, countdown, `reserveId` (quotation, customer-po) | ✅ Done | `tambah/page.tsx` (quotation, customer-po) | 🟡 Medium |
| GC-9 | **Cleanup unused routes** — hapus `/api/v1/quotation/next-number`, `/api/v1/customer-po/next-number` | ✅ Done | deleted 2 route files | 🟡 Medium |
| GC-10 | **Update PRD.md & ROADMAP.md** — dokumentasi arsitektur baru | ✅ Done | `PRD.md`, `AGENTS.md`, `ROADMAP.md` | 🟡 Medium |
| GC-11 | **Migrate NEG, TT, GRNC ke global counter** — negoiasi, tanda-terima, grn-customer, retur→GRNC | ✅ Done | `negoiasi/route.ts`, `tanda-terima/pdf/route.ts`, `grn-customer/route.ts`, `retur-penjualan/[id]/route.ts` | 🟡 Medium |

---

## 🔴 Jurnal Umum — Balance Validation, Retur Auto-Jurnal, & Edit Items Enhancement

| # | Task | Status | File |
|---|------|--------|------|
| JU-1 | **P0: Balance validation Jurnal POST/PUT** — API menolak jurnal dengan total debit ≠ total kredit | ✅ Done | `api/v1/jurnal/route.ts`, `api/v1/jurnal/[id]/route.ts` |
| JU-2 | **P0: Invoice DELETE cleanup jurnal** — saat invoice dihapus, jurnal auto-generated + kwitansi ikut dihapus | ✅ Done | `api/v1/invoice/[id]/route.ts` |
| JU-3 | **P1: Migration all_documents view — Jurnal virtual PDF** — tambah `pdf-jurnal-{id}` entry | ✅ Done | `0036_add_jurnal_to_documents_view.sql` |
| JU-4 | **P1: Edit page jurnal — items editing** — tambah form items (akun, debit, credit, keterangan) reusable dari tambah page | ✅ Done | `jurnal/[id]/edit/page.tsx` |
| JU-5 | **P2: Auto-jurnal Retur Penjualan** — generate jurnal saat retur penjualan dibuat (debit Revenue, credit AR), estimasi dari invoice_item | ✅ Done | `lib/auto-jurnal.ts`, `api/v1/retur-penjualan/route.ts` |
| JU-6 | **P2: Auto-jurnal Retur Pembelian** — generate jurnal saat retur pembelian dibuat (debit AP, credit Persediaan), estimasi dari PO_item | ✅ Done | `lib/auto-jurnal.ts`, `api/v1/retur-pembelian/route.ts` |
| JU-7 | **P2: Better COA error messages** — split gabungan jadi per-akun: "COA 1-1100 (Piutang Dagang) belum dibuat" | ✅ Done | `lib/auto-jurnal.ts` |
| JU-8 | **Update PRD.md & ROADMAP.md** — dokumentasi perubahan | ✅ Done | `PRD.md`, `ROADMAP.md` |

## 🔒 Disabled Sidebar Menus — Fitur dalam Pengembangan

Menu berikut di-sidebar di-*disable* (opacity 50%, tidak bisa diklik, muncul toast "Fitur dalam proses pengembangan").

### Master Data
| Menu | Keterangan |
|------|------------|
| Chart of Accounts | Belum diimplementasikan |
| Jabatan | Belum diimplementasikan |
| Karyawan | Belum diimplementasikan |
| Import Excel | Belum diimplementasikan |

### Procurement (Semua)
| Menu | Keterangan |
|------|------------|
| RFQ Supplier | Belum diimplementasikan |
| Purchase Request | Belum diimplementasikan |
| Purchase Order | Belum diimplementasikan |
| Penerimaan | Belum diimplementasikan |
| GRN | Belum diimplementasikan |
| Retur Pembelian | Belum diimplementasikan |
| Pembayaran Supplier | Belum diimplementasikan |

### Inventory (Semua)
| Menu | Keterangan |
|------|------------|
| Gudang | Belum diimplementasikan |
| Stok | Belum diimplementasikan |
| Stok Masuk | Belum diimplementasikan |
| Stok Keluar | Belum diimplementasikan |
| Stock Opname | Belum diimplementasikan |

### Laporan (Semua)
| Menu | Keterangan |
|------|------------|
| AR Aging | Belum diimplementasikan |
| AP Aging | Belum diimplementasikan |
| Laba / Rugi | Belum diimplementasikan |
| PPN Masa | Belum diimplementasikan |
| Neraca | Belum diimplementasikan |
| Arus Kas | Belum diimplementasikan |

### AI Agent (Semua)
| Menu | Keterangan |
|------|------------|
| Search Harga | Belum diimplementasikan |
| OCR Kontrak | Belum diimplementasikan |
| Rekomendasi Harga | Belum diimplementasikan |
| Rekomendasi Supplier | Belum diimplementasikan |
| Negosiasi | Belum diimplementasikan |
| Auto-Suggest Barang | Belum diimplementasikan |
| Price Trend | Belum diimplementasikan |
| Anomaly Detection | Belum diimplementasikan |

### HR (Semua)
| Menu | Keterangan |
|------|------------|
| Absensi | Belum diimplementasikan |
| Penggajian | Belum diimplementasikan |

**Cara meng-enable:** Hapus `disabled: true` dari item yang sesuai di `src/components/sidebar-content.tsx`.

---

## ✅ Done — Per-Page Tour Mandiri (Onboarding)

| # | Task | Status | File |
|---|------|--------|------|
| PT-1 | **Fix auto-start tour** — `requestAnimationFrame` di `handleWelcomeStart` agar welcome modal hilang dulu sebelum Joyride mulai | ✅ Done | `onboarding-provider.tsx` |
| PT-2 | **Fix Joyride `callback` → `onEvent`** — prop `callback` tidak ada di react-joyride v3.1.0, ganti dengan `onEvent`. Juga pasang handler yang sebelumnya tidak terpakai. | ✅ Done | `onboarding-provider.tsx` |
| PT-3 | **Buat komponen `PageTour` reusable** — wrapper Joyride untuk per-page tour. Fitur: auto-show pas first visit (localStorage), trigger button inline, skip/finish mark done. Style konsisten dengan global tour. | ✅ Done | `page-tour.tsx` |
| PT-4 | **Tour steps Barang List** — 5 step: Data Barang, Pencarian, Tabel, Tambah Barang, Aksi Baris | ✅ Done | `tour-steps/barang-list.ts` |
| PT-5 | **Tour steps Barang Form** — 8 step: Title, Tabs Input, Nama, Kode, Kategori, Harga, Foto, Simpan | ✅ Done | `tour-steps/barang-form.ts` |
| PT-6 | **`data-tour` di MasterDataTable** — search bar & table wrapper | ✅ Done | `master-data-table.tsx` |
| PT-7 | **`data-tour` + `PageTour` di barang list** — title, search, table, tambah button, actions | ✅ Done | `barang/page.tsx` |
| PT-8 | **`data-tour` + `PageTour` di barang form** — title, tabs, 6 form fields, image, simpan | ✅ Done | `barang/tambah/page.tsx` |

### Cara menambahkan tour ke halaman baru:
1. Buat file `tour-steps/{page-name}.ts` — export array of `Step`
2. Tambahkan `data-tour` attributes ke elemen DOM yang relevan
3. Import `PageTour` + step array, render `<PageTour pageKey="..." steps={...} />` di PageHeader actions

### File baru:
- `src/components/onboarding/page-tour.tsx`
- `src/components/onboarding/tour-steps/barang-list.ts`
- `src/components/onboarding/tour-steps/barang-form.ts`

---

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
| closed | (terminal)

---

## ✅ Done — Cron Migration: Vercel → cron-job.org

**Alasan migrasi:** Vercel Hobby plan hanya mendukung 1 cron execution per hari, tidak support ekspresi `*/6` atau multiple runs per hari.

**Solusi:** cron-job.org (free tier: 60 requests/hour) → replace Vercel built-in cron.

| # | Task | Status | File |
|---|------|--------|------|
| CRON-1 | **Remove crons from vercel.json** — hapus semua cron config,只剩 `installCommand` | ✅ Done | `vercel.json` |
| CRON-2 | **Add CRON_SECRET_TOKEN to Vercel** — via `npx vercel env add` CLI | ✅ Done | Vercel project settings |
| CRON-3 | **Secure all cron endpoints** — cek `Authorization: Bearer <CRON_SECRET_TOKEN>` header di `/api/v1/cron/approval-escalation`, `/api/v1/cron/contract-expiry-reminder` (ex-automation) | ✅ Done | 2 route files |
| CRON-4 | **Remove Vercel Cron trigger annotations** — hapus `export const dynamic = "force-static"` + comment "Vercel Cron" | ✅ Done | 3 route files |
| CRON-5 | **Update PRD.md Background Jobs section** — dokumentasi cron-job.org + 3 endpoint schedules | ✅ Done | `PRD.md` |

**Cron Endpoints & Schedules:**

| Endpoint | Schedule (cron-job.org) | Fungsi |
|----------|------------------------|--------|
| `/api/v1/cron/contract-expiry-reminder` | `0 6 * * *` (daily 6 AM) | Ex-automation: contract alerts + AR summary |
| `/api/v1/cron/invoice-due-date-reminder` | `1 6 * * *` (daily 6:01 AM) | Invoice due date reminders: H-3..H+30 |
| `/api/v1/cron/do-overdue-reminder` | `2 6 * * *` (daily 6:02 AM) | DO delivery reminder: H-7, H-3, H-1, H |
| `/api/v1/cron/approval-escalation` | `0 8,12,17 * * 1-5` (Mon-Fri 8AM/12PM/5PM) | WhatsApp escalation ke manager jika PR/PO pending >24 jam |

**Setup cron-job.org:**
1. Buat akun di cron-job.org
2. Buat 4 cron jobs (1 per endpoint)
3. HTTP Method: GET
4. URL: `https://erp.rizkiridholahi.com/api/v1/cron/{name}`
5. Header: `Authorization: Bearer <CRON_SECRET_TOKEN>`
6. Schedule staggering:
   - `0 6 * * *` → contract-expiry-reminder (06:00:00)
   - `1 6 * * *` → invoice-due-date-reminder (06:01:00)
   - `2 6 * * *` → do-overdue-reminder (06:02:00)
   - `0 8,12,17 * * 1-5` → approval-escalation (08:00, 12:00, 17:00)

## ✅ Done — WhatsApp Notifications for Cron Automation

**Implementation:** WhatsApp alerts untuk Contract Expiring & AR Overdue dikirim ke owner.

| # | Task | Status | File |
|---|------|--------|------|
| WA-1 | **Add `getOwnerWhatsapp()` helper** — ambil nomor dari `site_settings.key = 'owner_whatsapp'` | ✅ Done | `src/lib/utils/whatsapp.ts` |
| WA-2 | **Add `sendContractAlertNotifications()`** — build summary message untuk expired +即将 expired contracts | ✅ Done | `src/lib/ai/agents/DataAgent/tools/contractAlert.ts` |
| WA-3 | **Add `sendBulkReminderNotifications()`** — build summary message untuk AR overdue invoices | ✅ Done | `src/lib/ai/agents/DataAgent/tools/smartReminder.ts` |
| WA-4 | **Update cron automation route** — call notification functions after processing triggers | ✅ Done | `src/app/api/v1/cron/contract-expiry-reminder/route.ts` |
| WA-5 | **Add owner_whatsapp to site_settings** — set default owner number | ✅ Done | Database migration |
| WA-6 | **Update PRD.md** — dokumentasi setup Fonnte API + site_settings | ✅ Done | `PRD.md` |

**Message Format:**
- Contract Alerts: `📋 Ringkasan Alert Kontrak RRI` dengan list expired &即将 expired (5 teratas)
- AR Reminders: `💰 Ringkasan Reminder Piutang RRI` dengan list urgent & normal overdue (5 teratas)

**Requirements:**
- Valid Fonnte API token (`FONNTE_API_KEY` env var)
- Owner WhatsApp number configured in `site_settings` (`key = 'owner_whatsapp'`)
- Bahasa Indonesia + WIB timezone

**Test Status:**
- ✅ Endpoint berjalan dan merespons dengan benar
- ✅ Fonnte API token valid (`bGCQZXbYeqfeYX9BbfB9`)
- ✅ Database sudah ada `owner_whatsapp = 6285640884088`
- ✅ WhatsApp terkirim dengan format Bahasa Indonesia + WIB timezone
- ✅ Build successful tanpa error

## 🔵 NEW — Cron Jobs Revision (Owner-Only Notifications)

**Revision Summary:** Semua notifikasi WhatsApp cron jobs kini dikirim ke owner (bukan ke PIC customer atau manager).

| # | Task | Status | Priority |
|---|------|--------|----------|
| CRON-REV-1 | **Update ar-reminder** — recipient dari PIC Customer → Owner | ❌ Cancelled (removed) | 🔴 High |
| CRON-REV-2 | **Update ar-reminder schedule** — dari `0 7 * * *` → `0 6 * * *` | ❌ Cancelled (removed) | 🔴 High |
| CRON-REV-3 | **Update approval-escalation** — recipient dari Manager → Owner | ⏳ Pending | 🔴 High |
| CRON-REV-4 | **Create invoice-due-date-reminder** — endpoint baru untuk reminder H-3, H-1, H, H+1...H+30 | ✅ Done | 🔴 High |
| CRON-REV-5 | **All implementations** — Bahasa Indonesia + WIB timezone (`formatDateWIB()`) | ⏳ Pending | 🔴 High |
| CRON-REV-6 | **Update documentation** — PRD.md + ROADMAP.md dengan revision details | ✅ Done | 🟡 Medium |
| CRON-REV-7 | **Migration site_settings** — add `escalation_hours` key | ⏳ Pending | 🟡 Medium |
| CRON-REV-8 | **Rename `automation` → `contract-expiry-reminder`** — rename folder + update all references | ✅ Done | 🔴 High |
| CRON-REV-9 | **Create `do-overdue-reminder`** — endpoint baru DO delivery reminder H-7, H-3, H-1, H | ✅ Done | 🔴 High |
| CRON-REV-10 | **Delete `ar-reminder`** — digantikan invoice-due-date-reminder yang lebih lengkap (H-3, H-1, H, H+1..H+30) | ✅ Done | 🔴 High |

**New Endpoint: `/api/v1/cron/invoice-due-date-reminder`**
- **Target**: Invoice yang akan jatuh tempo (due date)
- **Schedule**: H-3, H-1, H (due date), H+1, H+2, ... H+30 (stop setelah paid atau max H+30)
- **Time**: `0 6 * * *` (setiap hari jam 6 pagi WIB)
- **Recipient**: Owner WhatsApp
- **Message Format**: Bahasa Indonesia dengan detail invoice, customer, total, dan jatuh tempo WIB

**Site Settings Migration Required:**
```sql
-- escalation_hours (default: 24)
INSERT INTO site_settings (key, value) 
VALUES ('escalation_hours', '24')
ON CONFLICT (key) DO UPDATE SET value = '24';
```

## ✅ Done — Notifikasi Page Enhancement (Dashboard Monitoring)

**Perbaikan:** Halaman `/dashboard/notifikasi` diperbaiki dari server component dengan anon key menjadi client component dengan API route terautentikasi + fitur filtering dan pagination.

| # | Task | Status | Priority |
|---|------|--------|----------|
| NP-1 | **Create API route `GET /api/v1/whatsapp-log`** — endpoint dengan `supabaseAdmin`, filter status + search recipient + pagination | ✅ Done | 🔴 High |
| NP-2 | **Fix auth: server component → client component** — ganti `supabase` (anon key) dengan `apiFetch` via API route terautentikasi (verifyAuth) | ✅ Done | 🔴 High |
| NP-3 | **Filter status** — Select dropdown untuk filter sent/delivered/failed | ✅ Done | 🟡 Medium |
| NP-4 | **Search recipient** — Input text search by nomor HP (ILIKE) | ✅ Done | 🟡 Medium |
| NP-5 | **Pagination** — page buttons (prev/next) + total page | ✅ Done | 🟡 Medium |
| NP-6 | **Expand message dialog** — klik icon Eye untuk lihat pesan lengkap di modal | ✅ Done | 🟡 Medium |
| NP-7 | **Show error_reason** — kolom Keterangan muncul jika ada log failed dengan error reason | ✅ Done | 🟡 Medium |
| NP-8 | **Fix delivered label** — `delivered` → "Tersampaikan" (sebelumnya "Terkirim" sama dengan `sent`) | ✅ Done | 🟢 Low |
| NP-9 | **sent_at priority** — tampilkan `sent_at` jika ada, fallback ke `created_at` | ✅ Done | 🟢 Low |

---

## ✅ Done — Improvement Plan: Retur Barang (GRN) & Retur Penjualan Integration

### Overview
Setelah rename "GRN Customer" → "Retur Barang (GRN)" dan memperbaiki flow auto-generate, berikut rencana perbaikan integrasi antara Retur Penjualan (commercial/accounting) dan Retur Barang/GRN (warehouse/operational).

**Keputusan arsitektur:** GRN Customer TIDAK boleh auto-generate dari DO `dikirim` (barang keluar). GRN hanya dibuat dari:
1. **Auto-generate** saat Retur Penjualan → `closed` (correct — barang kembali ke gudang)
2. **Manual** via form tambah (untuk skenario retur tanpa retur penjualan formal)

### Correct Flow
```
Customer retur barang
  → User buat Retur Penjualan (manual, auto-populate dari DO)
    → User close Retur Penjualan
      → Auto-generate GRN Customer (draft, retur_penjualan_id set)
        → Warehouse verifikasi barang, set GRN → completed
          → Stock otomatis bertambah (via stok_mutasi)
```

### 🔴 Phase 1 — Core Fixes (Critical)

| # | Task | Status | File |
|---|------|--------|------|
| RP-1.0 | **Remove DO → GRN auto-generate** — hapus blok auto-generate GRN Customer dari DO `dikirim` (semantically wrong: barang keluar, bukan diterima) | ✅ Done | `delivery-order/[id]/route.ts:223-266` |
| RP-1.1 | **Rename "GRN Customer" → "Retur Barang (GRN)"** — sidebar item label + list page title & description + tambah page title + detail page title + edit page title (12 files total) | ✅ Done | `sidebar-content.tsx`, `grn-customer/page.tsx`, `grn-customer/tambah/page.tsx`, `grn-customer/[id]/page.tsx`, `grn-customer/[id]/edit/page.tsx`, `invoice/[id]/page.tsx`, `dokumen/page.tsx`, `dokumen/route.ts`, `grn-customer/route.ts`, `retur-penjualan/route.ts`, docs |
| RP-1.2 | **Add useEffect watching `delivery_order_id`** — saat DO dipilih, auto-fetch items from DO and populate the barang table | ✅ Done | `retur-penjualan/tambah/page.tsx` |
| RP-1.3 | **Snapshot fields at creation** — copy `harga_satuan`, `diskon_persen`, `keterangan` from DO items as initial values | ✅ Done | `retur-penjualan/tambah/page.tsx` |
| RP-1.4 | **handleBarangChange integration** — editable fields (jumlah, harga_satuan, diskon, subtotal, keterangan) | ✅ Done | `retur-penjualan/tambah/page.tsx` |
| RP-1.5 | **Read-only items from DO** — baris dari DO read-only (kecuali jumlah retur) | ✅ Done | `retur-penjualan/tambah/page.tsx` |

### 🟡 Phase 2 — Bidirectional Link Retur Penjualan ↔ Retur Barang/GRN (High)

| # | Task | Status | File |
|---|------|--------|------|
| RP-2.1 | **GRN tambah — tetap "Dari DO" (existing)** — manual GRN creation via DO selector | ✅ Done | `grn-customer/tambah/page.tsx` |
| RP-2.2 | **Kolom `retur_penjualan_id` di GRN** — verify API POST manual juga set field | ✅ Done | `grn-customer.ts` + API routes |
| RP-2.3 | **Detail page Retur Penjualan — tampilkan link GRN** — nomor + link ke detail GRN | ✅ Done | `retur-penjualan/[id]/page.tsx` |
| RP-2.4 | **Detail page GRN — tampilkan link Retur Penjualan** — nomor + link ke detail retur | ✅ Done | `grn-customer/[id]/page.tsx` |

### 🟢 Phase 3 — Document Numbering Consistency (Medium)

| # | Task | Status | File |
|---|------|--------|------|
| RP-3.1 | **GRN number from retur parent** — POST manual pakai `formatChildNumber` jika ada parent, fallback ke `generateGlobalDocumentNumber` | ✅ Done | `grn-customer/route.ts` |
| RP-3.2 | **Retur number from DO parent** — retur penjualan already uses `formatChildNumber` if parent exists | ✅ Done | `retur-penjualan/route.ts` |

### 🔵 Phase 4 — Auto-fill Invoice GRN Reference (Low — REVISED)

**Revisi:** `grn_customer_nomor` di invoice = nomor GRN **dari customer** (eksternal reference), bukan nomor dokumen GRN internal sistem. Harus tetap manual input. Internal Retur Barang (GRN) link ditampilkan terpisah.

| # | Task | Status | File |
|---|------|--------|------|
| RP-4.1 | **Auto-fill `grn_customer_nomor` dari chain** — saat POST invoice, cari GRN via DO→Retur→GRN chain, set `grn_customer_nomor` otomatis | ✅ Done | `invoice/route.ts`, `invoice/[id]/route.ts` |
| RP-4.2 | **Invoice detail — tampilkan internal GRN link** — tampilkan nomor Retur Barang (GRN) internal sebagai baris clickable link terpisah (read-only) | ✅ Done | `invoice/[id]/page.tsx` |
| RP-4.3 | **Revert: restore manual input `grn_customer_nomor`** — `grn_customer_nomor` harus manual input (nomor GRN eksternal customer). Kembalikan input field + save button | ⏳ Pending | `invoice/[id]/page.tsx`, `invoice/route.ts`, `invoice/[id]/route.ts` |

## 🔴 Gap Analysis — Retur Barang & Retur Penjualan Integration (H-1 s/d H-5)

### Critical Gaps — DO Detail Page Missing Retur/GRN Reference

#### H-1: DO Detail page — Retur Penjualan & GRN section

| # | Task | Status | File |
|---|------|--------|------|
| H-1.1 | **DO GET API — join retur_penjualan + grn_customer** — tambah subquery/join untuk fetch retur yang mereferensi DO ini + GRN terkait | ✅ Done | `delivery-order/[id]/route.ts` |
| H-1.2 | **DO Detail page — Retur Penjualan section** — tampilkan tabel/list retur penjualan yang mereferensi DO ini, dengan nomor retur (clickable link), status, total, tanggal | ✅ Done | `delivery-order/[id]/page.tsx` |
| H-1.3 | **DO Detail page — GRN Customer section** — tampilkan GRN yang terhubung via retur, dengan nomor GRN (clickable link), status, total barang | ✅ Done | `delivery-order/[id]/page.tsx` |

#### H-2: Retur Penjualan Detail — DO Reference

| # | Task | Status | File |
|---|------|--------|------|
| H-2.1 | **Retur Penjualan GET API — join delivery_order(nomor)** — tambah join untuk mendapatkan nomor DO yang direferensi | ✅ Done | `retur-penjualan/[id]/route.ts` |
| H-2.2 | **Retur Penjualan Detail — tampilkan DO reference sebagai clickable link** — ganti dari plain text `delivery_order_id` jadi link ke DO detail page | ✅ Done | `retur-penjualan/[id]/page.tsx` |

#### H-3: GRN Customer Detail — DO Reference jadi Clickable Link

| # | Task | Status | File |
|---|------|--------|------|
| H-3.1 | **GRN GET API — tambah delivery_order join via retur** — join grn → retur_penjualan → delivery_order untuk dapat nomor DO | ✅ Done | `grn-customer/[id]/route.ts` |
| H-3.2 | **GRN Detail — DO reference jadi link** — DO reference saat ini plain text; ubah jadi `<Link>` ke DO detail | ✅ Done | `grn-customer/[id]/page.tsx` |

#### H-4: Revisi Phase 4 — Manual Input grn_customer_nomor + Internal GRN Link

| # | Task | Status | File |
|---|------|--------|------|
| H-4.1 | **Revert POST API auto-fill** — hapus logic yang auto-set `grn_customer_nomor` dari chain internal di POST invoice | ✅ Done | `invoice/route.ts` |
| H-4.2 | **Revert GET API auto-fill** — hapus logic yang auto-fill `grn_customer_nomor` dari chain internal di GET invoice | ✅ Done | `invoice/[id]/route.ts` |
| H-4.3 | **Restore manual input `grn_customer_nomor`** — kembalikan input field + save button di invoice detail page | ✅ Done | `invoice/[id]/page.tsx` |
| H-4.4 | **Internal GRN link baris terpisah** — tampilkan baris "Retur Barang (GRN) Internal" dengan nomor GRN (clickable link) — auto-detected dari chain SO→DO→Retur→GRN | ✅ Done | `invoice/[id]/page.tsx` |

#### H-5: GRN Customer List API — Missing Retur Join

| # | Task | Status | File |
|---|------|--------|------|
| H-5.1 | **GRN list GET — tambah retur_penjualan!retur_penjualan_id(nomor) join** — supaya list page bisa tampilkan nomor retur referensi | ✅ Done | `grn-customer/route.ts` |
| H-5.2 | **GRN list page — kolom referensi retur** — tambah kolom "Ref. Retur" yang menampilkan nomor retur penjualan (clickable link) | ✅ Done | `grn-customer/page.tsx` |

### 🟡 Medium Priority Gaps (M-1 s/d M-5)

| # | Task | Status | File |
|---|------|--------|------|
| M-1 | **Retur Penjualan GET API — tambah `delivery_order!delivery_order_id(nomor)` join** untuk tampilkan DO reference di detail page (sekarang `delivery_order_id` UUID saja) | ✅ Done | `retur-penjualan/[id]/route.ts` |
| M-2 | **Retur Penjualan list API — tambah `delivery_order!delivery_order_id(nomor)` join** untuk tampilkan DO reference di tabel list | ✅ Done | `retur-penjualan/route.ts` |
| M-3 | **GRN Customer tambah page — retur_penjualan_id selector** — saat buat GRN manual, user bisa pilih retur penjualan (combobox filter) untuk auto-link, bukan cuma DO | ✅ Done | `grn-customer/tambah/page.tsx` |
| M-4 | **GRN Customer completed — validasi gudang_id** — API PUT `completed` harus cek `gudang_id` tidak null, jika null skip atau warning | ✅ Done | `grn-customer/[id]/route.ts` |
| M-5 | **all_documents view — GRN Customer & Retur Penjualan entries** — tambah virtual PDF entries untuk GRN Customer dan Retur Penjualan (migration baru) | ✅ Done | `0039_add_retur_penjualan_grn_customer_virtual_pdf.sql` |

### 🟢 Low Priority / Enhancement (L-1 s/d L-5)

| # | Task | Status | File |
|---|------|--------|------|
| L-1 | **Retur Penjualan list — kolom DO** — tampilkan nomor DO di tabel list retur penjualan | ✅ Done | `retur-penjualan/page.tsx` |
| L-2 | **GRN Customer list — kolom DO** — tampilkan nomor DO di tabel list GRN (resolve via retur → DO chain) | ✅ Done | `grn-customer/page.tsx` |
| L-3 | **Invoice list — kolom nomor GRN Customer** — tampilkan `grn_customer_nomor` di tabel list invoice | ✅ Done | `invoice/page.tsx` |
| L-4 | **Stok mutasi entry — tambah source reference** — saat GRN completed → stok mutasi, catat nomor GRN + retur penjualan di deskripsi | ✅ Done | `grn-customer/[id]/route.ts` |
| L-5 | **Loading states** — tambah loading skeleton di semua detail page retur, GRN, invoice chain | ✅ Done | `retur-penjualan/[id]/page.tsx`, `grn-customer/[id]/page.tsx`, `invoice/[id]/page.tsx`, `skeleton.tsx` |

## 🔵 NEW — Retur Penjualan & GRN Customer PDF Generation

### 📄 Phase 1 — PDF Components & Route Handlers

| # | Task | Status | File |
|---|------|--------|------|
| PDF-1 | **PDF component Retur Penjualan** — `createEl()` pattern, judul "Nota Retur", tampilkan harga satuan + subtotal (seperti invoice), header (company logo + info), double border, customer info, body teks, items table (No, Description, Unit, QTY, Harga, Subtotal, Keterangan), signature block (Yang Menyerahkan RRI + Yang Menerima Customer blank + stamp), footer (alamat, no hp, email, Page X of Y) | ✅ Done | `src/lib/pdf/retur-penjualan.ts` |
| PDF-2 | **PDF route handler Retur Penjualan** — `verifyAuth()` → fetch retur_penjualan + customer + delivery_order + items with barang snapshot + company settings → trace pricing via DO→SO→Invoice chain → `createEl()` → `toBlob()` → `NextResponse` with `Content-Length` | ✅ Done | `src/app/api/v1/retur-penjualan/[id]/pdf/route.ts` |
| PDF-3 | **PDF component GRN Customer** — `createEl()` pattern, judul "Goods Received Note", hanya qty (tanpa harga), header (company logo + info), double border, customer info + gudang tujuan, body teks, items table (No, Description, Unit, QTY, Keterangan), signature block (Yang Menyerahkan Gudang + Yang Mengetahui Customer blank + stamp), footer | ✅ Done | `src/lib/pdf/grn-customer.ts` |
| PDF-4 | **PDF route handler GRN Customer** — `verifyAuth()` → fetch grn_customer + customer + gudang + retur_penjualan + items → `createEl()` → `toBlob()` → `NextResponse` with `Content-Length` | ✅ Done | `src/app/api/v1/grn-customer/[id]/pdf/route.ts` |
| PDF-5 | **Migration — virtual PDF entries di all_documents view** — tambah `UNION ALL` untuk `pdf-retur-penjualan-{id}` dan `pdf-grn-customer-{id}`. Catatan: real uploaded documents (GRN Customer Eksternal dari customer) sudah ada di view via `grn_customer_document` join — virtual PDF ini untuk dokumen internal sistem (GRNC) | ✅ Done | `src/lib/db/migrations/0039_add_retur_penjualan_grn_customer_virtual_pdf.sql` |
| PDF-6 | **Update M-5: from ❌ Skipped to ✅ Done** — all_documents entries now exist via PDF-5 | ✅ Done | `ROADMAP.md` |

### 📐 Layout Specification

**Retur Penjualan PDF (Nota Retur):**
| Section | Konten |
|---------|--------|
| Document Info | No. Nota Retur, No. DO Ref. (atau "-"), Perihal: **Nota Retur**, Tanggal |
| Customer Info | Nama customer (auto-resolve dari chain) |
| Body | "Dengan ini kami memberitahukan bahwa barang-barang berikut telah diretur oleh customer:" |
| Items Table | No, Description, Unit, QTY, Harga Satuan, Subtotal, Keterangan |
| Signature | Yang Menyerahkan (RRI — tanda tangan + stempel) + Yang Menerima (Customer — blank) |

**GRN Customer PDF (Goods Received Note):**
| Section | Konten |
|---------|--------|
| Document Info | No. GRN, No. Retur Ref. (atau "-"), Perihal: **Goods Received Note**, Tanggal |
| Customer + Gudang | Customer name, Gudang tujuan |
| Body | "Dengan ini diterima barang-barang retur dari customer sebagai berikut:" |
| Items Table | No, Description, Unit, QTY, Keterangan (tanpa harga) |
| Signature | Yang Menyerahkan (Gudang — tanda tangan + stempel) + Yang Mengetahui (Customer — blank) |

### 🔧 Settings
- `15 items/page` — ROWS_PER_PAGE = 15 (adjustable after preview)
- Multi-page support (auto new page when items exceed ROWS_PER_PAGE)
- Font size 10pt/9pt, double border line (2px + 0.5px), company logo from `site_settings`

## 🟡 Import dari DI — Master Barang Enhancement

| # | Task | Status | File |
|---|------|--------|------|
| DI-1 | **Planning & Design** — Final plan documented | ✅ Done | `.opencode/plans/import-dari-di.md` |
| DI-2 | **DB Migration — `customer_prompt_di` table** — CREATE TABLE untuk simpan prompt DI per customer | ✅ Done | `0045_customer_prompt_di.sql` |
| DI-3 | **DB Migration — Tambah kolom ke `di`** — `nama_penandatangan`, `jabatan_penandatangan`, `revisi_ke`, `nomor_kontrak_customer` | ✅ Done | `0045_customer_prompt_di.sql` |
| DI-4 | **Drizzle Schema `customer-prompt-di.ts`** — schema TypeScript untuk `customer_prompt_di` | ✅ Done | `src/lib/db/schema/customer-prompt-di.ts` |
| DI-5 | **Update Drizzle Schema `di.ts`** — tambah field baru (penandatangan, revisi, nomor_kontrak) | ✅ Done | `src/lib/db/schema/di.ts` |
| DI-6 | **API: GET customer/[id]/prompt-di** — fetch prompt DI per customer | ✅ Done | `src/app/api/v1/master/customer/[id]/prompt-di/route.ts` |
| DI-7 | **API: POST import-from-di** — validasi JSON, auto-match kontrak, auto-create barang, create DI+items, upload PDF | ✅ Done | `src/app/api/v1/master/barang/import-from-di/route.ts` |
| DI-8 | **Frontend Tab "Import dari DI"** — dropdown customer, prompt, upload PDF, paste JSON, preview, import | ✅ Done | `src/app/dashboard/master/barang/tambah/page.tsx` |
| DI-9 | **Seed data prompt DI BJS** — isi `customer_prompt_di` untuk customer BJS | ✅ Done | Supabase — BJS aktif |
