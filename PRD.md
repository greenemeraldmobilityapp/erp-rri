# PRD: ERP PT. RIZKI RIDHO ILAHI

**Versi:** 4.0
**Status:** Draft
**Tanggal:** 21 Mei 2026

---

## 1. Latar Belakang

PT. Rizki Ridho Ilahi (RRI) adalah perusahaan General Supplier barang operasional untuk Customer, dengan fokus utama melayani kebutuhan operasional PLTU Tanjung Jati B di kota Jepara.

Kategori barang yang disuplai:
- Cleaning Service / Alat Kebersihan
- Alat Tulis Kantor (ATK)
- Peralatan operasional
- Barang pendukung operasional lainnya

Saat ini seluruh proses bisnis masih dilakukan secara secara manual (Microsoft Word, Excel) — tidak ada sistem terintegrasi.

## 2. Tujuan

Membangun sistem ERP berbasis web yang terintegrasi untuk:

1. Mengelola seluruh siklus bisnis dari pra-penjualan hingga pembayaran
2. Menghasilkan dokumen formal (Quotation, PO, DO, Invoice, Kwitansi) dalam format PDF secara otomatis
3. Kontrol stok barang secara real-time
4. Role-based access control untuk setiap divisi
5. Laporan keuangan dan operasional yang akurat
6. Responsive di semua perangkat (mobile, tablet, desktop)
7. Modul AI Agent untuk otomatisasi pencarian harga, OCR kontrak, dan rekomendasi
8. Otomatisasi proses bisnis berantai dari hulu ke hilir
9. Audit trail dan logging penuh untuk akuntabilitas
10. Kepatuhan pajak Indonesia (PPN 11%, PPh, laporan PPN masa)
11. Manajemen retur dan claim barang
12. Notifikasi otomatis via WhatsApp untuk reminder dan approval
13. Monitoring sistem kesehatan aplikasi (uptime, error tracking)

## 3. Tech Stack

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 15.5.18 (App Router) |
| Bundler | Turbopack |
| Bahasa | TypeScript |
| Styling | Tailwind CSS |
| UI Komponen | shadcn/ui + lucide-react + Radix UI primitives |
| State Management | Zustand + TanStack React Query |
| Form | react-hook-form + @hookform/resolvers + Zod |
| API Documentation | next-openapi-gen (auto-generate) + @scalar/nextjs-api-reference |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle ORM |
| Auth | Supabase Auth |
| PDF Generator | @react-pdf/renderer |
| Background Jobs | Inngest / Trigger.dev |
| Cache | Redis (Upstash) |
| Notifikasi In-App | sonner |
| Notifikasi WhatsApp | Fonnte (gratis 500 msg/hari) — sudah implementasi dengan 3 trigger: Quotation, DO Dikirim, PO Supplier |
| AI Agent | NVIDIA NIM (free tier) — 3 agent architecture: NegoAgent (stepfun-ai/step-3.5-flash), DataAgent (minimaxai/minimax-m2.7), VisionAgent (microsoft/phi-4-multimodal-instruct) |
| Testing (Unit) | Vitest |
| Testing (E2E) | Playwright |
| Storage | Supabase Storage (dengan CDN) |
| Image Optimization | browser-image-compression + WebP conversion |
| Deploy | Vercel |
| Platform | Web Browser (Responsive: Mobile, Tablet, Desktop) |

## 4. UI/UX Design System

### 4.1 Component Library: shadcn/ui

Menggunakan **shadcn/ui** — library komponen berbasis Radix UI + Tailwind CSS. Bukan npm package, melainkan kode sumber yang di-copy ke project (`/components/ui/`) sehingga bisa dimodifikasi penuh.

**Komponen yang digunakan:**
- `Sidebar` — navigasi utama dashboard
- `Table` — data tables untuk list master data
- `Dialog` — modal konfirmasi hapus/approve
- `Form` — form dengan react-hook-form integration
- `Card` — kartu informasi dashboard
- `Badge` — status indicator (Active/Non-Active)
- `Button`, `Input`, `Select`, `Textarea` — form elements
- `Toast` (via sonner) — notifikasi aksi sukses/gagal
- `Tabs` — navigasi tab dalam halaman
- `DropdownMenu` — action menu per item

### 4.2 Design Theme: "Accessible & Ethical"

Tema dirancang untuk enterprise/government — fokus pada accessibility, high contrast, dan profesional.

**Color Palette:**

| Role | Hex | Usage |
|------|-----|-------|
| Primary | `#0F172A` | Navbar, sidebar, heading utama |
| Secondary | `#334155` | Sub-heading, secondary text |
| CTA / Aksi | `#0369A1` | Tombol submit, link, aksi utama |
| Background | `#F8FAFC` | Latar halaman utama |
| Card BG | `#FFFFFF` | Kartu, tabel, form |
| Text | `#020617` | Body text — high contrast |
| Muted | `#475569` | Label, placeholder, secondary info |
| Success | `#22C55E` | Status active/berhasil |
| Danger | `#DC2626` | Hapus, error, status non-active |
| Border | `#E2E8F0` | Garis pemisah, border card |

**Styling Approach:**
- **Light mode first** — cocok untuk kantor dengan pencahayaan siang
- **High contrast** — WCAG AAA compliance
- **Navy + Blue scheme** — korporat, terpercaya, tidak norak
- **Minimum 16px font** untuk body text — readability di semua umur
- **Focus rings 3-4px** — keyboard navigation visible

### 4.3 Typography

| Role | Font | Weight |
|------|------|--------|
| Heading | **Lexend** | 400, 500, 600, 700 |
| Body | **Source Sans 3** | 300, 400, 500, 600, 700 |

- **Lexend** — clean, modern, highly readable untuk heading
- **Source Sans 3** — terbukti legible di berbagai ukuran layar

### 4.4 Ikon

- **Heroicons** atau **Lucide** — SVG icon set yang konsisten (viewBox 24x24)
- **Dilarang** menggunakan emoji sebagai ikon UI
- Semua ikon menggunakan ukuran `w-5 h-5` atau `w-6 h-6`
- Semua tombol/elemen interaktif wajib `cursor-pointer`
- Transisi hover menggunakan `transition-colors duration-200`

### 4.5 Anti-Patterns (Dihindari)

| Praktik Buruk | Solusi |
|---------------|--------|
| Emoji sebagai ikon UI | Gunakan Heroicons/Lucide SVG |
| Custom sidebar dari `<div>` | Pakai `Sidebar` component dari shadcn |
| Custom table dari `<div grid>` | Pakai `Table` component dari shadcn |
| Hover state pake scale transform | Pakai color/shadow transition |
| Low contrast text (gray-400) | Minimal `#475569` (slate-600) |
| Transparansi berlebihan di light mode | `bg-white/80` atau lebih solid |
| Motion efek berlebihan | Respect `prefers-reduced-motion` |

### 4.6 Responsive Breakpoints

| Device | Breakpoint | Target |
|--------|-----------|--------|
| Mobile | 375px | Minimal support |
| Tablet | 768px | iPad, Galaxy Tab |
| Desktop | 1024px | Laptop standar |
| Wide | 1440px | Monitor eksternal |

## 5. Storage & File Management

### 5.1 Supabase Storage Strategy
Menggunakan Supabase Storage dengan bucket terstruktur dan optimasi penyimpanan untuk menghemat biaya.

### 5.2 Struktur Bucket

```
avatars/                  → Foto profil user/karyawan
  └── {userId}/avatar.jpg

barang/                   → Foto barang
  └── {barangId}/foto-1.jpg
  └── {barangId}/foto-2.jpg

dokumen/                  → File dokumen (PDF kontrak, RFQ, dll)
  └── kontrak/{kontrakId}/kontrak.pdf
  └── rfq/{rfqId}/rfq.pdf

temporary/                → File sementara (auto-delete setelah 24 jam)
  └── export/{sessionId}/laporan.xlsx
```

### 5.3 Optimasi Penyimpanan (Hemat Biaya)

