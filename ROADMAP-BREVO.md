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
| Mail Center UI | ✅ Active | `/dashboard/email/inbox`, `sent`, `draft`, `templates`, `[id]` |

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

Semua records **Grey Cloud** (DNS only — proxy off):

| Type | Name | Priority | Value | Fungsi |
|------|------|----------|-------|--------|
| A | `erp` | — | `76.76.21.21` | Vercel deployment |
| MX | `pt-rri.com` | 26 | `route1.mx.cloudflare.net.` | Email Routing inbound |
| MX | `pt-rri.com` | 77 | `route3.mx.cloudflare.net.` | Email Routing inbound |
| MX | `pt-rri.com` | 97 | `route2.mx.cloudflare.net.` | Email Routing inbound |
| TXT | `cf2024-1._domainkey.pt-rri.com` | — | `"v=DKIM1; h=sha256; k=rsa; p=..."` | DKIM signing |
| TXT | `pt-rri.com` | — | `"v=spf1 include:_spf.mx.cloudflare.net ~all"` | SPF authorization |

### Cloudflare Email Routing (Inbound)

```
Email Routing (gratis):
  marzuqi@pt-rri.com → forward ke Gmail pribadi (verified)
  (tidak perlu mail server, tidak perlu storage)
```

### Environment Variables

