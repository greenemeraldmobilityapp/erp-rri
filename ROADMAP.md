# ROADMAP — Perbaikan Modul Quotation & Negosiasi

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

## 📧 Future — Email Delivery (Gmail SMTP via Nodemailer)

| # | Task | Status | Priority |
|---|------|--------|----------|
| 1 | Install `nodemailer` + types | Pending | Medium |
| 2 | Buat utility `src/lib/utils/email.ts` — kirim email via Gmail SMTP | Pending | Medium |
| 3 | Buat email template untuk Quotation (body + subject auto) | Pending | Medium |
| 4 | Generate PDF Quotation + attach ke email saat Kirim | Pending | Medium |
| 5 | Simpan log pengiriman ke tabel `email_log` | Pending | Low |
| 6 | Tampilkan status email di halaman Quotation detail | Pending | Low |

**Setup:** App Password di Google Account → `GMAIL_USER` + `GMAIL_APP_PASSWORD` di env.

## 📄 Documentation

| # | Task | Status | File |
|---|------|--------|------|
| 7 | Update PRD.md — flow Quotation status + integrasi Negosiasi | ✅ Done | `PRD.md` |

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
| closed | (terminal) |