| Teknik | Implementasi | Manfaat |
|---|---|---|
| **Compress sebelum upload** | `browser-image-compression` library di client-side. Kompres gambar sebelum dikirim ke Supabase | Ukuran file turun 60-80% |
| **Konversi ke WebP** | Semua gambar otomatis dikonversi ke format WebP (lebih kecil dari JPEG/PNG) | Ukuran file turun 30% tambahan |
| **Delete file lama** | Setiap update file gambar/file: hapus file existing di bucket, baru upload yang baru. Tidak ada file sampah menumpuk | Tidak ada file sampah menumpuk |
| **Max dimensi** | Foto barang: max 1920px. Avatar: max 200px. Foto profil: max 600px | File size terkontrol |
| **Max file size** | Client-side + server-side validation: Foto = max 5MB, Dokumen PDF = max 10MB | Mencegah abuse |
| **Whitelist tipe file** | Hanya izinkan: `image/jpeg`, `image/png`, `image/webp`, `application/pdf` | Keamanan storage |
| **Supabase CDN** | Setiap file di-serve via CDN — cepat diakses, cache otomatis | Performa loading |
| **Blur placeholder** | Gambar ditampilkan dengan blur placeholder saat loading — UX tetap mulus tanpa harus download full resolution dulu | User experience |
| **Sliced** | Sliced images via URL params if premium features enabled | Optional |

### 5.4 Alur Upload File

```
User pilih file
  ↓
Validasi tipe file & ukuran (client-side)
  ↓
Compress gambar + konversi ke WebP (browser-image-compression)
  ↓
Cek: apakah ada file existing di path yang sama?
  ├── YA → Hapus file lama dari Supabase Storage
  └── TIDAK → LANJUT
  ↓
Upload file baru ke Supabase Storage
  ↓
Simpan public URL ke database
  ↓
Tampilkan ke user
```

### 5.5 Rekomendasi Tambahan untuk Profesionalisme

| Rekomendasi | Keterangan |
|---|---|
| **Supabase Image Transformations** | Fitur berbayar tapi sangat worth it: bisa request ukuran gambar on-the-fly via URL parameter (`?width=200&height=200&format=webp`). Tidak perlu simpan multiple resolusi |
| **RLS Policy per Bucket** | Setiap bucket punya Row Level Security — hanya role tertentu yang bisa upload/hapus. Finance tidak bisa hapus foto barang, Gudang tidak bisa hapus dokumen kontrak |
| **Signed URLs untuk Dokumen Sensitif** | Untuk file kontrak PDF yang bersifat rahasia, akses via signed URL yang expire dalam 1 jam — bukan public URL |
| **Auto-cleanup Temporary** | Bucket `temporary/` di-cleanup otomatis setiap 24 jam via Supabase cron atau trigger. File cocok untuk auto-cleanup: Export laporan (Excel/PDF), preview dokumen, import bulk Excel, hasil screenshot AI Search, file upload gagal/cancel, cache generate PDF | Tidak ada file sampah menumpuk |
| **File Naming Convention** | `{modul}/{id}/{timestamp}-{originalName}.webp` — tidak ada nama file yang bentrok |

## 6. Scalability & Arsitektur

### 6.1 Background Jobs
Proses berat dijalankan di background agar tidak memblokir user:
- AI Search Harga (Playwright scraping)
- AI OCR Kontrak
- Generate PDF dokumen
- Export laporan Excel

Teknologi: **Inngest** atau **Trigger.dev** — terintegrasi native dengan Next.js.

### 6.2 Caching dengan Redis (Upstash)
Data yang sering diakses di-cache untuk performa optimal:
- Daftar barang & harga
- Data customer & kontrak
- Hasil AI Search (TTL 1 jam)
- Session & rate limiting

### 6.3 Database Indexing
Semua foreign key dan kolom yang sering di-query diberi index sejak awal:
- `barang.kategori_id`, `barang.kode`
- `customer_po.customer_id`, `customer_po.status`
- `sales_order.customer_po_id`
- `stok.barang_id`, `stok.gudang_id`
- Semua kolom `created_at`, `deleted_at`

### 6.4 API Versioning
```
/api/v1/master/barang
/api/v1/pre-sales/quotation
/api/v1/sales/delivery-order
```
Ketika ada perubahan besar, API lama tetap jalan — client tidak broken.

### 6.5 Pagination Wajib
Semua list data menggunakan pagination (offset-based atau cursor-based). Tidak ada `SELECT *` tanpa `LIMIT`.

### 6.6 Soft Delete
Data tidak pernah dihapus permanen dari database. Setiap tabel memiliki kolom `deleted_at`:
```sql
deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
```
Data yang "dihapus" hanya di-filter di query level. Data tetap utuh untuk audit trail.

### 6.7 Database Backup
- **Supabase Point-in-Time Recovery (PITR)** — restore ke detik kapanpun dalam 7 hari terakhir (termasuk di free tier)
- **Daily automated backup** — Supabase backup otomatis setiap 24 jam
- **Manual backup** — export database via `pg_dump` bisa dijadwalkan via cron job
- **Storage backup** — file di Supabase Storage di-replicate secara otomatis

### 6.8 Database Archiving
Data lama (>1 tahun) bisa di-archive ke tabel khusus atau bucket storage khusus untuk mengoptimasi performa query utama. Proses archiving bisa dijadwalkan bulan sekali.

### 6.9 System Health Monitoring
Monitoring gratis menggunakan UptimeRobot (uptime kunjungan) + Sentry.io (error tracking gratis tier) + LogRocket (session replay free tier). Alternatif self-hosted: Grafana + Prometheus + Loki.

## 7. Modul Aplikasi

### A. Master Data

Modul ini menyimpan seluruh data referensi yang digunakan oleh modul lainnya.

| Sub-Modul | Deskripsi |
|---|---|
| **Barang** | Data barang (nama, kode, kategori, satuan, spesifikasi, harga beli default, harga jual default) |
| **Kategori Barang** | Pengelompokan barang (Cleaning Service, ATK, Peralatan, dll) |
| **Supplier** | Data supplier — termasuk supplier marketplace (Shopee, Tokopedia) dengan field: nama toko, link toko, no. rekening, kontak. Untuk marketplace: field tambahan seperti link produk, marketplace, nama toko. Dilengkapi **Terms of Payment** (TOP): Net 30, Net 60, Cash, Custom |
| **Customer** | Data customer, alamat, kontak. Dilengkapi **Terms of Payment** (TOP): Net 30, Net 60, Cash, Custom |
| **PIC Customer** | Multiple PIC per customer (nama, jabatan, no. HP, email). Tracking per RFQ/DI/Kontrak — setiap dokumen bisa diassign ke PIC berbeda |
| **Karyawan** | Data karyawan RRI (data pribadi, jabatan, gaji pokok) |
| **Chart of Accounts (COA)** | Daftar akun untuk pembukuan keuangan |
| **Kontrak Kunden** | Kontrak harga tetap dengan customer (fixed price list). Upload file PDF kontrak → AI OCR extract harga → masuk database |
| **Harga Barang** | Histori harga beli dari supplier dan harga jual ke customer |
| **Bulk Import Excel** ✅ | Import master data barang, supplier, customer via upload file Excel — Halaman `/dashboard/tools/bulk-import`, API `POST /api/v1/tools/bulk-import`, sidebar Master Data group |

### B. AI Agent Module

Modul AI adalah otak cerdas ERP RRI. Menggunakan **NVIDIA NIM (free tier)** dengan 3 agent architecture — model berjalan via OpenAI-compatible API di `https://integrate.api.nvidia.com/v1`.

#### Arsitektur 3 AI Agent

| Agent | Model NVIDIA | Fungsi |
|---|---|---|
| **NegoAgent** | `stepfun-ai/step-3.5-flash` | Analisis negosiasi: margin, risk score, approval level, streaming reasoning |
| **DataAgent** | `minimaxai/minimax-m2.7` | NL-to-SQL chat, price recommendation, invoice classify, report summary, smart reminder, PR routing, GRN check, contract alerts |
| **VisionAgent** | `microsoft/phi-4-multimodal-instruct` | OCR dokumen (kontrak, invoice, receipt, delivery order) dari gambar/PDF |

#### Fitur AI Lengkap