```bash
# Brevo
BREVO_API_KEY=xkeysib-xxxxxxxxxxxx
BREVO_SENDER_NAME="ERP RRI"
BREVO_SENDER_EMAIL=erp@pt-rri.com

# Cloudflare
CLOUDFLARE_API_TOKEN=xxxxxxxxxxxx
CLOUDFLARE_ZONE_ID=xxxxxxxxxxxx

# Vercel
VERCEL_TOKEN=xxxxxxxxxxxx
VERCEL_PROJECT_ID=xxxxxxxxxxxx

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
| MC-8 | **Draft page** — `/dashboard/email/draft` — list from `email_log` WHERE `status='draft'` | ✅ Done | `src/app/dashboard/email/draft/page.tsx` | Skeleton loading; Empty state §14.2 |
| MC-9 | **Templates page** — `/dashboard/email/templates` — Card grid, Create Sheet with Tabs (Edit/Preview), Edit, Delete | ✅ Done | `src/app/dashboard/email/templates/page.tsx` | Card §3.7; Sheet §3.11; Tabs §3.12 |

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
| Compose button | `bg-gradient-to-b from-[#0000FF] to-[#0000D9] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]` | §3.1 Button default Luxury |
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
  ⭐ Starred       (3)
  ✉️ Sent          (45)
  📝 Draft         (2)
  🗂️ Templates    (6)
  🚫 Spam          (1)
  🗑️ Trash
```

- Icons: **Lucide** — `Inbox`, `Star`, `Send`, `FileText`, `File`, `AlertTriangle`, `Trash2`
- Ikon berjarak: `mr-3 h-4 w-4 text-muted-foreground` (active: `text-primary-foreground`)
- Active state: `bg-primary text-primary-foreground` (biru #0000FF)
- Count: `ml-auto bg-primary/10 text-primary text-xs font-semibold rounded-full px-2 py-0.5` (active: `bg-white/20 text-primary-foreground`)
- Aturan 60-30-10: sidebar adalah bagian dari 30% struktur, primary hanya muncul di item aktif (10%)

### Compose Email — Sheet Design

- `Sheet` slide dari kanan: `side="right" className="sm:max-w-2xl"`
- `SheetHeader` + `SheetTitle` = "Compose Email"
- Form fields:
  - **To:** `Input` + `Command` dialog untuk autocomplete dari contact/customer DB
  - **CC/BCC:** toggle expand link
  - **Subject:** `Input` dengan placeholder
  - **Body:** `Textarea` (atau rich text editor ringan, Phase 5 enhancement)
  - **Attachments:** Upload button → upload ke Supabase Storage (`dokumen/email/{id}/`) → tampilkan list dengan nama & size + remove button
- Action buttons:
  - **Send** — `Button variant="default"` dengan gradient blue (loading state)
  - **Save Draft** — `Button variant="outline"`
  - **Discard** — `Button variant="ghost" text-destructive hover:text-destructive` + AlertDialog confirm
- Validasi: Zod schema → `react-hook-form`

### Email Detail View

- Panel kanan (atau Sheet di mobile):
  - **Header:** Avatar sender, From, To, Date, Subject (Lexend bold)
  - **Actions:** Reply, Reply All, Forward, Archive, Delete (icon buttons)
  - **Body:** Rendered HTML (iframe sandbox atau div sanitized)
  - **Attachments:** List cards — icon Paperclip, filename, size, Download button
  - **Tracking Timeline:** Timeline pattern (vertical) — Sent → Delivered → Opened → Clicked (dengan timestamp)
  - **Reply:** Textarea inline + Send button di bagian bawah

---

## 🏗️ Architecture & File Structure

```
src/lib/email/
├── brevo.ts                  # Brevo client wrapper (Phase 1)
├── contacts.ts               # Contact sync to Brevo (Phase 3)
├── utm.ts                    # UTM parameter utility (Phase 3)
├── types.ts                  # Shared email types (SendEmailParams, EmailLog, etc.)
├── templates/
│   ├── index.ts               # Layout + helpers (Phase 2)
│   ├── quotation.ts           # Template Quotation email (Phase 2)
│   ├── invoice.ts             # Template Invoice email (Phase 2)
│   ├── cpo.ts                 # Template CPO notification (Phase 2)
│   └── do.ts                  # Template DO notification (Phase 2)
└── webhook.ts                 # Webhook payload types & handler (Phase 2)

src/app/api/v1/email/
├── send/
│   └── route.ts               # POST /api/v1/email/send (Phase 5)
├── webhook/
│   └── route.ts               # POST /api/v1/email/webhook (Phase 2)
├── sync-contacts/
│   └── route.ts               # POST /api/v1/email/sync-contacts (Phase 3)
├── templates/
│   └── route.ts               # GET /api/v1/email/templates (Phase 3)
├── campaigns/
│   └── route.ts               # GET /api/v1/email/campaigns (Phase 3)
└── stats/
    └── route.ts               # GET /api/v1/email/stats (Phase 3)

src/components/email/
├── email-sidebar.tsx          # Folder navigator (Inbox, Sent, Draft, etc.)
├── email-list.tsx             # Email list component (shared by inbox/sent/draft)
└── email-compose-sheet.tsx    # Compose email Sheet (reusable)
# Detail panel, status badge, tracking timeline are inlined in page components

src/app/dashboard/email/
├── layout.tsx                 # Layout split-pane: sidebar + main content
├── page.tsx                   # Redirect to /dashboard/email/inbox
├── inbox/
│   └── page.tsx               # Inbox page (Phase 5)
├── sent/
│   └── page.tsx               # Sent page (Phase 5)
├── draft/
│   └── page.tsx               # Draft page (Phase 5)
├── templates/
│   └── page.tsx               # Templates page (Phase 5)
└── [id]/
    └── page.tsx               # Email detail page (Phase 5)
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
- [x] Cloudflare Email Routing — `marzuqi@pt-rri.com` → forward ke Gmail (verified)
- [ ] SPF/DKIM records untuk Brevo terverifikasi

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
- [ ] Unread indicator — blue dot (w-2 h-2 rounded-full bg-primary) untuk email unread
- [ ] Selected row — bg-primary/5 border-l-2 border-primary
- [ ] Hover row — hover:bg-muted/40 transition-colors
- [ ] Search — CMD+K membuka Command dialog, search by subject/sender
- [ ] Pagination atau infinite scroll
- [ ] Klik email → tampilkan detail di panel kanan

### Mail Center UI — Sent
- [ ] Sama dengan Inbox layout, filter otomatis status=sent
- [ ] Status badge per email: Delivered (success), Opened (primary), Bounced (destructive), Pending (warning)
- [ ] Tracking tooltip — hover badge tampilkan timestamp

### Mail Center UI — Compose
- [ ] Sheet slide dari kanan (side="right" sm:max-w-2xl)
- [ ] Form: To (required, email valid), Subject, Body
- [ ] Autocomplete To — Command dialog dari contact/customer
- [ ] Attachment upload — upload ke storage, tampilkan nama + size + remove
- [ ] Send — loading state, toast.success/error
- [ ] Save Draft — simpan ke email_log status=draft, toast notification
- [ ] Discard — AlertDialog confirmation lalu close sheet
- [ ] Validasi Zod — error tampil via FormMessage

### Mail Center UI — Draft
- [ ] List draft dari email_log WHERE status='draft'
- [ ] Klik draft → buka Compose Sheet dengan data prefilled
- [ ] Send dari draft → update status jadi 'sent'
- [ ] Delete draft → AlertDialog confirmation
- [ ] Empty state jika tidak ada draft

### Mail Center UI — Email Detail
- [ ] Header: Avatar sender, From, To, CC, Date, Subject (Lexend bold)
- [ ] Body: HTML render (sanitized)
- [ ] Attachments: Paperclip icon, filename, size, download button
- [ ] Tracking timeline: Sent → Delivered → Opened → Clicked (dengan timestamp)
- [ ] Reply: Textarea inline + Send button
- [ ] Actions: Reply, Reply All, Forward (icon button + DropdownMenu)

### Mail Center UI — Templates
- [ ] Card grid: nama template, preview snippet, icon
- [ ] Create: Sheet form Title + HTML body + preview toggle (Tabs: Edit | Preview)
- [ ] Edit: buka sheet prefilled
- [ ] Delete: AlertDialog confirmation
- [ ] Use: klik → buka Compose Sheet dengan body prefilled

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
