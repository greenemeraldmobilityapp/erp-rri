# ROADMAP — Email & Mail Center (Brevo + Cloudflare)

> Menggantikan Nodemailer SMTP dengan Brevo REST API untuk pengiriman email transactional, ditambah Cloudflare Email Routing untuk inbound, dan Mail Center UI di dalam ERP.

---

## 🔧 Status Implementasi Saat Ini

### Infrastructure Active (Brevo + Mail Center)

| Komponen | Status | Lokasi |
|----------|--------|--------|
| `@getbrevo/brevo` SDK | ✅ Installed | `package.json` |
| `src/lib/email/brevo.ts` | ✅ Active | `sendEmailViaBrevo()` — Brevo transactional API |
| `src/lib/utils/email.ts` | ✅ Active | `sendEmail()` langsung Brevo (SMTP dihapus) |
| `email_log` table + Drizzle schema | ✅ Active | `src/lib/db/schema/email-log.ts` |
| Brevo config di `.env` | ✅ Active | `BREVO_API_KEY`, `BREVO_SENDER_NAME`, `BREVO_SENDER_EMAIL` |
| Email template engine | ✅ Active | `src/lib/email/templates/` (quotation, invoice, cpo, do) |
| Webhook endpoint | ✅ Active | `POST /api/v1/email/webhook` |
| Contact sync | ✅ Active | `POST /api/v1/email/sync-contacts` |
| Contact search | ✅ Active | `GET /api/v1/email/contacts/search?q=...` (Phase 10 MC-35) |
| Mail Center UI | ✅ Active | `/dashboard/email/inbox`, `sent`, `trash`, `templates`, `[id]` |
| Cloudflare R2 (Phase 11) | ✅ Active | `src/lib/email/r2-client.ts` — presigned URL, getFile, uploadFromWorker |
| Cloudflare Worker R2 binding | ✅ Active | `cloudflare-workers/email-worker.js` + `wrangler.toml` — R2.put() for inbound attachments |
| R2 env vars | ✅ Active | `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` in `.env` + Vercel |
| `email_attachments` table + Drizzle schema | ✅ Active | `src/lib/db/schema/email-attachments.ts` |
| Inbound API with attachment support | ✅ Active | `src/app/api/v1/email/inbound/route.ts` — Zod validation, upsert, first-received-wins |
| `message_id` unique index | ✅ Active | `idx_email_log_message_id_unique` — partial unique index (WHERE NOT NULL) |

### Points of Integration (Trigger email)

| Modul | File | Trigger |
|-------|------|---------|
| Quotation → sent | `quotation/[id]/status/route.ts` | Status → `sent` |
| Invoice → sent | `invoice/[id]/route.ts` (PUT) | Status → `sent` |
| Customer PO → confirmed | `customer-po/[id]/route.ts` (PUT) | Status → `confirmed` |
| Delivery Order → dikirim | `delivery-order/[id]/route.ts` (PUT) | Status → `dikirim` |

### Infrastructure Rencana (Domain & Infra)

| Komponen | Status | Keterangan |
|----------|--------|------------|
| Domain `pt-rri.com` | ✅ Purchased | Cloudflare Registrar |
| Cloudflare DNS | ✅ Active | A `erp` → `76.76.21.21` + MX/TXT for Email Routing |
| Cloudflare Email Routing | ✅ Active | Forward `marzuqi@pt-rri.com` → Gmail |
| Subdomain `erp.pt-rri.com` | ✅ Added to Vercel | `npx vercel domains add erp.pt-rri.com` — awaiting DNS verify |
| Email aktif | ✅ `marzuqi@pt-rri.com` | **`erp@pt-rri.com` tidak dipakai** — semua komunikasi via `marzuqi@pt-rri.com` |

---

## 🌐 Cloudflare Domain & DNS Setup

### Alur Pembelian & Aktivasi

```
1. Beli domain pt-rri.com di Cloudflare ($10.46) — via Jenius e-Card (clear 2x24 jam)
2. Cloudflare DNS otomatis aktif (Cloudflare Registrar)
3. Add A record erp → 76.76.21.21 (grey cloud / DNS only) untuk Vercel
4. Add domain erp.pt-rri.com di Vercel project → `npx vercel domains add erp.pt-rri.com`
5. Vercel auto-provision SSL untuk erp.pt-rri.com
6. Setup Cloudflare Email Routing → buat custom address, verify destination email
7. Add MX + TXT records yang diminta Email Routing ke DNS
```

### DNS Records (Cloudflare Dashboard → pt-rri.com → DNS)

Semua records **Grey Cloud** (DNS only — proxy off). Konfigurasi lengkap:

| Type | Name | Priority | Value | Fungsi |
|------|------|----------|-------|--------|
| A | `erp` | — | `76.76.21.21` | Vercel deployment |
| MX | `pt-rri.com` | 26 | `route1.mx.cloudflare.net.` | Email Routing inbound |
| MX | `pt-rri.com` | 77 | `route3.mx.cloudflare.net.` | Email Routing inbound |
| MX | `pt-rri.com` | 97 | `route2.mx.cloudflare.net.` | Email Routing inbound |
| TXT | `pt-rri.com` | — | `v=spf1 include:_spf.mx.cloudflare.net include:_spf.brevo.com ~all` | SPF authorization (Cloudflare + Brevo) |
| TXT | `pt-rri.com` | — | `brevo-code:70c2345bc4fcc1e006d9f6efea91a2a0` | Brevo domain verification |
| CNAME | `brevo1._domainkey` | — | `b1.pt-rri-com.dkim.brevo.com` | DKIM Brevo key 1 |
| CNAME | `brevo2._domainkey` | — | `b2.pt-rri-com.dkim.brevo.com` | DKIM Brevo key 2 (rotasi) |
| TXT | `_dmarc` | — | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` | DMARC monitoring |

**Brevo Sender terverifikasi:** `Muhammad Marzuqi<marzuqi@pt-rri.com>` — Verified

### Cloudflare Email Routing (Inbound)

```
Email Routing (gratis) + Email Worker:
  marzuqi@pt-rri.com → Email Worker → ERP API (email_log inbound) + Brevo relay → Gmail
  Worker script: cloudflare-workers/email-worker.js
  Deployment: Cloudflare Dashboard → Workers & Pages → Create Worker → Paste script
```

### Environment Variables

```bash
# Brevo
BREVO_API_KEY=xkeysib-xxxxxxxxxxxx
BREVO_SENDER_NAME="ERP RRI"  # <-- Fallback: sender name utama dari DB (penandatangan_nama + " - RRI")
BREVO_SENDER_EMAIL=marzuqi@pt-rri.com  # <-- DIUBAH: erp@pt-rri.com tidak dipakai

# Cloudflare
CLOUDFLARE_API_TOKEN=xxxxxxxxxxxx
CLOUDFLARE_ZONE_ID=xxxxxxxxxxxx

# Vercel
VERCEL_TOKEN=xxxxxxxxxxxx
VERCEL_PROJECT_ID=xxxxxxxxxxxx

# Cloudflare R2 (Phase 11)
R2_ENDPOINT=https://xxxxxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxx
R2_BUCKET=email-attachments