| Fitur AI | Agent | Status | Deskripsi |
|---|---|---|---|
| **AI Search Harga** | Playwright (standalone) | ✅ | Scraping Shopee & Tokopedia via Playwright + mock fallback. Hasil: nama, harga, toko, rating, link. Referensi harga beli untuk Procurement |
| **AI OCR Kontrak** | VisionAgent + regex fallback | ✅ | Upload PDF/gambar kontrak → AI extract barang & harga → simpan DB. Dual implementation: legacy regex + Phi-4 multimodal |
| **AI Rekomendasi Harga** | DataAgent (priceRecommender) | ✅ | Rule-based + AI: harga beli termurah, margin default 15%, atau harga kontrak |
| **AI Negosiasi Assistant** | NegoAgent | ✅ | Analisis margin dengan approval level (sales/manager/owner), risk score, streaming reasoning chain |
| **AI Chat (NL-to-SQL)** | DataAgent | ✅ | 196 query pattern across 15+ kategori: invoice, AR, sales, inventory, finance, HR, contract. Intent Classifier → Query Builder → Response Formatter |
| **Prediktif Rekomendasi Supplier** | DataAgent | ✅ | Ranking supplier berdasarkan: total PO, total spent, avg price, recency, breadth of barang. Score 0-100. Filter by barang & min PO |
| **Auto-Suggest Barang** | DataAgent | ✅ | Auto-suggest nama barang saat input Quotation/PO. Prioritaskan histori customer, fallback ke global. Real-time search dengan debounce 300ms |
| **Price Trend Analysis** | DataAgent | ✅ | Grafik tren harga barang per bulan dari histori PO. Statistik: rata-rata, min, max, perubahan %. Rekomendasi beli: "Sekarang — harga turun" / "Tunggu — harga naik" |
| **Anomaly Detection** | DataAgent | ✅ | Deteksi 3 jenis anomaly: harga beli mahal (z-score >2.5), harga jual miring (z-score >3), margin kecil. Severity: high/medium/low. Filter rentang hari |

#### Automation Triggers

Sistem automation menghubungkan database events ke AI agents via 2 mekanisme:

| Trigger | Sumber | Action DataAgent | Keterangan |
|---|---|---|---|
| INVOICE_CREATED | Supabase Webhook (INSERT on `invoice`) | INVOICE_CLASSIFY | Klasifikasi otomatis invoice baru |
| QUOTATION_CREATED | Supabase Webhook (INSERT on `quotation`) | PRICE_RECOMMENDATION | Rekomendasi harga untuk quotation baru |
| PR_SUBMITTED | Supabase Webhook (INSERT on `purchase_request`) | PR_ROUTING | Routing otomatis PR ke supplier |
| GRN_CREATED | Supabase Webhook (INSERT on `grn`) | GRN_CHECK | QC otomatis barang masuk |
| CONTRACT_NEARING_EXPIRY | Vercel Cron (daily) | CONTRACT_ALERTS | Notifikasi kontrak expired 30 hari |
| AR_OVERDUE_30 | Vercel Cron (daily) | BULK_REMINDERS | Auto-reminder invoice overdue |

#### Rate Limiting & Monitoring

| Mekanisme | Implementasi |
|---|---|
| **Rate Limiting** | IP-based, per-agent configurable limits. Dual mode: InMemoryStore (default) + RedisStore (Upstash, via `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env vars) |
| **Webhook Secret** | `AI_WEBHOOK_SECRET` — shared secret antara Supabase Webhook → endpoint `/api/v1/ai/agents/automation/webhook` |
| **Error Monitoring** | Endpoint `/api/v1/ai/agents/error-stats` — error rate per agent, avg latency, top error messages. Dashboard tab "Error Rate" di `/dashboard/ai/usage` |
| **Response Caching** | 5-minute TTL in-memory cache via `src/lib/ai/cache.ts` |

#### API Endpoints

| Endpoint | Method | Deskripsi |
|---|---|---|
| `/api/v1/ai/agents/data-agent` | POST/GET | DataAgent: CHAT, PRICE_RECOMMENDATION, REPORT_SUMMARY, INVOICE_CLASSIFY, AUTO_INVOICE, SMART_REMINDER, PR_ROUTING, GRN_CHECK, CONTRACT_ALERTS |
| `/api/v1/ai/agents/vision-agent` | POST/GET | VisionAgent OCR: kontrak, receipt, delivery, invoice, kwitansi |
| `/api/v1/ai/agents/nego-agent` | POST/GET | NegoAgent: analisis margin + approval + risk |
| `/api/v1/ai/agents/usage` | GET | Statistik penggunaan per agent, daily breakdown, top users |
| `/api/v1/ai/agents/error-stats` | GET | Error rate monitoring per agent + top errors |
| `/api/v1/ai/agents/automation/webhook` | POST | Supabase Database Webhook receiver |
| `/api/v1/ai/rekomendasi-supplier` | GET | Ranking supplier dengan score 0-100 |
| `/api/v1/ai/auto-suggest-barang` | GET | Auto-suggest barang by query + customer_id |
| `/api/v1/ai/price-trend` | GET | Grafik tren harga per barang_id |
| `/api/v1/ai/anomaly-detection` | GET | Deteksi anomaly transaksi |
| `/api/v1/cron/automation` | GET | Cron trigger: contract alerts + AR reminders |

### C. Pre-Sales

Modul ini menangani proses sebelum terjadinya penjualan, dengan tracking per PIC Customer.

**Jalur RFQ → Quotation → PO Customer:**

| Sub-Modul | Deskripsi |
|---|---|
| **RFQ (Request for Quotation)** | Merekam RFQ dari customer. Assign ke PIC Customer spesifik. Upload file RFQ jika ada |
| **Quotation** | Membuat penawaran harga. Dua model pricing: (1) Default: cost + 15% profit, (2) Manual: user tentukan sendiri. Bisa pilih hasil dari AI Search sebagai referensi harga beli. Nomor otomatis: `SPH/RRI/YY/MM/0001` |
| **Negosiasi** | Setelah Quotation dikirim, Procurement customer bisa negosiasi. Fitur: track history negosiasi, counter offer, approval internal |
| **Quotation → PO** | Konversi quotation yang deal menjadi PO customer — auto-generate Sales Order |

**Jalur Kontrak → DI (Delivery Instruction):**

| Sub-Modul | Deskripsi |
|---|---|
| **Kontrak Customer** | Kontrak fixed price list. Upload PDF → AI OCR → simpan harga kontrak. Assign PIC Customer |
| **DI (Delivery Instruction)** | Instruksi pengiriman dari customer berdasarkan kontrak. Assign PIC Customer |

### D. Sales Order & Pengiriman

| Sub-Modul | Deskripsi |
|---|---|
| **Sales Order (SO)** | Order penjualan internal (berdasarkan PO Customer atau DI). Auto-generate saat PO/DI deal |
| **Delivery Order (DO)** | Surat jalan untuk pengiriman barang. Nomor otomatis: `SJ/RRI/YY/MM/0001`. Auto-generate draft saat SO siap kirim |
| **Tracking Pengiriman** | Status pengiriman barang. Begitu DO status "Dikirim", auto-generate draft Invoice |
| **Retur Penjualan** | Barang dikembalikan oleh customer karena cacat/rusak/tidak sesuai. Proses: Retur → GRN Retur → Stok masuk → Invoice Adjustment / Refund. Dokumen: Nota Retur |
| **Barcode / QR Code** | Setiap DO bisa di-scan pakai HP gudang |

### E. Procurement / Pembelian

Modul ini menangani pembelian dari supplier — termasuk supplier marketplace Shopee & Tokopedia.

| Sub-Modul | Deskripsi |
|---|---|
| **Purchase Request (PR)** | Permintaan pembelian ketika stok tidak mencukupi. Auto-generate jika SO butuh barang yang stoknya kurang |
| **Supplier Search** | Cari supplier — bisa dari database seller existing, atau via AI Search (Shopee/Tokopedia) |
| **Purchase Order (PO)** | Order pembelian ke supplier. Untuk marketplace: field tambahan (link produk, nama toko, marketplace, no. resi) |
| **Receiving / Penerimaan Barang** | Penerimaan barang dari supplier, update stok |
| **GRN (Goods Received Note)** | Tanda terima barang |
| **Retur Pembelian** | Barang dikembalikan ke supplier karena cacat/tidak sesuai. Proses: Retur → DO Retur → Kirim ke supplier → Refund/Adjustment |
| **Supplier Payment** ✅ | Pembayaran ke supplier (termasuk bukti transfer) — `supplier_payment` table + API + halaman `/dashboard/procurement/supplier-payment` |
| **Approval Escalation** ✅ | Jika PR/PO tidak di-approve dalam 24 jam, auto-escalate ke atasan via notifikasi — Cron endpoint `/api/v1/cron/approval-escalation` + audit_log |

**Model Inventory:**
- **Default: Make-to-Order** — barang dibeli setelah PO Customer deal
- **Future: Gudang Fisik** — infrastruktur stok & gudang sudah disiapkan untuk scaling

### F. Inventory / Gudang (Future-Ready)

| Sub-Modul | Deskripsi |
|---|---|
| **Stok Masuk** | Barang masuk (dari pembelian) |
| **Stok Keluar** | Barang keluar (untuk penjualan) |
| **Stock Opname** ✅ | Opname stok fisik — `stock_opname` + `stock_opname_item` tables + API + halaman `/dashboard/inventory/stock-opname` |
| **Mutasi Baru** | Mutasi antar gudang |
| **Minimum Stock Alert** | Notifikasi stok minimum |
| **Kartu Stok** | Riwayat pergerakan stok per barang |

> **Catatan:** Saat MVP, inventory berjalan secara make-to-order. Modul gudang siap digunakan saat RRI mulai menyimpan stok fisik.

### G. Finance / Keuangan

| Sub-Modul | Deskripsi |
|---|---|
| **Accounts Receivable (AR)** | Piutang dagang — tagihan ke customer. Auto-reminder: H-7, H-3, H+1, H+7 via notifikasi in-app & WhatsApp. Aging berdasarkan **Terms of Payment** (TOP) |
| **Accounts Payable (AP)** | Hutang dagang — kewagiban bayar ke supplier. Aging berdasarkan TOP |
| **Cash & Bank** | Kas dan rekening bank. Mata uang: IDR (single currency untuk MVP) |
| **PPN & Pajak** | PPN 11% default di setiap Invoice & Quotation. PPh Pasal 22/23 jika berlaku. Auto-kalkulasi pajak di setiap transaksi |
| **Laporan PPN Masa** ✅ | Rekap PPN masa untuk pelaporan ke Kantor Pajak. Filter per bulan — Halaman `/dashboard/laporan/ppn-masa` + PDF export |
| **Faktur Pajak** | Generate nomor faktur pajak sesuai ketentuan Dirjen Pajak |
| **Jurnal Umum** | Jurnal transaksi keuangan. Auto-generate jurnal saat Invoice terbit (debit AR, credit Revenue, debit/kredit PPN) |
| **Laba / Rugi** | Laporan pendapatan dan biaya |
| **Neraca** | Laporan posisi keuangan |
| **Arus Kas** | Laporan cashflow |

### H. HR / Sumber Daya Manusia

| Sub-Modul | Deskripsi |
|---|---|
| **Absensi** | Kehadiran karyawan |
| **Penggajian** | Perhitungan gaji karyawan. Generate otomatis setiap tanggal 25 |
| **Slip Gaji** | Cetak slip gaji per periode |

### I. Dokumen PDF Otomatis

Semua dokumen berikut digenerate dalam format PDF yang bisa diprint dan disave:

| Dokumen | Nomor Format | Teks |
|---|---|---|
| **Quotation** | `SPH/RRI/YY/MM/0001` | Pre-Sales — termasuk PPN 11% |
| **Purchase Order (Internal)** | `PO/RRI/YY/MM/0001` | Procurement |
| **Delivery Order / Surat Jalan** | `SJ/RRI/YY/MM/0001` | Sales |
| **Invoice (Jalur PO)** | `INV/RRI/YY/MM/0001` | Finance — Dok: PO, DO, GRN, Invoice, Kwitansi. Termasuk PPN & PPh |
| **Invoice (Jalur DI)** | `INV/RRI/YY/MM/0001` | Finance — Dok: DI, DO, GRN, Invoice, Kwitansi. Termasuk PPN & PPh |
| **Goods Received Note (GRN)** | `GRN/RRI/YY/MM/0001` | Procurement / Inventory |
| **Kwitansi / Receipt** | `KWT/RRI/YY/MM/0001` | Finance |
| **Faktur Pajak** | Sesuai aturan Dirjen Pajak | Finance |
| **Nota Retur** | `RTJ/RRI/YY/MM/0001` (jual) / `RTB/RRI/YY/MM/0001` (beli) | Sales / Procurement |

**Ketentuan Nomor Dokumen:**
- Format: `{KODE}/{RRI}/{YY}/{MM}/{0001}`
- Setiap tahun berganti, nomor urut di-reset ke `/0001`
- Diimplementasikan dengan sequence/counter table PostgreSQL — di-reset otomatis setiap tahun via trigger atau cron job
- Contoh reset: Desember 2026 nomor `INV/RRI/26/12/0015`, Januari 2027 menjadi `INV/RRI/27/01/0001`

Format dokumen akan mengikuti template yang akan disediakan customer di direktori `/docs/templates/`.

### J. Dashboard & Laporan

Arsitektur dashboard role-based: setiap user melihat dashboard sesuai rolenya. Implementasi via server component yang mendeteksi role dari session user (`users.role`), lalu merender komponen dashboard yang sesuai.

**Owner Dashboard — Executive Command Center:**

Bukan sekedar 6 kartu statistik — dashboard Owner adalah command center yang memberikan visibilitas penuh ke semua aspek bisnis dalam satu layar:

| Section | Data | Tujuan |
|---|---|---|
| **Revenue & Profit** | Total revenue bulan ini, Laba/Rugi, perbandingan dengan bulan lalu | Performa bisnis real-time |
| **Pipeline** | Quotation outstanding, PO customer deal, SO aktif | Visibilitas order yang sedang berjalan |
| **Procurement** | PR dan PO pending | Tidak ada pembelian terlewat |
| **Finance** | AR outstanding + aging, AP outstanding, Faktur Pajak pending | Cashflow & kewajiban terpantau |
| **Inventory** | Total barang, total stok, stok kosong/minimum | Tahu potensi stop operasional |
| **Pending Actions** | Semua item butuh tindakan owner (PR/PO approval, retur pending) | Tidak ada yang terabaikan |
| **Recent Activity** | 5-10 transaksi terakhir dari semua modul | Konteks aktivitas hari ini |
| **Quick Actions** | Tombol shortcut sesuai konteks owner solo | Eksekusi cepat tanpa navigasi |

**Role-Specific Dashboards (Future-Ready):**

| Dashboard | Untuk Role |
|---|---|
| **Manager** | Ringkasan per modul, approval pending (PR, PO) |
| **Sales** | Pipeline order, RFQ → Quotation → Deal ratio, recent quotations |
| **Procurement** | PR/PO status, pending receiving & GRN |
| **Gudang** | Stok, barang kosong, DO pending |
| **Finance** | AR/AP, kwitansi bulan ini, faktur pajak pending |
| **Owner/Admin** | Executive Command Center — semua data dalam satu layar |
| Semua data bisa di-export ke Excel/CSV | Semua role |

> **Catatan:** Dashboard per role siap aktif kapanpun. Cukup set role user di database (`users.role`), sistem otomatis menampilkan dashboard yang sesuai. Owner dan Admin melihat Executive Command Center selama rolenya 'owner' atau 'admin'.

## 8. Automation & Smart Workflow

### 8.1 Rantai Otomatisasi
```
Quotation deal
  → Auto-generate Sales Order
  → Auto-generate Purchase Request (jika stok kurang)
  → Notifikasi ke Gudang & Procurement

DO status "Dikirim"
  → Auto-generate draft Invoice
  → Notifikasi ke Finance

Invoice terbit
  → Auto-buat Jurnal Penjualan (debit AR, credit Revenue)
  → Auto-update AR Aging

Invoice jatuh tempo
  → Auto-reminder H-7, H-3, H+1, H+7 via notifikasi
  → Escalasi ke Manager jika H+7 belum dibayar
```

### 8.2 Approval Escalation
- PR/PO pending > 24 jam → notifikasi Manager
- Invoice pending > 7 hari → escalation ke Owner

### 8.3 Smart Document Numbering
Nomor dokumen digenerate otomatis — tidak perlu input manual:
```
Quotation:  SPH/RRI/26/05/0001
DO:         SJ/RRI/26/05/0001
Invoice:    INV/RRI/26/05/0001
Kwitansi:   KWT/RRI/26/05/0001
```

### 8.4 WhatsApp Notification Integration

Notifikasi otomatis via WhatsApp API (Fonnte) untuk komunikasi dengan Customer & Supplier.

**Status Implementasi:** ✅ 4 trigger aktif — Quotation Terkirim, DO Dikirim, PO Supplier, AR Reminder (via Vercel Cron).

| Notifikasi | Trigger | Penerima | Status |
|---|---|---|---|
| **Quotation Terkirim** | Quotation berhasil dibuat | PIC Customer via WhatsApp | ✅ Aktif |
| **PO/DI Deal** ✅ | Customer deal & terbit PO/DI | PIC Customer (konfirmasi) | ✅ Aktif via API customer-po PUT |
| **DO Dikirim** | DO status "Dikirim" | PIC Customer — info no. resi & estimasi | ✅ Aktif |
| **AR Reminder H-7** | Invoice jatuh tempo H-7 | PIC Customer — pengingat tagihan | ✅ Aktif (Vercel Cron) |
| **AR Reminder H-3** | Invoice jatuh tempo H-3 | PIC Customer — pengingat | ✅ Aktif (Vercel Cron) |
| **AR Overdue H+1** | Invoice lewat jatuh tempo | PIC Customer + Finance | ✅ Aktif (Vercel Cron) |
| **AR Overdue H+7** | Invoice lewat 7 hari | PIC Customer + Manager | ✅ Aktif (Vercel Cron) |
| **PO ke Supplier** | PO terbit ke supplier marketplace | Supplier via WhatsApp (informasi) | ✅ Aktif |
| **Approval Request** ✅ | PR/PO pending approval | Manager via WhatsApp | ✅ Aktif via API purchase-request POST |

**Implementasi:**
- **Utility:** `src/lib/utils/whatsapp.ts` — fungsi `sendWhatsapp(recipient, message, userId?)` yang memanggil Fonnte API (`POST https://api.fonnte.com/send`) dan mencatat ke tabel `whatsapp_log`.
- **Cron Job:** `src/app/api/v1/cron/ar-reminder/route.ts` — endpoint yang dipanggil Vercel Cron setiap hari pukul 01:00 UTC (08:00 WIB). Logic: cek semua invoice aktif, hitung due date dari `tanggal + top`, kirim WA sesuai selisih hari.
- **Schedule:** `vercel.json` — `"0 1 * * *"` (setiap hari jam 1 AM UTC = 8 AM WIB).
- **Log:** Semua pengiriman tercatat di tabel `whatsapp_log` untuk monitoring.
- **Halaman:** `/dashboard/notifikasi` — riwayat notifikasi WhatsApp.

**Catatan Biaya:** Fonnte menyediakan **500 pesan gratis per hari** – lebih dari cukup untuk kebutuhan ERP RRI (estimasi ~20 pesan/hari). Vercel Cron gratis di Hobby Plan (maks 1x/hari).

## 9. Professional Features

| Fitur | Deskripsi |
|---|---|
| **Audit Trail** | Setiap create/update/delete tercatat: siapa, kapan, IP, data sebelum & sesudah. Tidak bisa dihapus |
| **Activity Log** | Timeline per transaksi — lihat histori lengkap satu SO/PO/Invoice dari awal sampai selesai |
| **Digital Approval** | Approve/Reject dengan digital signature (nama + timestamp) |
| **Global Search** | Satu search bar (shortcut `/` atau `Cmd+K`) untuk mencari di 28 tabel: barang, customer, supplier, karyawan, PO, PR, SO, Customer PO, DO, Invoice, Quotation, RFQ, DI, GRN, Faktur Pajak, Kwitansi, Retur Jual/Beli, Jurnal, Negosiasi, Kontrak, Absensi, COA, Jabatan, Kategori Barang, Gudang, PIC Customer, Stock Opname, Pembayaran Supplier, Penggajian |
| **Export Excel / CSV** | Semua halaman list data bisa di-export — Owner & Manager sering minta data dalam Excel |
| **Bulk Import Excel** ✅ | Input master data barang, supplier, customer via upload file Excel — Halaman `/dashboard/tools/bulk-import` |
| **Dark Mode** | Toggle dark/light mode — nyaman dipakai malam hari |
| **Keyboard Shortcuts** | Power user: `Ctrl+N` = Baru, `Ctrl+S` = Simpan, `/` = Fokus global search, `Escape` = Tutup modal |
| **Print-Friendly CSS** | Halaman dokumen langsung bisa di-print rapi dari browser tanpa perlu PDF |
| **Loading Skeleton** | Tidak ada spinner — skeleton loading memberikan kesan profesional |
| **User Management** ✅ | CRUD user, assign role, toggle active/non-active, edit profile. API: `/api/v1/admin/users`. Halaman: `/dashboard/system/users` |
| **Role-Based Navigation** ✅ | Sidebar & menu menyesuaikan role user — tidak lihat menu yang bukan haknya. Implementasi filter by role di `sidebar-nav.tsx` |
| **User Onboarding** | Walkthrough interaktif saat pertama login — user baru langsung paham cara pakai ERP. Tur 12 step dalam 6 grup mencakup semua modul. Tombol "Panduan" permanen di sidebar untuk replay. Bisa dinonaktifkan/aktifkan via profil (field `onboarding_disabled` di tabel `users`) |
| **Multi-Bahasa (future)** | Persiapan i18n jika nanti ada customer atau kebutuhan internasional |
| **Maintenance Mode** | Satu toggle di settings — user lihat halaman "Sedang Perbaikan" |
| **Soft Delete** | Semua data hanya di-soft-delete (`deleted_at`), tidak pernah hilang permanen |
| **Data Archiving** | Data lama (>1 tahun) bisa di-archive ke tabel khusus atau bucket storage khusus untuk mengoptimasi performa query utama. Proses archiving bisa dijadwalkan bulan sekali. |
| **System Health Monitoring** ✅ | Monitoring uptime, error rate, database health, storage usage — Halaman `/dashboard/system/health` + API `/api/v1/system/health` |

## 10. User Roles & Hak Akses

| Role | Akses Utama |
|---|---|
| **Owner** | ALL — semua modul, laporan keuangan, dashboard utama, audit trail |
| **Admin** | Master data, user management ✅, konfigurasi sistem, maintenance mode |
| **Manager** | Approval PR/PO, approval retur, escalation, laporan operasional, dashboard |
| **Sales** | Pre-Sales (RFQ, Quotation, Negosiasi), Sales Order, Retur Penjualan, lihat stok |
| **Procurement** | PR, PO, Retur Pembelian, AI Search, Supplier management, Receiving |
| **Gudang** | Stok masuk/keluar, opname, delivery order, retur, scan barcode |
| **Finance** | Invoice, AP/AR, PPN, Faktur Pajak, pembayaran, jurnal, laporan keuangan |
| **HR** | Data karyawan, absensi, penggajian |

## 11. Alur Bisnis End-to-End

### Jalur A — Kontrak (Fixed Price)

```
START
  ↓
Customer buat KONTRAK (fixed price list)
  → Upload PDF kontrak → AI OCR → simpan harga ke database
  → Assign PIC Customer
  ↓
Customer kirim DI (Delivery Instruction) — assign PIC Customer
  ↓
Auto-generate SALES ORDER (dengan TOP dari kontrak)
  ↓
Cek: Apakah stok tersedia?
  ├── YES → Auto-generate DO → Kirim barang
  └── NO  → Auto-generate PURCHASE REQUEST
        ├── AI Search harga Shopee/Tokopedia
        ├── Manager approve PR (escalation 24 jam jika pending)
        ├── Purchase Order (PO) ke supplier (nomor: PO/RRI/YY/MM/0001)
        ├── Checkout & bayar di Shopee/Tokopedia (manual)
        ├── Barang datang → Receiving → GRN → Stok masuk
        └── Lanjut auto-generate DO
  ↓
DELIVERY ORDER (DO) — Surat Jalan (nomor: SJ/RRI/YY/MM/0001)
  ↓
Barang dikirim ke Customer
  ↓
Customer beri GRN (tanda terima)
  ↓
DO status "Dikirim" → Auto-generate INVOICE
  ↓
INVOICE + KWITANSI (nomor: INV/RRI/YY/MM/0001, KWT/RRI/YY/MM/0001)
Dokumen: DI, DO, GRN customer, Invoice, Kwitansi
Termasuk PPN 11% dan PPh (jika berlaku)
  ↓
Auto-buat JURNAL (debit AR, credit Revenue, credit PPN)
  ↓
Finance: Tagih Customer (AR) — Auto-reminder jatuh tempo
  ↓
END
```

### Jalur B — Non-Kontrak (RFQ)

```
START
  ↓
Customer kirim RFQ — assign PIC Customer
  ↓
RRI cari harga supplier (AI Search Shopee/Tokopedia / manual)
  ↓
RRI buat QUOTATION (nomor: SPH/RRI/YY/MM/0001)
  → Harga: Default (cost + 15%) atau Manual
  → Kirim Quotation ke Customer
  ↓
Negosiai? ← Procurement customer nego harga
  ├── YES → Counter offer → Approve internal → Kirim ulang
  └── NO  → LANJUT
  ↓
Customer SETUJU (deal) → Customer terbitkan PO (TOP sesuai master customer)
  ↓
Auto-generate SALES ORDER
  ↓
Cek stok → jika kurang → PROCUREMENT FLOW (sama seperti Jalur A)
  ↓
Auto-generate DO → Kirim barang
  ↓
Customer GRN → Auto-generate INVOICE
  ↓
INVOICE + KWITANSI
Dokumen: PO Customer, DO, GRN customer, Invoice, Kwitansi
Termasuk PPN 11% dan PPh (jika berlaku)
  ↓
Auto-buat JURNAL (debit AR, credit Revenue, credit PPN) + Auto-reminder AR
  ↓
END
```

### Jalur C — Retur Penjualan (dari Customer)

```
Customer kirim barang retur (cacat/tidak sesuai)
  ↓
Gudang terima retur → GRN Retur
  ↓
Cek kondisi barang:
  ├── Ganti barang baru → buat DO Replacement → kirim ke customer
  └── Refund → buat Nota Retur → adjust Invoice / Refund
  ↓
Stok masuk kembali (jika barang masih layak)
  ↓
Finance: Buat Jurnal Retur
  ↓
END
```

### Jalur D — Retur Pembelian (ke Supplier)

```
Barang dari supplier cacat/tidak sesuai
  ↓
Buat Nota Retur Pembelian
  ↓
DO Retur → Kirim barang ke supplier
  ↓
Supplier:
  ├── Ganti barang baru → Receiving GRN
  └── Refund → Adjustment AP / Cash
  ↓
Stok keluar (retur)
  ↓
END
```

## 12. Arsitektur Aplikasi

### 12.1 Struktur Folder

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (<html><body>)
│   ├── page.tsx                  # (tidak ada — root / di-handle middleware)
│   ├── middleware.ts             # Auth middleware (protects /dashboard routes)
│   ├── (auth)/                   # Public pages (login, register)
│   ├── dashboard/                # Protected pages (BUKAN route group)
│   │   ├── layout.tsx            # Dashboard layout (sidebar navigasi)
│   │   ├── page.tsx              # Dashboard home (menu cards ke semua modul)
│   │   ├── master/
│   │   │   ├── barang/           # List, tambah, edit
│   │   │   ├── kategori-barang/  # (future)
│   │   │   ├── supplier/         # (future)
│   │   │   ├── customer/         # (future)
│   │   │   ├── pic-customer/     # (future)
│   │   │   ├── karyawan/         # (future)
│   │   │   ├── coa/              # (future)
│   │   │   ├── kontrak/          # (future)
│   │   │   └── harga/            # (future)
│   │   ├── pre-sales/            # (future)
│   │   ├── sales/                # (future)
│   │   ├── procurement/          # (future)
│   │   ├── inventory/            # (future)
│   │   ├── finance/              # (future)
│   │   ├── hr/                   # (future)
│   │   ├── ai/                   # (future)
│   │   ├── dokumen/              # (future)
│   │   ├── laporan/              # (future)
│   │   └── settings/             # (future)
│   └── api/
│       ├── api-docs/             # Scalar UI documentation
│       │   └── route.ts
│       └── v1/
│           ├── master/           # Route handlers per entity
│           │   ├── barang/route.ts + [id]/route.ts
│           │   ├── supplier/route.ts + [id]/route.ts
│           │   ├── customer/route.ts + [id]/route.ts
│           │   ├── pic-customer/route.ts + [id]/route.ts
│           │   ├── coa/route.ts + [id]/route.ts
│           │   ├── kontrak/route.ts + [id]/route.ts
│           │   ├── kategori-barang/route.ts + [id]/route.ts
│           │   ├── jabatan/route.ts + [id]/route.ts
│           │   └── karyawan/route.ts + [id]/route.ts
│           ├── pre-sales/         # (future)
│           ├── sales/             # (future)
│           ├── procurement/       # (future)
│           ├── inventory/         # (future)
│           ├── finance/           # (future)
│           ├── hr/                # (future)
│           ├── ai/                # (future)
│           ├── dokumen/           # (future)
│           └── laporan/           # (future)
├── public/
│   └── openapi.json              # Auto-generated OpenAPI spec
├── components/
│   ├── ui/                       # shadcn/ui components (installed via CLI)
│   ├── forms/                    # Form components
│   ├── tables/                   # Table components
│   ├── layout/                   # Layout components
│   ├── pdf/                      # PDF components
│   ├── onboarding/               # User onboarding (react-joyride tour)
│   └── shared/                   # Shared components
├── lib/
│   ├── api/
│   │   ├── client.ts             # Frontend API client (apiFetch — auto-attach Bearer token)
│   │   ├── auth.ts               # verifyAuth() untuk API route handlers
│   │   ├── errors.ts             # HTTP error response helpers
│   │   └── supabase-server.ts    # Supabase admin client (service_role key)
│   ├── db/
│   │   ├── schema/               # Drizzle schema files
│   │   ├── migrations/           # Database migrations
│   │   └── client.ts             # Supabase client (anon key)
│   ├── actions/                  # Server Actions (future)
│   ├── ai/                       # AI Agent integration (future)
│   ├── pdf/                      # PDF components (future)
│   ├── services/                 # Business logic layer (future)
│   ├── utils/
│   │   └── document-number.ts    # generateDocumentNumber() utility
│   └── validations/              # Zod schemas (future)
├── hooks/                        # Custom React hooks (future)
├── store/                        # Zustand stores (future)
├── types/                        # TypeScript type definitions (future)
└── styles/                       # Global CSS (future)
```

### 12.2 API Architecture

#### 12.2.1 Pola Hybrid: Server Components + API Routes

ERP RRI menggunakan **pola hybrid** untuk mengoptimalkan performa dan keamanan:

| Lapisan | Method | Database Client | Use Case |
|---------|--------|---------------|----------|
| **Server Components** | Direct Supabase (server-side) | `supabase` (anon key) | List pages — read-only, render di server, cepat |
| **Client Components** | `apiFetch()` → API Routes | `supabaseAdmin` (service_role) | Form tambah/edit — mutations via API, centralized logic |

**Alur Request:**
```
Browser
  ↓
Next.js Server
  ├── Server Component (list) → supabase.from('table').select()  ← langsung ke DB
  └── Client Component (form) → fetch('/api/v1/...') → Route Handler
        ↓
      verifyAuth(request)  ← Bearer JWT dari supabase.auth.getSession()
        ↓
      supabaseAdmin.from('table').insert/update/delete()  ← service_role key
        ↓
      Response JSON
```

#### 12.2.2 Autentikasi API

Semua API route mewajibkan **Bearer JWT token** yang diverifikasi via `verifyAuth()`:

```
Header: Authorization: Bearer <access_token>
```

Token didapat dari `supabase.auth.getSession()` — auto-attached oleh `apiFetch()`.

#### 12.2.3 API Route Pattern

Setiap entity master memiliki 2 file route handler:

```
/api/v1/master/barang/route.ts        → GET (list), POST (create)
/api/v1/master/barang/[id]/route.ts   → GET (detail), PUT (update), DELETE
```

**Pattern Route Handler:**
```typescript
// GET /api/v1/master/barang
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)      // verify JWT
  const data = await supabaseAdmin            // service_role client
    .from('barang')
    .select('*')
  return NextResponse.json({ data })
}