# Domain
NEXT_PUBLIC_DOMAIN=erp.pt-rri.com
NEXT_PUBLIC_EMAIL_DOMAIN=pt-rri.com
```

---

## 🗺️ Roadmap Pengembangan

### ✅ Phase 1 — Migrasi Infrastructure Brevo (High Priority) — SELESAI

| # | Task | Status | File |
|---|------|--------|------|
| BR-1 | **Install `@getbrevo/brevo`** — npm install | ✅ Done | `package.json` |
| BR-2 | **Buat `src/lib/email/brevo.ts`** — wrapper client Brevo API | ✅ Done | `src/lib/email/brevo.ts` |
| BR-3 | **Update `.env.example`** — tambah `BREVO_API_KEY`, `BREVO_SENDER_NAME`, `BREVO_SENDER_EMAIL` | ✅ Done | `.env.example` |
| BR-4 | **Update `src/lib/utils/email.ts`** — tambah `sendEmailViaBrevo()` | ✅ Done | `src/lib/utils/email.ts` |
| BR-5 | **Test mode** — test kirim email transaksional via Brevo | ✅ Done | - |
| BR-6 | **Set default provider ke Brevo** — `sendEmail()` langsung Brevo, SMTP dihapus | ✅ Done | `src/lib/utils/email.ts` |

### ✅ Phase 4 — Cloudflare & Domain Setup (Parallel) — SELESAI

| # | Task | Status | File |
|---|------|--------|------|
| CF-1 | **Beli domain `pt-rri.com`** — via Cloudflare Registrar, pakai Jenius e-Card ($10.46) | ✅ Done | Cloudflare Dashboard |
| CF-2 | **Setup Cloudflare DNS** — A record `erp` → `76.76.21.21` + MX/TXT untuk Email Routing | ✅ Done | Cloudflare DNS |
| CF-3 | **Add domain di Vercel** — `erp.pt-rri.com` → Vercel project → auto SSL | ✅ Done | `npx vercel domains add erp.pt-rri.com` |
| CF-4 | **Setup Cloudflare Email Routing** — `marzuqi@pt-rri.com` → forward ke Gmail | ✅ Done | Cloudflare Email |
| CF-5 | **Update env vars** — set `NEXT_PUBLIC_DOMAIN=erp.pt-rri.com` | ✅ Done | Vercel env + `.env` |

### ✅ Phase 2 — Fitur Email Lengkap (Medium Priority) — SELESAI

| # | Task | Status | File |
|---|------|--------|------|
| BR-7 | **Email template engine** — `src/lib/email/templates/` untuk Quotation, Invoice, CPO, DO | ✅ Done | `src/lib/email/templates/` (index, quotation, invoice, cpo, do) |
| BR-8 | **Attachment PDF** — attach PDF via `attachment` field Brevo (base64) | ✅ Done | `src/lib/utils/email.ts` (otomatis via `sendEmail()` base64 conversion) |
| BR-9 | **Webhook endpoint** — `POST /api/v1/email/webhook` untuk tracking events | ✅ Done | `src/app/api/v1/email/webhook/route.ts` |
| BR-10 | **Update `email_log` status via webhook** — `delivered`, `opened`, `bounced` di DB | ✅ Done | webhook handler + `email-log.ts` (update by `message_id`) |
| BR-11 | **Integration: Invoice → sent** — trigger email saat invoice status → `sent` | ✅ Done | `invoice/[id]/route.ts` (di PUT handler) |
| BR-12 | **Integration: CPO → confirmed** — trigger email notifikasi PO ke customer | ✅ Done | `customer-po/[id]/route.ts` (di PUT handler) |
| BR-13 | **Integration: DO → dikirim** — trigger email notifikasi pengiriman | ✅ Done | `delivery-order/[id]/route.ts` (di PUT handler) |

### ✅ Phase 5 — Mail Center UI (Medium Priority) — SELESAI

Halaman email client di dalam ERP layaknya Gmail/Outlook web.

| # | Task | Status | File | Design Alignment |
|---|------|--------|------|-----------------|
| MC-1 | **Sidebar menu** — tambah "Mail Center" sebagai standalone link antara Dashboard dan Master Data, icon `Mail` (Lucide) | ✅ Done | `sidebar-content.tsx` | Icon: `mr-3 h-4 w-4` rule §5; Active: `bg-primary text-primary-foreground` §3.17 |
| MC-2 | **Migration `email_log`** — tambah columns: `message_id`, `opened_at`, `clicked_at`, `delivered_at`, `bounce_type`, `inbound`, `from_email`, `from_name`, `cc`, `has_attachments`, `parent_id` (thread) | ✅ Done | `email-log.ts` + migration | 12 kolom baru via `drizzle/0050_add_email_log_columns.sql`, applied via Supabase API |
| MC-3 | **Inbox page** — `/dashboard/email/inbox` — split pane: sidebar folder + email list + detail. Unread dot, status badge, Skeleton loading | ✅ Done | `src/app/dashboard/email/inbox/page.tsx` | Subscribe `inbound=true`, order by `created_at` DESC |
| MC-4 | **Sent page** — `/dashboard/email/sent` — filter by status= sent/delivered/opened/clicked/bounced/failed | ✅ Done | `src/app/dashboard/email/sent/page.tsx` | Badge variant status; `in` filter |
| MC-5 | **Compose Sheet** — Sheet `side="right" sm:max-w-2xl` — form To, Subject, Body, Send/Save Draft/Discard, Zod validasi, react-hook-form | ✅ Done | `src/components/email/email-compose-sheet.tsx` | Sheet §3.11; Form §3.10; Button default gradient §3.1 |
| MC-6 | **Compose API** — `POST /api/v1/email/send` — kirim via Brevo API, simpan ke `email_log`, auth via token, validasi Zod | ✅ Done | `src/app/api/v1/email/send/route.ts` | Response `{ data: ... }`; uses Brevo transactional API |
| MC-7 | **Email detail page** — `/dashboard/email/[id]` — From/To/CC/Date, HTML body render, tracking timeline (Sent→Delivered→Opened→Clicked), Reply/Reply All/Forward/Delete actions | ✅ Done | `src/app/dashboard/email/[id]/page.tsx` | Lexend heading; Status timeline; Badge status; Card shadow §3.7 |
| MC-8 | **Draft page** — `/dashboard/email/draft` — list from `email_log` WHERE `status='draft'` | ✅ Done (Phase 10: dihapus, diganti Trash) | `src/app/dashboard/email/draft/page.tsx` (deleted Phase 10) | Skeleton loading; Empty state §14.2 |
| MC-9 | **Templates page** — `/dashboard/email/templates` — Card grid, Create Sheet with Tabs (Edit/Preview), Edit, Delete | ✅ Done | `src/app/dashboard/email/templates/page.tsx` | Card §3.7; Sheet §3.11; Tabs §3.12 |

### ⬜ Phase 7 — Inbound Email Pipeline & Mail Center Inbox (High Priority) — PENDING

Setup Cloudflare Email Worker untuk menerima inbound email, menyimpannya di `email_log` (Mail Center Inbox), dan relay ke Gmail via Brevo (fix Spam issue).

| # | Task | Status | File / Lokasi |
|---|------|--------|---------------|
| IN-1 | **API route `POST /api/v1/email/inbound`** — endpoint untuk menerima inbound email dari Cloudflare Worker, insert ke `email_log` dengan `inbound=true` | ✅ Done | `src/app/api/v1/email/inbound/route.ts` |
| IN-2 | **`EMAIL_INBOUND_SECRET`** — shared secret antara Worker dan ERP API | ✅ Done | `.env.example` + Vercel env |
| IN-3 | **Test manual insert** — insert record `inbound=true` langsung ke DB → verifikasi Mail Center Inbox muncul | ✅ Done | Supabase SQL: `INSERT INTO email_log (inbound=true, ...)` |
| IN-4 | **Cloudflare Email Worker script** — parse MIME, POST ke ERP API, relay via Brevo, fallback forward | ✅ Done | `cloudflare-workers/email-worker.js` |
| IN-5 | **Deploy Worker** — deploy via wrangler CLI + set 6 env vars | ✅ Done | `erp-rri-email-worker` di Cloudflare |
| IN-6 | **Hubungkan Email Routing → Worker** — ubah routing rule dari forward ke worker | ⬜ **KAMU** | Cloudflare Dashboard → Email Routing |
| IN-7 | **Test end-to-end** — kirim email dari Gmail → `marzuqi@pt-rri.com` → cek Inbox (Mail Center + Gmail) | ⬜ **KAMU** | Manual test |

---

### ✅ Phase 9 — Mail Center UI: Horizontal Tabs & CRUD Actions (SELESAI)

Perbaikan layout Mail Center + implementasi tombol Reply, Reply All, Forward, Delete.

| # | Task | Status | File |
|---|------|--------|------|
| MC-10 | **Email context provider** — `EmailProvider` + `useEmail()` hook untuk trigger compose dari mana saja | ✅ Done | `src/components/email/email-context.tsx` |
| MC-11 | **Horizontal tabs** — ganti sidebar vertical dengan tabs di bawah header (Inbox, Sent, Draft, Templates) | ✅ Done | `src/components/email/email-tabs.tsx` |
| MC-12 | **Fix layout** — hapus nested `max-w-7xl`, hapus email sidebar (`w-56`), layout sekarang stabil | ✅ Done | `src/app/dashboard/email/layout.tsx` |
| MC-13 | **Reply** — buka compose dengan `to` = pengirim asli, subject = `Re: ...`, body quote original | ✅ Done | `src/app/dashboard/email/[id]/page.tsx` |
| MC-14 | **Reply All** — buka compose dengan data reply + CC | ✅ Done | `src/app/dashboard/email/[id]/page.tsx` |
| MC-15 | **Forward** — buka compose dengan subject = `Fwd: ...`, body quote + header forward | ✅ Done | `src/app/dashboard/email/[id]/page.tsx` |
| MC-16 | **Delete dengan konfirmasi** — `AlertDialog` popup konfirmasi, panggil `DELETE /api/v1/email/[id]`, redirect back | ✅ Done | `src/app/dashboard/email/[id]/page.tsx` + `src/app/api/v1/email/[id]/route.ts` |
| MC-17 | **Hapus `email-sidebar.tsx`** — tidak dipakai lagi, diganti tabs horizontal | ✅ Done | `src/components/email/email-sidebar.tsx` (di-archive) |

### ✅ Phase 10 — Mail Center Enhancement: Design, Trash & Bugfix (SELESAI)

Perbaikan UI/UX Mail Center: warna tombol pakai `bg-primary`, redesign compose modal premium, hapus fitur Draft ganti Trash (soft-delete), redesign tabs dengan badge unread, fix error `[object Object]`.

| # | Task | Status | File |
|---|------|--------|------|
| MC-18 | **Utility class `btn-primary-gradient`** — pakai `var(--primary)`, auto-switch light/dark, ganti semua hardcoded `#0000FF` di tombol Mail Center | ✅ Done | `src/app/globals.css` |
| MC-19 | **Redesign compose sheet premium** — header kontekstual, banner reply/fwd, CC/BCC collapsible, attachment upload, signature area, button bar, animasi | ✅ Done | `src/components/email/email-compose-sheet.tsx` |
| MC-20 | **Tab redesign** — active tab `bg-primary text-primary-foreground rounded-t-lg` + pulse animasi; hover `bg-primary/10` | ✅ Done | `src/components/email/email-tabs.tsx` |
| MC-21 | **Unread badge (Inbox)** — count email inbound `opened_at IS NULL`, tampil badge merah `bg-destructive` | ✅ Done | `src/components/email/email-tabs.tsx` |
| MC-22 | **Refresh button** — ikon `RefreshCw` di kanan tabs untuk reload count | ✅ Done | `src/components/email/email-tabs.tsx` |
| MC-23 | **Hapus fitur Draft** — tab Draft dihapus, Save Draft di compose dihapus, file `draft/page.tsx` dihapus | ✅ Done | `src/app/dashboard/email/draft/page.tsx` (deleted), `src/components/email/email-compose-sheet.tsx` |
| MC-24 | **Trash (soft-delete)** — ganti hard-delete dengan `status='trashed'`; API `DELETE /api/v1/email/[id]` → UPDATE | ✅ Done | `src/app/api/v1/email/[id]/route.ts` |
| MC-25 | **Restore API** — `POST /api/v1/email/[id]/restore` → set `status='sent'` (kembalikan ke Inbox/Sent) | ✅ Done | `src/app/api/v1/email/[id]/restore/route.ts` |
| MC-26 | **Purge API** — `DELETE /api/v1/email/[id]/purge` → hard-delete permanen (hanya untuk email di Trash) | ✅ Done | `src/app/api/v1/email/[id]/purge/route.ts` |
| MC-27 | **Trash page** — `/dashboard/email/trash` — list email `status='trashed'` | ✅ Done | `src/app/dashboard/email/trash/page.tsx` |
| MC-28 | **Filter trashed** — Inbox & Sent exclude `status='trashed'` | ✅ Done | `src/app/dashboard/email/inbox/page.tsx`, `sent/page.tsx` |
| MC-29 | **Badge trashed di list** — `variant="outline"` untuk status trashed | ✅ Done | `src/components/email/email-list.tsx` |
| MC-30 | **Detail page trash mode** — tampilkan Restore + Delete Permanently untuk email di Trash; Move to Trash untuk non-trashed | ✅ Done | `src/app/dashboard/email/[id]/page.tsx` |
| MC-31 | **Fix `[object Object]`** — perbaiki error handler API call: `typeof err.error === 'string'` | ✅ Done | `src/app/dashboard/email/[id]/page.tsx` |
| MC-32 | **Hapus tombol `type="submit"`** — ganti `type="button"` pada Send button (di luar `<form>`) | ✅ Done | `src/components/email/email-compose-sheet.tsx` |
| MC-33 | **Trash count badge** — jumlah email di Trash (badge abu-abu `bg-muted-foreground`) | ✅ Done | `src/components/email/email-tabs.tsx` |
| MC-34 | **Rename Archive → Trash** — rename folder, tab, page, API status, UI labels dari "Archive" ke "Trash" | ✅ Done | Semua file (email-tabs, email-list, [id]/page, api routes, etc.) |
| MC-35 | **Autocomplete To dari DB customer** — API search customer_pic + Command dialog di compose sheet | ✅ Done | `src/app/api/v1/email/contacts/search/route.ts` + `src/components/email/email-compose-sheet.tsx` |
| MC-36 | **CMD+K global search mencakup email** — email_log ditambahkan ke scope POST /api/v1/search | ✅ Done | `src/app/api/v1/search/route.ts` + `src/components/global-search.tsx` |
| MC-37 | **Inline search bar inbox** — filter email by subject/pengirim client-side di inbox page | ✅ Done | `src/app/dashboard/email/inbox/page.tsx` |
| MC-38 | **Pagination / Load More** — range-based pagination + Load More button di inbox, sent, trash | ✅ Done | `src/app/dashboard/email/inbox/page.tsx`, `sent/page.tsx`, `trash/page.tsx` |
| MC-39 | **Templates DB + CRUD API** — email_templates table, full CRUD API (POST/GET/PUT/DELETE) | ✅ Done | `src/lib/db/schema/email-templates.ts`, `src/app/api/v1/email/templates/route.ts`, `templates/[id]/route.ts` |
| MC-40 | **Templates page persisted** — ganti local state dengan API fetch, tambah "Use" button | ✅ Done | `src/app/dashboard/email/templates/page.tsx` |
| MC-41 | **Search bar di sent page** — filter email by subject/penerima client-side, Load More hidden saat search | ✅ Done | `src/app/dashboard/email/sent/page.tsx` |
| MC-42 | **Search bar di trash page** — filter email by subject/pengirim client-side, Load More hidden saat search | ✅ Done | `src/app/dashboard/email/trash/page.tsx` |
| MC-43 | **Search bar di templates page** — filter template by nama client-side | ✅ Done | `src/app/dashboard/email/templates/page.tsx` |