// POST /api/v1/master/barang
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)      // verify JWT
  const body = await request.json()
  const parsed = schema.parse(body)           // Zod validation
  const { data } = await supabaseAdmin
    .from('barang')
    .insert(parsed)
    .select()
    .single()
  return NextResponse.json({ data })
}
```

**Key Files:**
| File | Fungsi |
|------|--------|
| `src/lib/api/client.ts` | `apiFetch()` — frontend HTTP client, auto-attach token |
| `src/lib/api/auth.ts` | `verifyAuth()` — verifikasi Bearer JWT dari request headers |
| `src/lib/api/errors.ts` | Helper response: 400, 401, 404, 409, 500 |
| `src/lib/api/supabase-server.ts` | `supabaseAdmin` — Supabase client dengan service_role key |

#### 12.2.4 OpenAPI Documentation (Auto-Generated)

**Setup:**
```bash
npx next-openapi-gen init               # Init config: next.openapi.json
npx next-openapi-gen                    # Generate openapi.json dari route handlers
```

**Output:**
- `/public/openapi.json` — Raw OpenAPI 3.0 spec (auto-generated)
- `/api-docs` — Scalar UI (interactive API documentation with "Try It" feature)

**Scalar UI Config:**
```typescript
// src/app/api-docs/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  url: '/openapi.json',
  metaData: {
    title: 'ERP RRI - API Documentation',
    description: 'REST API documentation for ERP RRI system',
  },
}