### ✅ Phase 11 — Cloudflare R2 Attachment Storage (High Priority) — SELESAI

Menyimpan file attachment email (outbound compose & inbound) ke Cloudflare R2 (free tier 10 GB). Menggunakan Presigned URL untuk upload langsung dari client (bypass Vercel 4.5 MB body limit). File >7 MB di-outbound dikirim sebagai link download, bukan attachment base64.

| # | Task | Status | File / Lokasi |
|---|------|--------|---------------|
| R2-1 | **Buat R2 bucket** `email-attachments` di Cloudflare Dashboard | ✅ Done | Cloudflare Dashboard → R2 → Create Bucket |
| R2-2 | **Buat R2 API token** — Access Key ID + Secret Access Key untuk S3-compatible API | ✅ Done | Cloudflare Dashboard → R2 → Manage R2 API Tokens |
| R2-3 | **Install `@aws-sdk/client-s3`** — S3 SDK untuk R2 | ✅ Done | `npm install @aws-sdk/client-s3` |
| R2-4 | **Buat `src/lib/email/r2-client.ts`** — wrapper: `getPresignedUrl()`, `uploadFromWorker()`, `getFile()`, `deleteFile()` | ✅ Done | `src/lib/email/r2-client.ts` |
| R2-5 | **Buat `email_attachments` table** — Drizzle schema + migration (id, email_id, file_name, file_url, file_size, mime_type, created_at) | ✅ Done | `src/lib/db/schema/email-attachments.ts`, `drizzle/0053_add_email_attachments_table.sql` |
| R2-6 | **Tambah env vars** — `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | ✅ Done | `.env.example` + Vercel env vars |
| R2-7 | **API `GET /api/v1/email/attachments/upload-url`** — generate dan return presigned URL untuk upload langsung dari client ke R2 | ✅ Done | `src/app/api/v1/email/attachments/upload-url/route.ts` |
| R2-8 | **Update Compose Sheet** — upload file langsung ke R2 via presigned URL (bypass Vercel), tampilkan uploading spinner, kirim dengan reference file ID | ✅ Done | `src/components/email/email-compose-sheet.tsx` |
| R2-9 | **Update Send API** — terima `attachmentIds`, ambil file dari R2, kirim via Brevo (base64 untuk file ≤7 MB, atau link download untuk >7 MB) | ✅ Done | `src/app/api/v1/email/send/route.ts` |
| R2-10 | **API `GET /api/v1/email/attachments/[id]`** — download file attachment dari R2 | ✅ Done | `src/app/api/v1/email/attachments/[id]/route.ts` |
| R2-11 | **Update Email Detail** — tampilkan daftar attachment: Paperclip icon, nama, size, tombol download | ✅ Done | `src/app/dashboard/email/[id]/page.tsx` |
| R2-12 | **Update Email Worker** — parse MIME attachment, upload directly to R2 (via Worker R2 binding), send metadata to inbound API | ✅ Done | `cloudflare-workers/email-worker.js`, `wrangler.toml` |
| R2-13 | **Update Inbound API** — accept `attachments: Array<{key, fileName, fileSize, mimeType}>`, save to `email_attachments` table, upsert email_log (first-received wins) | ✅ Done | `src/app/api/v1/email/inbound/route.ts` |
| R2-14 | **Update ROADMAP + AGENTS.md** — storage path convention, env vars, R2 client status | ✅ Done | `ROADMAP-BREVO.md`, `AGENTS.md` |

**Storage Path Convention:**
```
email-attachments/{emailId}/{uuid}-{originalFileName}
```

**File Size Strategy (Outbound):**
| Ukuran File | Perlakuan |
|-------------|-----------|
| ≤7 MB | Upload ke R2 → ambil dari R2 → base64 → kirim via Brevo sebagai attachment |
| >7 MB | Upload ke R2 → kirim email berisi link download (Brevo tidak support base64 >~10 MB) |

**Free Tier Check:**
- Storage: 10 GB gratis → ~5.000–50.000 attachment (rata-rata 0.1–2 MB per file)
- Class A (write): 1 juta/bulan → paling 500 upload/bulan
- Class B (read): 10 juta/bulan → paling 1.000 download/bulan
- Egress: **$0 selamanya**

---

### ✅ Phase 8 — Email Body Redesign & Public PDF Link (SELESAI)

| # | Task | Status | File |
|---|------|--------|------|
| ED-6 | **Add `email_access_token` + expiry ke `quotation`** — migration + drizzle schema | ✅ Done | `drizzle/0051_add_quotation_email_access_token.sql` |
| ED-7 | **Public PDF route** — `/api/v1/quotation/public/[token]/pdf` tanpa auth, validasi token + expiry 14 hari | ✅ Done | `src/app/api/v1/quotation/public/[token]/pdf/route.ts` |
| ED-8 | **Shared PDF generator** — extract logic dari route ke `generateQuotationPdfBlob()` | ✅ Done | `src/lib/pdf/generate-quotation-pdf.ts` |
| ED-9 | **Sender name dinamis** — ambil dari `penandatangan_nama` di DB, format `"{nama} - RRI"` | ✅ Done | `src/lib/email/brevo.ts` |
| ED-10 | **Footer email baru** — ambil data dari DB, tampilkan company_nama, no_hp, email, website | ✅ Done | `src/lib/email/templates/index.ts` |
| ED-11 | **Body email quotation baru** — tambah No. Ref RFQ, link PDF, expiry note 14 hari, sign-off dengan penandatangan_nama + no_hp | ✅ Done | `src/lib/email/templates/quotation.ts` |
| ED-12 | **Token generation di status route** — saat status → `sent`, generate UUID token + expiry, simpan ke DB, kirim email dengan public PDF link | ✅ Done | `src/app/api/v1/quotation/[id]/status/route.ts` |

### 📋 Panduan 4 Langkah — Yang Harus Kamu Lakukan

#### 🔧 Langkah 1: Generate Secret & Set Vercel Env

Buka terminal di laptop, jalankan:

```bash
# 1a. Generate secret key
openssl rand -hex 32
```
Output contoh: `a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890`

**Copy output-nya**, lalu:

```bash
# 1b. Set ke Vercel environment
npx vercel env add EMAIL_INBOUND_SECRET
# Paste secret yang tadi, pilih Production + Preview + Development
```

> **Note**: Gunakan terminal yang sudah `npx vercel login`. Pastikan `EMAIL_INBOUND_SECRET` sudah ada di Vercel env sebelum lanjut.

---

#### 🌩️ Langkah 2: Deploy Worker di Cloudflare Dashboard

1. Buka https://dash.cloudflare.com → **Workers & Pages** → **Create Worker**
2. **Hapus** semua template kode yang ada
3. **Buka file** `cloudflare-workers/email-worker.js` di project ini → **copy seluruh isinya**
4. **Paste** ke editor Cloudflare Dashboard
5. Klik **Deploy** (tombol biru)
6. Setelah deploy, buka tab **Settings → Variables**

Tambahkan environment variables satu per satu:

| **Variable** | **Value** | **Contoh** |
|---|---|---|
| `ERP_INBOUND_URL` | `https://erp-rri.vercel.app/api/v1/email/inbound` | — |
| `ERP_INBOUND_SECRET` | Isi dengan secret dari Langkah 1 | `a1b2c3d4...` |
| `BREVO_API_KEY` | Buka Brevo Dashboard → Settings → API Keys → copy `xkeysib-...` | `xkeysib-xxxxx` |
| `FORWARD_TO_EMAIL` | Gmail tujuan | `mazzjoeq@gmail.com` |
| `SENDER_EMAIL` | Sender terverifikasi | `marzuqi@pt-rri.com` |
| `SENDER_NAME` | Nama pengirim | `ERP RRI` |

**Save** setelah semua terisi.

> **Verifikasi**: Buka tab **Preview** → harusnya muncul "Worker deployed successfully".

---

#### 🔗 Langkah 3: Hubungkan Email Routing ke Worker

1. Di Cloudflare Dashboard, buka **Email Routing → Routing Rules**
2. Akan ada rule yang sudah ada: `marzuqi@pt-rri.com` → forward ke Gmail
3. Klik **Edit** pada rule tersebut (icon pensil)
4. Ubah **Action** dari `Forward to email` → **Send to Worker**
5. Pilih Worker yang baru saja dibuat (nama Worker dari Langkah 2)
6. Klik **Save**

Sekarang semua email ke `marzuqi@pt-rri.com` akan masuk ke Worker, bukan langsung forward ke Gmail.

---

#### ✅ Langkah 4: Test End-to-End

**Test dari Gmail external:**
1. Buka Gmail lain (misal: `bee7rafiud@gmail.com`)
2. Tulis email baru ke: **marzuqi@pt-rri.com**
3. Subject: "Test inbound worker"
4. Kirim

**Cek hasil:**
- Buka **http://localhost:3000/dashboard/email/inbox** — email harus muncul di Mail Center Inbox
- Buka **Gmail** `mazzjoeq@gmail.com` — email harus masuk **Inbox** (bukan Spam)
- Kalau masih masuk Spam → berarti Brevo relay gagal, cek log Worker di Cloudflare Dashboard (tab **Logs**)

> **Catatan**: Brevo free plan cuma 300 email/hari. Relay inbound juga terhitung kuota.

### 🔄 Phase 6 — Email Deliverability & DNS Authentication (High Priority) — IN PROGRESS

Setup SPF, DKIM, dan DMARC agar email dari domain `pt-rri.com` tidak masuk Spam.