export const GET = ApiReference(config)
```

**Akses:** Buka `http://localhost:3000/api-docs` → Interactive API docs dengan Scalar UI.

#### 12.2.5 Document Numbering

**Utility:** `src/lib/utils/document-number.ts`

```typescript
import { generateDocumentNumber } from '@/lib/utils/document-number'

// Menghasilkan: SPH/RRI/26/05/0001
const nomor = await generateDocumentNumber('SPH')
```

**Cara Kerja:**
1. Panggil PostgreSQL function `increment_document_counter(p_kode_dokumen, p_tahun, p_bulan)`
2. Function melakukan atomic upsert + increment counter
3. Return formatted string: `{KODE}/RRI/{YY}/{MM}/{0000}`
4. Counter di-reset otomatis setiap tahun/bulan berganti

#### 12.2.6 Authentication Architecture

**Pattern: Client-Side Auth with Supabase Auth**

ERP RRI uses **client-side authentication** via Supabase Auth with an `AuthProvider` context:

| File | Fungsi |
|------|--------|
| `src/lib/hooks/use-auth.tsx` | Auth context provider + `useAuth` hook — wraps `onAuthStateChange` listener |
| `src/app/dashboard/auth-guard-client.tsx` | `AuthGuardClient` — client component that checks `isAuthenticated`, shows loading spinner, redirects to `/login` if not authenticated |
| `src/app/dashboard/layout.tsx` | Dashboard layout wraps with `AuthGuardClient` for route protection |
| `src/app/(auth)/login/page.tsx` | Uses `router.push('/dashboard')` after successful `signInWithPassword` |