| # | Task | Status | File / Lokasi |
|---|------|--------|---------------|
| ED-1 | **Update SPF record** — tambah `include:_spf.brevo.com` ke TXT `pt-rri.com` | ✅ Done | Cloudflare DNS |
| ED-2 | **DKIM Brevo** — CNAME `brevo1._domainkey` + `brevo2._domainkey` via Brevo managed DKIM | ✅ Done | Cloudflare DNS + Brevo Dashboard |
| ED-3 | **DMARC record** — `_dmarc` → `"v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com"` | ✅ Done | Cloudflare DNS |
| ED-4 | **Verify sender di Brevo** — `Muhammad Marzuqi<marzuqi@pt-rri.com>` verified | ✅ Done | Brevo Dashboard → Settings → Senders |
| ED-5 | **Test kirim ulang** — dari Gmail `bee7rafiud@gmail.com` → `marzuqi@pt-rri.com` → cek Inbox | ⬜ **KAMU** | Manual test |

### ✅ Phase 3 — Enhancement & Marketing (Low Priority) — SELESAI

| # | Task | Status | File |
|---|------|--------|------|
| BR-14 | **Contact management** — sync customer contacts ke Brevo via `/v3/contacts` | ✅ Done | `src/lib/email/contacts.ts` + `POST /api/v1/email/sync-contacts` |
| BR-15 | **Email template di dashboard Brevo** — dukungan `templateId` + API list templates | ✅ Done | `GET /api/v1/email/templates` + `sendEmail()` sudah support `templateId` |
| BR-16 | **Campaign & newsletter** — API untuk list kampanye Brevo | ✅ Done | `GET /api/v1/email/campaigns` |
| BR-17 | **UTM & tracking analytics** — UTM params utility + stats API | ✅ Done | `src/lib/email/utm.ts` + `GET /api/v1/email/stats` |

---

## 🎨 Mail Center UI Design System (DESIGN_SYSTEM.md Alignment)

### Layout Architecture (Gmail-like Split Pane)

```
┌────────────────────────────────────────────────────────────┐
│  Top Bar: Search (CMD+K) + Compose Button + Filter + Avatar │
├────────────┬──────────────────────────┬─────────────────────┤
│ FOLDER     │  EMAIL LIST              │  EMAIL DETAIL       │
│ SIDEBAR    │  (Table)                 │  (Card)             │
│ (w-64)     │  (flex-1)                │  (flex-1)           │
│            │                          │                     │
│ 📥 Inbox   │ Subject │ From │ Date    │ From / To / Subject │
│ ⭐ Starred │ ─────────────────────── │ Body (HTML render) │
│ ✉️ Sent    │ Email 1                  │ Attachments list    │
│ 📝 Draft   │ Email 2  (selected)      │ Tracking timeline   │
│ 🗂️ Template│ Email 3 ──► (preview)   │ Reply compose       │
│ 🚫 Spam    │ Email 4                  │ (inline textarea)   │
│ 🗑️ Trash   │                          │                     │
├────────────┴──────────────────────────┴─────────────────────┤
│  Status Bar: Inbox (12) / Sent (45) / Draft (2)             │
└──────────────────────────────────────────────────────────────┘
```

### Color Alignment — Wajib CSS Variables (No Hardcoded)

| Elemen Mail Center | Token / Kelas CSS | Source DS |
|---|---|---|
| Page container | `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8` | §13.1 Standard Padding |
| Page header sticky | `sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md` | §7 PageHeader |
| Folder sidebar | `bg-card border-border rounded-xl` — sama seperti Card | §3.7 Card |
| Active folder | `bg-primary text-primary-foreground font-medium` | §3.17 Sidebar active |
| Folder count badge | `bg-primary/10 text-primary text-xs font-semibold rounded-full px-2 py-0.5` | Mirip §7 LuxuryMetricCard icon wrapper |
| Email list header (TableHead) | `bg-primary/5 text-primary font-medium text-sm` | §3.5 TableHead |
| Selected email row | `bg-primary/5 border-l-2 border-primary` | Same pattern as TableHead bg |
| Hover email row | `hover:bg-muted/40 transition-colors duration-200` | §14.1 TableRow hover |
| Unread dot indicator | `w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5` | Primary biru minimal |
| Email subject (unread) | `font-heading font-semibold text-foreground` | §4 Card title |
| Email subject (read) | `font-heading font-medium text-foreground` | §4 font-heading |
| Preview text | `text-sm text-muted-foreground truncate` | §4 Muted |
| Timestamp | `text-xs text-muted-foreground shrink-0` | §4 Muted + Label |
| Folder label | `text-xs font-semibold uppercase tracking-wider text-muted-foreground` | §4 Label |
| Compose button | `bg-primary` via `btn-primary-gradient` utility class (auto light/dark via CSS vars) | §3.1 Button default Luxury |
| Card container | `shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_15px_-3px_rgba(0,0,0,0.01)] border-border` | §3.7 Luxury Card |
| Status Delivered | `text-success` (#22C55E) | §2 Khusus status |
| Status Bounced | `text-destructive` (#EF4444) | §2 bg-destructive |
| Status Pending | `text-warning` (#F59E0B) | §2 Khusus status |
| Silver accent | `bg-accent` (#A1A1AA) — premium highlight | §2 bg-accent |
| Empty state | `text-center py-12 border border-dashed rounded-lg bg-muted/20` | §14.2 Empty State |
| Compose Sheet | `Sheet side="right" sm:max-w-2xl` | §3.11 Sheet |
| Skeleton loading | `Skeleton h-5 w-1/3 rounded-md` (animate-pulse mewah) | §15.1 Skeleton |

### Typography Alignment

| Elemen Mail Center | Font | Class | Source DS |
|---|---|---|---|
| Page title "Mail Center" | **Lexend** | `font-heading font-bold tracking-tight text-2xl` | §4 Page title |
| Email subject (list + detail) | **Lexend** | `font-heading font-semibold tracking-tight` | §4 Card title |
| Sender name | **Lexend** | `font-heading font-medium` | §4 |
| Email body preview | **Source Sans 3** | `text-sm text-muted-foreground truncate` | §4 Muted |
| Timestamp | **Source Sans 3** | `text-xs text-muted-foreground` | §4 |
| Folder label | **Source Sans 3** | `text-xs font-semibold uppercase tracking-wider text-muted-foreground` | §4 Label |
| Table head columns | **Source Sans 3** | `text-sm font-medium bg-primary/5 text-primary` | §4 Table Head |
| Compose body text | **Source Sans 3** | `text-sm leading-relaxed` | §4 Body |
| Email detail body | **Source Sans 3** | `text-sm leading-relaxed` | §4 Body |

### Component Mapping — shadcn Yang Sudah Ada

| Kebutuhan Mail Center | shadcn Component | Aturan dari DESIGN_SYSTEM.md |
|---|---|---|
| Folder navigasi (sidebar mail) | `SidebarProvider > Sidebar > SidebarContent` | §3.17 — Pakai Sidebar, jangan custom |
| Floating compose | `Sheet side="right" sm:max-w-2xl` | §3.11 — Pakai Sheet, jangan Dialog |
| Email list table | `Table > TableHeader > TableBody > TableRow > TableCell` | §3.5 + §14.1 — Pakai Table, jangan raw `<table>` |
| Form compose (To, Subject, Body) | `Form + FormField + FormItem + FormLabel + FormControl + FormMessage` | §3.10 + §11.1 — Pakai react-hook-form + Zod |
| Input fields | `Input`, `Textarea` | §3.2 — Pakai Input, jangan raw `<input>` |
| Status labels | `Badge` dengan variant `default / destructive / secondary / outline` | §3.6 — Pakai Badge, jangan bg-green-100 |
| Action menu per email | `DropdownMenu > DropdownMenuItem` | §3.14 — Pakai DropdownMenu, jangan Popover |
| Delete confirmation | `AlertDialog` | §3.13 — Pakai AlertDialog, jangan Dialog biasa |
| Search (CMD+K) | `Command > CommandInput > CommandList > CommandGroup > CommandItem` | §3.16 — Pakai Command |
| Loading state | `Skeleton` (animate-pulse) | §15.1 — Pakai Skeleton, jangan spinner |
| Toast notification | `toast` from `sonner`, `Toaster` di root layout | §12 — Pakai sonner |
| Avatar sender | `Avatar > AvatarFallback` | shadcn/ui |
| Scrollable list/detail | `ScrollArea` | shadcn/ui |
| Tab navigation (mobile) | `Tabs > TabsList > TabsTrigger > TabsContent` | §3.12 — Pakai Tabs, jangan custom |
| Tooltip icon | `Tooltip + TooltipProvider` | §3.15 — Pakai Tooltip, jangan title attr |
| Empty state | Pattern: `border border-dashed rounded-lg bg-muted/20` | §14.2 |
| Metric count | `LuxuryMetricCard` atau adaptasi: `bg-primary/10 p-2 rounded-full` | §7 LuxuryMetricCard |

### Folder Navigator (Sidebar Mail)

```
📥 Inbox          (12)
  ✉️ Sent          (45)
  🗄️ Archive       (2)
  🗂️ Templates    (6)
```

- Icons: **Lucide** — `Inbox`, `Send`, `Trash2`, `File`
- [Phase 10] Tab Draft dihapus, diganti Trash (soft-delete)
- Ikon berjarak: `mr-3 h-4 w-4 text-muted-foreground` (active: `text-primary-foreground`)
- Active state: `bg-primary text-primary-foreground` (biru #0000FF)
- Count: `ml-auto bg-primary/10 text-primary text-xs font-semibold rounded-full px-2 py-0.5` (active: `bg-white/20 text-primary-foreground`)
- Aturan 60-30-10: sidebar adalah bagian dari 30% struktur, primary hanya muncul di item aktif (10%)

### Compose Email — Sheet Design (Phase 10 Redesign)

- `Sheet` slide dari kanan: `side="right" className="sm:max-w-2xl"`
- `SheetHeader` + `SheetTitle` dinamis: "Compose Email" (Reply: `Re: subject`, Forward: `Fwd: subject`)
- Banner untuk Reply/Forward — quote original message, avatar sender, timestamp
- Form fields:
  - **To:** `Input` + `Command` dialog untuk autocomplete dari contact/customer DB
  - **CC/BCC:** toggle expand link (collapsible `AnimatePresence`)
  - **Subject:** `Input` dengan placeholder
  - **Body:** `Textarea` (atau rich text editor ringan, Phase 5 enhancement)
   - **Attachments:** Upload button → minta presigned URL dari API → upload langsung ke Cloudflare R2 (bypass Vercel body limit) → tampilkan list dengan nama, size, remove button. File >7 MB dikirim sebagai link download, ≤7 MB sebagai base64 attachment via Brevo
  - **Signature:** Area signature otomatis
- Action buttons:
  - **Send** — `Button variant="default"` dengan `bg-primary` gradient (loading state + disabled)
  - **Discard** — `Button variant="ghost" text-destructive hover:text-destructive` + AlertDialog confirm
- [Phase 10] Save Draft dihapus — fitur Draft diganti Trash
- [Phase 10 MC-35] Tombol **BookUser** di sebelah kanan input "To" → buka `Command` dialog → search kontak dari DB (`customer_pic`) → select → isi otomatis `toEmail` + `toNama`
- Validasi: Zod schema → `react-hook-form`

### Email Detail View

- Panel kanan (atau Sheet di mobile):
  - **Header:** Avatar sender, From, To, Date, Subject (Lexend bold)
  - **Actions:** Reply, Reply All, Forward, Trash/Restore/Delete Permanently (icon buttons)
  - **Body:** Rendered HTML (iframe sandbox atau div sanitized)
  - **Attachments:** List cards — icon Paperclip, filename, size, Download button
  - **Tracking Timeline:** Timeline pattern (vertical) — Sent → Delivered → Opened → Clicked (dengan timestamp)
  - **Reply:** Textarea inline + Send button di bagian bawah
- [Phase 10] Trash (soft-delete) → `status='trashed'`; Restore → `status='sent'`; Purge → hard-delete
- [Phase 10] Trashed email → tampilkan Restore + Delete Permanently; non-trashed → Move to Trash

---

## 🏗️ Architecture & File Structure

```
cloudflare-workers/
├── email-worker.js           # Cloudflare Email Worker (Phase 7 + R2-12 inbound attachment upload)
├── wrangler.toml             # Worker config with R2 bucket binding (Phase 11 R2-12)
└── README.md                 # Deployment instructions (Phase 7)

src/lib/email/
├── brevo.ts                  # Brevo client wrapper (Phase 1)
├── contacts.ts               # Contact sync to Brevo (Phase 3)
├── utm.ts                    # UTM parameter utility (Phase 3)
├── r2-client.ts              # R2 S3 wrapper — getPresignedUrl, getFile, uploadFromWorker, deleteFile (Phase 11 ✅)
├── types.ts                  # Shared email types (SendEmailParams, EmailLog, etc.)
├── templates/
│   ├── index.ts               # Layout + helpers (Phase 2)
│   ├── quotation.ts           # Template Quotation email (Phase 2)
│   ├── invoice.ts             # Template Invoice email (Phase 2)
│   ├── cpo.ts                 # Template CPO notification (Phase 2)
│   └── do.ts                  # Template DO notification (Phase 2)
└── webhook.ts                 # Webhook payload types & handler (Phase 2)

src/app/api/v1/email/
├── [id]/
│   ├── route.ts               # DELETE /api/v1/email/[id] → soft-delete (trash) (Phase 10)
│   ├── restore/
│   │   └── route.ts           # POST /api/v1/email/[id]/restore (Phase 10)
│   └── purge/
│       └── route.ts           # DELETE /api/v1/email/[id]/purge (Phase 10)
├── inbound/
│   └── route.ts               # POST /api/v1/email/inbound (Phase 7)
├── send/
│   └── route.ts               # POST /api/v1/email/send (Phase 5)
├── webhook/
│   └── route.ts               # POST /api/v1/email/webhook (Phase 2)
├── sync-contacts/
│   └── route.ts               # POST /api/v1/email/sync-contacts (Phase 3)
├── contacts/
│   └── search/
│       └── route.ts           # GET /api/v1/email/contacts/search?q=... (Phase 10 MC-35)
├── attachments/
│   ├── upload-url/
│   │   └── route.ts           # GET /api/v1/email/attachments/upload-url (Phase 11 ✅)
│   └── [id]/
│       └── route.ts           # GET /api/v1/email/attachments/[id] (Phase 11 ✅)
├── brevo-templates/
│   └── route.ts               # GET /api/v1/email/brevo-templates (moved from templates/, Phase 3)
├── templates/
│   ├── route.ts               # GET+POST /api/v1/email/templates (local CRUD, Phase 10 MC-39)
│   └── [id]/
│       └── route.ts           # PUT+DELETE /api/v1/email/templates/[id] (Phase 10 MC-39)
├── campaigns/
│   └── route.ts               # GET /api/v1/email/campaigns (Phase 3)
└── stats/
    └── route.ts               # GET /api/v1/email/stats (Phase 3)

src/components/email/
├── email-context.tsx           # EmailProvider + useEmail() hook (Phase 9)
├── email-tabs.tsx              # Horizontal tab navigation (Phase 9)
├── email-list.tsx              # Email list component (shared by inbox/sent/draft)
└── email-compose-sheet.tsx     # Compose email Sheet (reusable)
# Detail panel, status badge, tracking timeline are inlined in page components

src/app/dashboard/email/
├── layout.tsx                  # Layout: header + horizontal tabs + content (Phase 9)
├── page.tsx                    # Redirect to /dashboard/email/inbox
├── inbox/
│   └── page.tsx                # Inbox page (Phase 5)
├── sent/
│   └── page.tsx                # Sent page (Phase 5)
├── trash/
│   └── page.tsx                # Trash page (Phase 10)
├── templates/
│   └── page.tsx                # Templates page (Phase 5)
├── draft/                      # [Phase 10] Dihapus — fitur Draft diganti Trash
└── [id]/
    └── page.tsx                # Email detail page (Phase 5 + Phase 9 CRUD + Phase 10 Trash/Restore/Purge)
```

---

## 📝 Desain `brevo.ts` — Wrapper

```typescript
import { BrevoClient } from '@getbrevo/brevo'
import { supabaseAdmin } from '@/lib/api/supabase-server'

const client = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY!,
})

export interface SendBrevoEmailParams {
  to: { email: string; name?: string }
  subject: string
  htmlContent?: string
  textContent?: string
  templateId?: number
  params?: Record<string, string>
  tags?: string[]
  attachment?: Array<{ name: string; content: string }>  // base64
  referenceType?: string
  referenceId?: string
}

export async function sendEmailViaBrevo(params: SendBrevoEmailParams) {
  const fromEmail = process.env.BREVO_SENDER_EMAIL ?? await getCompanyEmail()

  let status: string
  let errorMessage: string | null = null
  let messageId: string | null = null

  try {
    const response = await client.transactionalEmails.sendTransacEmail({
      sender: { name: process.env.BREVO_SENDER_NAME ?? 'ERP RRI', email: fromEmail },
      to: [params.to],
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent,
      templateId: params.templateId,
      params: params.params,
      tags: params.tags,
      attachment: params.attachment,
    })
    status = 'sent'
    messageId = response.messageId ?? null
  } catch (err) {
    status = 'failed'
    errorMessage = err instanceof Error ? err.message : String(err)
  }

  // Log ke email_log
  const now = new Date().toISOString()
  await supabaseAdmin.from('email_log').insert({
    to_email: params.to.email,
    to_nama: params.to.name ?? null,
    subject: params.subject,
    body: params.htmlContent ?? params.textContent ?? null,
    status,
    error_message: errorMessage,
    reference_type: params.referenceType ?? null,
    reference_id: params.referenceId ?? null,
    created_at: now,
    updated_at: now,
  })

  if (status === 'failed') throw new Error(errorMessage ?? 'Failed to send email')
  return { success: true, messageId }
}
```

---

## ✅ Migration: Nodemailer → Brevo (SELESAI)

Brevo sekarang menjadi satu-satunya provider email. Nodemailer + seluruh kode SMTP telah dihapus.

`sendEmail()` langsung memanggil Brevo API tanpa fallback.

---

## ✅ Checklist Testing

### Domain & DNS
- [x] Cloudflare Registrar — domain `pt-rri.com` berhasil dibeli
- [x] Cloudflare DNS — A `erp` → `76.76.21.21` (grey cloud) + MX/TXT untuk Email Routing
- [ ] Vercel — SSL aktif untuk `erp.pt-rri.com` (auto-provision setelah DNS propagate)
- [x] Cloudflare Email Routing — `marzuqi@pt-rri.com` → routing rule ke Email Worker
- [x] Email aktif: `marzuqi@pt-rri.com` (erp@pt-rri.com tidak dipakai)
- [x] SPF record — `include:_spf.brevo.com` sudah ditambahkan
- [x] DKIM Brevo — CNAME `brevo1._domainkey` + `brevo2._domainkey` via Brevo managed DKIM
- [x] DMARC record — `_dmarc` → `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com`
- [x] Brevo sender — `Muhammad Marzuqi<marzuqi@pt-rri.com>` verified
- [x] Cloudflare Email Worker script — `cloudflare-workers/email-worker.js` siap deploy

### Inbound Email Pipeline (Phase 7)
- [x] API route `POST /api/v1/email/inbound` — menerima inbound email dari Worker
- [x] `EMAIL_INBOUND_SECRET` — shared secret di env vars (`.env` + Vercel + Worker)
- [x] Test manual insert — record `inbound=true` terverifikasi muncul di Mail Center Inbox
- [x] Worker deployed — `erp-rri-email-worker` via wrangler CLI ✅ (6 env vars set)
- [ ] Email Routing → Worker — routing rule diubah dari forward ke worker ⬅️ **Langkah 3**
- [ ] Test end-to-end — kirim ke `marzuqi@pt-rri.com` → muncul di Inbox ERP + Gmail Inbox

### Brevo API
- [ ] `POST /v3/smtp/email` — kirim email HTML sederhana
- [ ] `POST /v3/smtp/email` — kirim dengan attachment PDF
- [ ] `POST /v3/smtp/email` — kirim dengan templateId
- [ ] Dynamic params `{{params.nama}}` berfungsi
- [ ] Error handling: API key invalid → error message
- [ ] Error handling: sender tidak terverifikasi → error message
- [ ] Rate limit: 429 response → retry logic
- [ ] `email_log` terisi dengan status `sent`/`failed`
- [ ] Webhook: POST ke endpoint kita → update `email_log.status`
- [ ] Webhook: block IP unauthorized

### Mail Center UI — General
- [x] Sidebar menu — "Mail Center" muncul sebagai standalone link dengan icon Mail, antara Dashboard dan Master Data
- [ ] Layout split pane — sidebar folder + email list + detail bekerja di desktop
- [ ] Mobile responsive — Tabs untuk navigasi folder, Sheet untuk detail
- [ ] CSS variables — tidak ada hardcoded color, semua pakai token DESGIN_SYSTEM.md
- [ ] Typography — Lexend untuk heading, Source Sans 3 untuk body
- [ ] Lucide icons — konsisten h-4 w-4 di button, mr-2/ml-2 spacing rule
- [ ] Dark mode — semua elemen support dark mode via CSS variables
- [ ] Loading state — Skeleton untuk email list, tidak ada spinner
- [ ] Empty state — border-dashed pattern untuk folder kosong
- [ ] Focus visible — keyboard navigation di semua interactive element
- [ ] prefers-reduced-motion — transisi dihormati

### Mail Center UI — Inbox
- [ ] Folder navigator — klik folder filter email list
- [ ] Email list — Table dengan kolom Subject, From, Date
- [x] Unread indicator — blue dot (w-2 h-2 rounded-full bg-primary) untuk email unread
- [x] Selected row — bg-primary/5 border-l-2 border-primary
- [x] Hover row — hover:bg-muted/40 transition-colors
- [x] Search — CMD+K global + inline search bar by subject/pengirim
- [x] Pagination — Load More button per 50 email
- [ ] Klik email → tampilkan detail di panel kanan

### Mail Center UI — Sent
- [x] Sama dengan Inbox layout, filter otomatis status=sent
- [x] Search — inline search bar by subject/penerima
- [x] Pagination — Load More button per 50 email
- [ ] Status badge per email: Delivered (success), Opened (primary), Bounced (destructive), Pending (warning)
- [ ] Tracking tooltip — hover badge tampilkan timestamp

### Mail Center UI — Compose
- [ ] Sheet slide dari kanan (side="right" sm:max-w-2xl)
- [ ] Form: To (required, email valid), Subject, Body
- [x] Header dinamis: "Compose Email" / "Re: ..." / "Fwd: ..."
- [x] Banner Reply/Forward — avatar sender, quote original, timestamp
- [x] CC/BCC collapsible — toggle expand
- [x] Signature area otomatis
- [x] Autocomplete To — Command dialog dari contact/customer — Phase 10 MC-35
- [x] Attachment upload — presigned URL → R2 → Brevo (≤7 MB base64, >7 MB link download) — **Phase 11 R2-8 ✅**
- [x] Send — loading state (disabled), toast.success/error
- [x] Save Draft dihapus — fitur Draft diganti Trash (Phase 10)
- [x] Discard — AlertDialog confirmation lalu close sheet
- [x] Validasi Zod — error tampil via FormMessage
- [x] Warna tombol `bg-primary` (bukan hardcoded `#0000FF`) — Phase 10

### Mail Center UI — Trash (Phase 10, replacing Draft)
- [x] Tab Trash — list email WHERE status='trashed'
- [x] Search — inline search bar by subject/pengirim
- [x] Pagination — Load More button per 50 email
- [x] Badge `variant="outline"` untuk status trashed di list
- [x] Detail page: Restore + Delete Permanently button untuk email di Trash
- [x] Detail page: Move to Trash button untuk non-trashed
- [x] Trash count badge di tab (abu-abu `bg-muted-foreground`)
- [ ] Empty state jika tidak ada email di Trash

### Mail Center UI — Email Detail
- [ ] Header: Avatar sender, From, To, CC, Date, Subject (Lexend bold)
- [ ] Body: HTML render (sanitized)
- [x] Attachments: Paperclip icon, filename, size, download button (Phase 11 R2-11 ✅)
- [ ] Tracking timeline: Sent → Delivered → Opened → Clicked (dengan timestamp)
- [ ] Reply: Textarea inline + Send button
- [x] Actions: Reply, Reply All, Forward (icon button + DropdownMenu) — Phase 9
- [x] Actions: Move to Trash (soft-delete) untuk non-trashed — Phase 10
- [x] Actions: Restore + Delete Permanently untuk trashed — Phase 10
- [x] Delete → AlertDialog → soft-delete (trash) — Phase 10
- [x] Fix `[object Object]` error di handler — Phase 10

### Mail Center UI — Templates
- [x] Card grid: nama template, preview snippet, icon
- [x] Search — inline search bar by nama template
- [x] Create: Sheet form Title + HTML body + preview toggle (Tabs: Edit | Preview)
- [x] Edit: buka sheet prefilled
- [x] Delete: langsung hapus via API
- [x] Use: klik → buka Compose Sheet dengan body + subject prefilled
- [x] Data persisted di database (email_templates table) — tidak hilang setelah refresh

---

## ✅ Phase 12 — Threading & Avatar Mail Center Redesign (SELESAI)

Mail Center kini mendukung Gmail-like conversation view: email dalam thread yang sama dikelompokkan, avatar lingkaran di setiap baris, dan conversation view di halaman detail.

| # | Task | Status | File |
|---|------|--------|------|
| TH-1 | **Migration `thread_id`** — tambah kolom `thread_id` (text) + index di `email_log`. Update existing records dengan UUID unik. | ✅ Done | `0048_add_thread_id_to_email_log.sql` |
| TH-2 | **Schema `email-log.ts`** — tambah `threadId: text("thread_id")` di Drizzle schema | ✅ Done | `src/lib/db/schema/email-log.ts` |
| TH-3 | **`brevo.ts` — thread_id assignment outbound** — saat send reply, resolve `thread_id` dari parent email (via `referenceId` → `message_id`). Jika tidak ada parent, generate UUID baru via `crypto.randomUUID()`. | ✅ Done | `src/lib/email/brevo.ts` |
| TH-4 | **`inbound/route.ts` — thread_id assignment inbound** — accept `inReplyTo` + `references` fields. Parse `References` header, cari parent email di DB, gunakan `thread_id` yang sama. Jika reply ke email baru, generate UUID baru. | ✅ Done | `src/app/api/v1/email/inbound/route.ts` |
| TH-5 | **`email-worker.js` — extract threading headers** — tambah extract `in-reply-to` + `references` dari MIME headers, kirim ke inbound API. | ✅ Done | `cloudflare-workers/email-worker.js` |
| TH-6 | **`email-list.tsx` — thread grouping** — grup email by `thread_id`. Tiap grup: avatar lingkaran (inisial, warna random konsisten per seed), sender name, subject, body preview, count badge (jumlah email dalam thread), timestamp email terbaru. Click → navigasi ke detail email terbaru dalam thread. | ✅ Done | `src/components/email/email-list.tsx` |
| TH-7 | **`[id]/page.tsx` — conversation view** — fetch semua email dalam thread yang sama (by `thread_id`). Tampilkan vertical conversation: tiap email punya avatar + metadata (from, to, date) + body + attachments + action buttons (Reply/Reply All/Forward). Bisa collapse/expand per email. Tracking timeline untuk email terbaru. | ✅ Done | `src/app/dashboard/email/[id]/page.tsx` |
| TH-8 | **`EmailItem` interface** — tambah `threadId?: string` field, update `mapEmailLogRow()` | ✅ Done | `src/components/email/email-list.tsx` |

## 📋 Future Plan — Multi-Email Perusahaan (Rencana)

### Latar Belakang
Saat ini hanya `marzuqi@pt-rri.com` yang aktif. Untuk meningkatkan profesionalisme, direncanakan 5 alamat email perusahaan:
- `marzuqi@pt-rri.com` ✅ (sudah aktif)
- `info@pt-rri.com`
- `sales@pt-rri.com`
- `procurement@pt-rri.com`
- `finance@pt-rri.com`

### Arsitektur

```
Cloudflare Email Routing (catch-all *@pt-rri.com)
  │
  ▼
Cloudflare Email Worker (satu Worker untuk semua)
  │  ├─ Parse To header → deteksi alamat tujuan (sales@ / info@ / dll)
  │  ├─ Upload attachments ke R2
  │  ├─ POST ke ERP API → email_log (dengan from_email_original)
  │  └─ Relay ke mazzjoeq@gmail.com
  │
  ▼
ERP Mail Center
  ├─ Filter by recipient address (tab per alamat? atau badge?)
  ├─ From dropdown di Compose → pilih sender address
  └─ Per-modul default sender (quotation → sales@, invoice → finance@)
```

| # | Task | Status | Priority |
|---|------|--------|----------|
| ME-1 | **Verify 5 sender addresses di Brevo** — tambah sender di Brevo Dashboard → Settings → Senders → Add Sender. Verifikasi via email confirmation. | ⬜ Planned | 🔴 High |
| ME-2 | **Set DKIM/SPF/DMARC** — pastikan DKIM keys sudah active untuk domain, SPF include Brevo, DMARC policy upgrade dari `p=none` ke `p=quarantine` | ⬜ Planned | 🔴 High |
| ME-3 | **Add `from_email_original` column** — migration untuk simpan alamat penerima inbound (parsed dari `To` header) | ⬜ Planned | 🔴 High |
| ME-4 | **Worker upgrade: parse `To` header** — extract alamat tujuan dari `To` header, kirim sebagai `toEmailOriginal` ke inbound API | ⬜ Planned | 🔴 High |
| ME-5 | **Worker relay upgrade** — tambah info alamat tujuan di relay email subject/body | ⬜ Planned | 🟡 Medium |
| ME-6 | **"From" dropdown di Compose Sheet** — pilih sender address dari daftar verified Brevo senders | ⬜ Planned | 🟡 Medium |
| ME-7 | **API `send/route.ts` — accept `fromEmail`** — override sender email saat kirim (default: BREVO_SENDER_EMAIL) | ⬜ Planned | 🟡 Medium |
| ME-8 | **Per-modul default sender** — quotation → `sales@`, invoice → `finance@`, etc. | ⬜ Planned | 🟢 Low |
| ME-9 | **Relay >7MB notice include alamat tujuan** — update Worker relay body | ⬜ Planned | 🟢 Low |

### Catatan Penting
- **Catch-all Worker** adalah pendekatan paling sederhana — 1 Worker handle semua alamat, parse `To` header
- Bukan per-address route (terlalu banyak Worker, sulit maintain)
- Setiap alamat perlu diverifikasi di Brevo agar bisa jadi sender outbound
- DKIM/SPF/DMARC wajib untuk deliverability — tanpa ini email ke customer masuk Spam

---

## 📚 Referensi

| Sumber | URL |
|--------|-----|
| Dokumentasi Resmi Brevo | https://developers.brevo.com/ |
| LLM-friendly Docs | https://developers.brevo.com/llms-full.txt |
| GitHub SDK (Node.js) | https://github.com/getbrevo/brevo-node |
| NPM Package | https://www.npmjs.com/package/@getbrevo/brevo |
| Send Transactional Email | https://developers.brevo.com/reference/send-transac-email |
| Webhooks Guide | https://developers.brevo.com/docs/how-to-use-webhooks |
| Pricing (Free 300/day) | https://www.brevo.com/pricing/ |
| Cloudflare Registrar | https://developers.cloudflare.com/registrar/ |
| Cloudflare Email Routing | https://developers.cloudflare.com/email-routing/ |
| Vercel Domains | https://vercel.com/docs/projects/domains |
| Cloudflare DNS CNAME | https://developers.cloudflare.com/dns/manage-dns-records/ |
| Cloudflare R2 Docs | https://developers.cloudflare.com/r2/ |
| R2 S3 Compatible API | https://developers.cloudflare.com/r2/api/s3/api/ |
| R2 Presigned URLs | https://developers.cloudflare.com/r2/features/presigned-urls/ |
| AWS SDK S3 v3 | https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/ |