**Why Client-Side Auth instead of Middleware:**
- Previous middleware approach used `supabase.auth.getUser()` which made network calls that could timeout
- This caused the Node.js server to hang at 120% CPU when many requests came in
- Client-side auth with `onAuthStateChange` is event-driven and doesn't block the server

**Security Note:**
- Supabase stores tokens in httpOnly cookies (NOT localStorage)
- `onAuthStateChange` detects valid sessions from cookies
- API routes still verify JWT via `verifyAuth()` — security maintained
- For production with multiple users, RLS policies can be added at the database level

**Auth Flow:**
```
Login page → signInWithPassword() → onAuthStateChange detects SIGNED_IN 
  → router.push('/dashboard') → AuthGuardClient checks isAuthenticated 
  → shows dashboard if authenticated, redirects to /login if not
```

**Middleware (simplified):**
```typescript
// src/middleware.ts — only redirects root to login, no auth checks
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|login|register|api).*)'],
}
// No auth logic here — delegated to AuthGuardClient
```

**Key Implementation Details:**
- `AuthProvider` combines React Context with Supabase's `onAuthStateChange` 
- `AuthGuardClient` is a client component that uses the auth context to protect routes
- Loading state shows spinner while checking authentication
- Automatic redirect to `/login` when session is invalid

### 12.3 Struktur Database (Tabel)

```
users                    → auth + profil (semua role)
user_roles               → mapping user ke role

barang                   → master barang
kategori_barang          → kategori barang
satuan                   → satuan barang

supplier                 → data supplier (termasuk marketplace)
supplier_kontak          → multiple kontak supplier

customer                 → data customer
customer_pic             → multiple PIC per customer
customer_top             → terms of payment per customer (net_30, net_60, cash, custom)

karyawan                 → data karyawan RRI
jabatan                  → master jabatan

coa                      → chart of accounts

kontrak                  → kontrak customer
kontrak_item             → daftar barang + harga dalam kontrak (termasuk harga sudah include/exclude PPN)
kontrak_file             → file PDF kontrak yang diupload

rfq                      → request for quotation
rfq_item                 → item dalam rfq
rfq_pic                  → assign PIC customer ke rfq

quotation                → penawaran harga (field: ppn_rate default 11%)
quotation_item           → item dalam quotation (field: harga_satuan, diskon, ppn_per_item)
quotation_pic            → assign PIC customer ke quotation

negosiasi                → riwayat negosiasi
negosiai_item            → detail item yang dinegosiasi

customer_po              → po dari customer
customer_po_item         → item dalam po customer
customer_po_pic          → assign PIC customer ke po

di                       → delivery instruction
di_item                  → item dalam di
di_pic                   → assign PIC customer ke di

sales_order              → sales order internal
sales_order_item         → item dalam so

delivery_order           → surat jalan
delivery_order_item      → item dalam do

grn                      → goods received note (dari customer)
grn_item                 → item dalam grn

retur_penjualan          → retur dari customer
retur_penjualan_item     → item retur
retur_penjualan_dokumen  → dokumen retur

retur_pembelian          → retur ke supplier
retur_pembelian_item     → item retur
retur_pembelian_dokumen  → dokumen retur

purchase_request         → permintaan pembelian
purchase_request_item

purchase_order           → po ke supplier
purchase_order_item      → item dalam po
                         (field: link_produk, nama_toko, marketplace, no_resi)

purchase_receiving       → penerimaan barang
purchase_receiving_item

invoice                  → invoice penjualan (field: top, ppn_rate default 11%, pph_rate optional)
invoice_item             → item dalam invoice (field: harga, diskon, ppn, pph)
invoice_dokumen          → dokumen kelengkapan (PO, DI, DO, GRN)

faktur_pajak             → data faktur pajak
faktur_pajak_item        → item faktur pajak

kwitansi                 → receipt
kwitansi_item            → item dalam kwitansi

stok                     → kartu stok / pergerakan stok
gudang                   → master gudang (untuk future)

jurnal                   → jurnal umum
jurnal_item              → detail jurnal

absensi                  → kehadiran
penggajian               → data gaji

document_counter         → counter nomor dokumen per tahun

ai_search_history        → riwayat pencarian AI
ai_search_result         → hasil scraping (nama, harga, toko, link, marketplace)
ai_ocr_history           → riwayat OCR kontrak

audit_log                → audit trail semua transaksi
whatsapp_log             → log pengiriman notifikasi WhatsApp (status: terkirim/gagal)
```

### 12.4 Nomor Dokumen Otomatis

Implementasi counter di PostgreSQL:

```sql
CREATE TABLE document_counter (
  kode_dokumen TEXT NOT NULL,   -- SPH, SJ, INV, KWT, PO, GRN, RTJ, RTB
  tahun INTEGER NOT NULL,       -- 2026
  bulan INTEGER NOT NULL,       -- 1-12
  counter INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (kode_dokumen, tahun, bulan)
);
```

Fungsi `increment_document_counter()` di PostgreSQL:

```sql
CREATE OR REPLACE FUNCTION increment_document_counter(
  p_kode_dokumen TEXT,
  p_tahun INTEGER,
  p_bulan INTEGER
) RETURNS TEXT AS $$
DECLARE
  v_counter INTEGER;
  v_nomor TEXT;
BEGIN
  INSERT INTO document_counter (kode_dokumen, tahun, bulan, counter)
  VALUES (p_kode_dokumen, p_tahun, p_bulan, 1)
  ON CONFLICT (kode_dokumen, tahun, bulan)
  DO UPDATE SET counter = document_counter.counter + 1
  RETURNING counter INTO v_counter;

  v_nomor := UPPER(p_kode_dokumen) || '/RRI/' ||
             TO_CHAR(p_tahun, 'FM00') || '/' ||
             TO_CHAR(p_bulan, 'FM00') || '/' ||
             LPAD(v_counter::TEXT, 4, '0');
  RETURN v_nomor;
END;
$$ LANGUAGE plpgsql;
```

**Usage dari TypeScript:**
```typescript
import { generateDocumentNumber } from '@/lib/utils/document-number'

// Output: "SPH/RRI/26/05/0001"
const nomor = await generateDocumentNumber('SPH')
```

## 13. Prioritas Pengembangan (MVP)

| Fase | Modul | Estimasi |
|---|---|---|
| **Fase 1** | Setup Project + Auth + Master Data + Document Counter + API Routes + OpenAPI/Scalar + UI/UX Design System | ✅ Selesai |
| **Fase 2** | Pre-Sales (RFQ, Quotation, Negosiasi) + Sales (SO, DO) | ✅ Selesai |
| **Fase 3** | Procurement (PR, PO, Receiving, GRN, Retur Beli) + Document Numbering | ✅ Selesai |
| **Fase 4** | Finance (Invoice, Kwitansi, Faktur Pajak, Jurnal) + PDF Generation (Invoice, Kwitansi, Quotation, DO, Slip Gaji) + Financial Reports (AR/AP Aging, Laba/Rugi, Neraca, Arus Kas) | ✅ Selesai |
| **Fase 5** | AI Agent (Search Harga Playwright, OCR Kontrak, Rekomendasi Harga, Negosiasi Assistant) | ✅ Selesai |
| **Fase 6** | HR (Absensi, Penggajian, Slip Gaji) + Dashboard Owner (Executive Command Center) + Dashboard Manager/Sales/Procurement/Gudang/Finance (role-based, future-ready) + Export Excel/CSV + Audit Trail + Global Search + PDF Quotation & DO | ✅ Selesai |
| **Fase 7** | WhatsApp Notifikasi (Fonnte) + Retur Penjualan + User Onboarding (react-joyride) | ✅ Selesai |
| **Fase 8** | Professional polish (Dark mode, shortcuts, skeleton, print CSS) + Testing Setup + Deploy Vercel | ✅ Selesai (Testing & Deploy dilewati) |

## 14. Testing Strategy

| Level | Tools | Scope |
|---|---|---|
| **Unit Test** | Vitest + React Testing Library | Validasi form (Zod schemas), utility functions, server actions logic, Drizzle query helpers |
| **Integration Test** | Vitest + MSW (Mock Service Worker) | API endpoints, database queries, state management (Zustand stores + TanStack Query) |
| **E2E Test** | Playwright | Full user flow: login → buat Quotation → approve → generate PDF. Critical paths: RFQ to Invoice flow |
| **Component Test** | Storybook (opsional) | Visual testing untuk komponen UI kompleks (TanStack Table, form multi-step) |

### Testing Prioritas

| Prioritas | Area | Alasan |
|---|---|---|
| **P1** | Form validation (Zod schemas) | Mencegah data invalid masuk database |
| **P1** | Server Actions (CRUD) | Operasi inti aplikasi |
| **P1** | Document numbering logic | Nomor dokumen harus akurat & unik |
| **P1** | Auth & RBAC | Keamanan akses |
| **P2** | AI Search trigger | Integrasi dengan Playwright |
| **P2** | Auto-generate chain (SO→DO→Invoice) | Automation workflow |
| **P2** | PPN calculation | Akurasi pajak |
| **P3** | WhatsApp notification | Notifikasi tidak kritikal |
| **P3** | E2E full flow | Regression testing |

### CI/CD Pipeline

```
Push ke branch → GitHub Actions:
  ├── Lint (ESLint + Prettier)
  ├── Type Check (TypeScript)
  ├── Unit Test (Vitest)
  ├── Build (next build)
  └── Deploy ke Vercel Preview (jika branch fitur)
```

## 15. Deployment Model: Owner Solo (2026)

### 15.1 Konteks

Saat peluncuran awal, PT. RRI belum memiliki karyawan tetap — Owner menjalankan seluruh operasional sendiri. Ini adalah model **Owner Solo**: satu user dengan role `owner` mengerjakan semua fungsi bisnis (Sales, Procurement, Gudang, Finance, HR).

### 15.2 Dampak pada Aplikasi

| Area | Penyesuaian |
|---|---|
| **Dashboard** | Owner melihat **Executive Command Center** — gabungan semua informasi dari semua role dalam satu layar. Bukan dashboard role-specific |
| **Navigasi Sidebar** | Owner melihat semua menu tanpa filter — akses penuh ke semua modul |
| **Approval Workflow** | Owner auto-approve untuk dirinya sendiri. Tidak perlu approval chain karena tidak ada Manager terpisah |
| **Notifikasi** | Semua notifikasi dikirim ke Owner. Tidak ada escalation routing |
| **Role Management** | Role 'owner' memiliki akses ALL. Role lain (sales, procurement, dll) tetap ada di database tapi belum dipakai |

### 15.3 Transisi ke Model Berkaryawan

Ketika RRI mulai merekrut karyawan tetap:

1. **Buat user baru** di halaman Register (atau via Admin) dengan role spesifik (sales, procurement, gudang, finance, dll)
2. **Set role** di database `users.role` → sistem otomatis menampilkan dashboard & navigasi yang sesuai
3. **Approval workflow aktif** — PR/PO butuh approval Manager, escalation berjalan
4. **Role-specific dashboard** langsung tampil tanpa perubahan kode

> **Filosofi Desain:** Semua fitur role-based dibangun dari awal (future-ready). Owner Solo bukan mode terbatas — melainkan model di mana semua informasi dikonsolidasikan ke satu layar. Ketika perusahaan tumbuh, sistem siap tanpa rewrite.

### 15.4 Arsitektur Role Detection

```
Server Component (/dashboard/page.tsx)
  → cookies().get('sb-access-token')
  → supabase.auth.getUser(token)
  → supabase.from('users').select('role').eq('id', user.id).single()
  → render dashboard sesuai role:
      owner/admin → ExecutiveCommandCenter
      manager     → ManagerDashboard
      sales       → SalesDashboard
      procurement → ProcurementDashboard
      gudang      → GudangDashboard
      finance     → FinanceDashboard
      fallback    → ExecutiveCommandCenter (default aman)
```

### 15.5 Role Detection: Owner vs Admin

Role `owner` dan `admin` sama-sama melihat **Executive Command Center** — dashboard penuh dengan semua data bisnis. Tidak ada filter atau batasan untuk kedua role ini. Perbedaan hanya di hak akses menu samping (sidebar):

- **Owner** — melihat semua menu tanpa pengecualian
- **Admin** — fokus ke master data, user management, dan konfigurasi sistem

Di kode dashboard router, role `admin` tidak dicek secara explicit sehingga fallback ke default — yaitu Executive Command Center (sama dengan Owner).

## 16. Akun Role untuk Testing

| Role | Email | Password | Dashboard |
|---|---|---|---|
| Owner | owner@rri.com | rri123456 | Executive Command Center |
| Admin | admin@rri.com | rri123456 | Executive Command Center |
| Manager | manager@rri.com | rri123456 | Manager Dashboard |
| Sales | sales@rri.com | rri123456 | Sales Dashboard |
| Procurement | procurement@rri.com | rri123456 | Procurement Dashboard |
| Gudang | gudang@rri.com | rri123456 | Gudang Dashboard |
| Finance | finance@rri.com | rri123456 | Finance Dashboard |

Semua akun di atas dapat digunakan untuk login di halaman `/login` dan akan langsung diarahkan ke dashboard sesuai role masing-masing.

---
**Catatan Teknis:** Nomor dokumen dengan reset tahunan sangat mudah diimplementasikan di PostgreSQL/Supabase. Cukup gunakan tabel counter atau sequence yang di-reset via trigger setiap pergantian tahun.