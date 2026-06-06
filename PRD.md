# PRD: ERP PT. RIZKI RIDHO ILAHI

**Versi:** 5.5
**Status:** Draft
**Tanggal:** 1 Juni 2026

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
| Background Jobs | cron-job.org (free, 60 req/hour) + Vercel Serverless Functions |
| Cache | Redis (Upstash) |
| Notifikasi In-App | sonner |
| Notifikasi WhatsApp | Fonnte (gratis 500 msg/hari) — sudah implementasi dengan 3 trigger: Quotation, DO Dikirim, PO Supplier |
| AI Agent | NVIDIA NIM (free tier) — 3 agent architecture: NegoAgent (stepfun-ai/step-3.5-flash), DataAgent (minimaxai/minimax-m2.7), VisionAgent (microsoft/phi-4-multimodal-instruct) |
| Testing (Unit) | Vitest |
| Testing (E2E) | Playwright |
| Storage | Google Drive API (Shared Drive) — all files via Service Account |
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
File storage menggunakan **Supabase Storage** — bucket `dokumen` yang sudah ada di project Supabase yang sama.

**Alasan:**
- **1GB gratis** — cukup untuk ~1-2 tahun ERP RRI (estimasi ~800MB/tahun)
- **Tanpa kartu kredit** — langsung aktif dengan project Supabase yang sudah berjalan
- **Terintegrasi** — pakai `supabaseAdmin` yang sama dengan API routes lainnya
- **Public URL** built-in — setiap file langsung punya URL publik yang bisa di-share
- **CDN** — file di-serve via CDN Supabase

**Catatan:** Jika suatu saat melebihi 1GB, upgrade ke Pro plan ($25/bulan) dapat 100GB.

### 5.2 Struktur Folder di Supabase Storage

```
Bucket: dokumen
├── dokumen/rfq-customer/{id}/{file}.pdf              # RFQ Customer documents
├── dokumen/rfq-supplier/{id}/{file}.pdf               # RFQ Supplier documents
├── dokumen/quotation/{id}/{file}.pdf                  # Quotation documents
├── dokumen/customer-po/{id}/{file}.pdf                # Customer PO documents
├── dokumen/kontrak/{id}/{file}.pdf                    # Kontrak documents (all jenis)
├── dokumen/di/{id}/{file}.pdf                         # Delivery Instruction documents
├── dokumen/sales-order/{id}/{file}.pdf                # Sales Order documents
├── dokumen/delivery-order/{id}/{file}.pdf             # Delivery Order documents
├── dokumen/delivery-order/{id}/barang_diterima-{timestamp}-{file}  # Foto barang diterima customer (verifikasi)
├── dokumen/delivery-order/{id}/surat_jalan-{timestamp}-{file}      # Foto surat jalan ditandatangani (verifikasi)
├── dokumen/invoice/{id}/{file}.pdf                    # Invoice documents
├── dokumen/grn/{id}/{file}.pdf                        # GRN documents
├── dokumen/retur-penjualan/{id}/{file}.pdf            # Retur Penjualan documents
├── dokumen/retur-pembelian/{id}/{file}.pdf            # Retur Pembelian documents
├── dokumen/ocr-kontrak/{timestamp}-{file}.pdf         # AI OCR temporary uploads
├── dokumen/temp/rfq-customer/rfq/{timestamp}-{file}.  # Temp upload pre-creation RFQ
├── dokumen/temp/rfq-customer/gambar/{timestamp}-{file} # Temp upload item images
├── avatars/{userId}/{timestamp}-avatar.jpg
├── barang/{barangId}/{timestamp}-foto-1.webp
└── temporary/{sessionId}/{file}.xlsx
```

### 5.3 Optimasi Penyimpanan

| Teknik | Implementasi | Manfaat |
|---|---|---|
| **Compress sebelum upload** | `browser-image-compression` library di client-side | Ukuran file turun 60-80% |
| **Konversi ke WebP** | Semua gambar otomatis dikonversi ke format WebP | Ukuran file turun 30% tambahan |
| **Delete file lama** | Setiap update file: hapus file existing di Storage, baru upload yang baru | Tidak ada file sampah menumpuk |
| **Max dimensi** | Foto barang: max 1920px. Avatar: max 200px. Foto profil: max 600px | File size terkontrol |
| **Max file size** | Client-side + server-side validation: Foto = max 5MB, Dokumen PDF = max 10MB | Mencegah abuse |
| **Whitelist tipe file** | Hanya izinkan: `image/jpeg`, `image/png`, `image/webp`, `application/pdf` | Keamanan storage |
| **Public URL** | Setiap file punya public URL via `getPublicUrl()` | Share ke supplier/customer tanpa login |

### 5.4 Arsitektur Upload File

```
┌──────────────────────────────────────────────────────────┐
│ Client (Browser)                                         │
│ upload file → FormData → apiFetchFormData()              │
└────────────────────┬─────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│ API Route (Next.js)                                      │
│ verifyAuth() → validasi tipe/ukuran → buffer             │
│ → StorageService.upload(buffer, path, mimeType)          │
│ → simpan fileUrl ke DB (public URL)                      │
│ → return response                                        │
└────────────────────┬─────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│ StorageService (src/lib/storage/)                        │
│ supabaseAdmin.storage.from('dokumen')                    │
│ → upload(path, buffer)                                   │
│ → getPublicUrl(path)                                     │
│ → return { fileId, webViewLink, webContentLink }        │
└──────────────────────────────────────────────────────────┘
```

### 5.5 Storage Service Layer

Abstraction layer di `src/lib/storage/`:

| File | Fungsi |
|------|--------|
| `types.ts` | Interface `IStorageService` + type definitions |
| `supabase.ts` | Implementasi Supabase Storage (upload, getUrl, delete, list) |
| `index.ts` | Re-export `storageService` |

### 5.6 Keamanan File

- **Public URL** — semua file bisa diakses siapa pun yang memiliki URL
- **Upload via API saja** — semua upload melalui API Route yang sudah diverifikasi auth (`verifyAuth()`)
- **Supabase Admin Client** — menggunakan service role key (`supabaseAdmin`) untuk operasi storage
- `drive_file_id` di database berisi path objek di bucket (contoh: `dokumen/rfq/abc123/file.pdf`)

### 5.7 File Naming Convention

```
dokumen/{modul}/{id}/{originalName}
```

Tidak ada timestamp prefix — langsung nama file asli (`file.name`). Untuk modul tanpa recordId (temporary/OCR), gunakan `{timestamp}-{file.name}` untuk menghindari bentrok.

Contoh: `dokumen/rfq-customer/abc123/PO-001.pdf`

### 5.8 Document Upload Modules (11 Modul)

Setiap modul transaksi memiliki fitur upload dokumen lampiran (PDF/gambar) dengan pola yang identik:

| Modul | API Route | DB Table | Storage Path |
|-------|-----------|----------|--------------|
| RFQ Customer | `/api/v1/rfq-customer/{id}/documents` | `rfq_customer_document` | `dokumen/rfq-customer/{id}/` |
| RFQ Supplier | `/api/v1/rfq-supplier/{id}/documents` | `rfq_supplier_document` | `dokumen/rfq-supplier/{id}/` |
| Quotation | `/api/v1/quotation/{id}/documents` | `quotation_document` | `dokumen/quotation/{id}/` |
| Customer PO | `/api/v1/customer-po/{id}/documents` | `customer_po_document` | `dokumen/customer-po/{id}/` |
| DI | `/api/v1/di/{id}/documents` | `di_document` | `dokumen/di/{id}/` |
| Sales Order | `/api/v1/sales-order/{id}/documents` | `sales_order_document` | `dokumen/sales-order/{id}/` |
| Delivery Order | `/api/v1/delivery-order/{id}/documents` | `delivery_order_document` | `dokumen/delivery-order/{id}/` |
| Invoice | `/api/v1/invoice/{id}/documents` | `invoice_document` | `dokumen/invoice/{id}/` |
| Retur Penjualan | `/api/v1/retur-penjualan/{id}/documents` | `retur_penjualan_document` | `dokumen/retur-penjualan/{id}/` |
| Retur Pembelian | `/api/v1/retur-pembelian/{id}/documents` | `retur_pembelian_document` | `dokumen/retur-pembelian/{id}/` |
| GRN | `/api/v1/grn/{id}/documents` | `grn_document` | `dokumen/grn/{id}/` |
| Kontrak | `/api/v1/master/kontrak/{id}/documents` | `kontrak_file` (with `jenis_dokumen` column) | `dokumen/kontrak/{id}/` |

**Standard path pattern:** `dokumen/{modul}/{recordId}/{file.name}` — tanpa timestamp prefix, tanpa sub-folder jenis.

**Pattern API:** Setiap route memiliki 3 method: `GET` (list, filter by query params), `POST` (upload multipart form-data), `DELETE` (by query param `docId`). Semua menggunakan `storageService` dari `src/lib/storage/`.

**Kontrak enhancement:** Mendukung 3 jenis dokumen (`jenis_dokumen`: `kontrak`, `rfq_customer`, `di`) — filter via query param `?jenis_dokumen=rfq_customer`. Upload menyertakan field `jenis_dokumen` di form-data. Semua jenis disimpan di folder yang sama (`dokumen/kontrak/{id}/`).

**Temporary upload:** Sebelum record dibuat (`/api/v1/rfq-customer/upload-temp`), file disimpan sementara di `dokumen/temp/rfq-customer/{type}/{timestamp}-{file.name}`. Setelah record dibuat, file permanen diupload via endpoint dokumen reguler.

### 5.9 Standard UI Component: CompactFileUpload

Semua modul wajib menggunakan komponen **`CompactFileUpload`** (`@/components/compact-file-upload.tsx`) untuk upload dokumen lampiran — menggantikan `FileUpload` (`@/components/file-upload.tsx`) yang bersifat drag-drop vertikal.

**Desain:** Horizontal compact layout — flex row dengan label, file chips di tengah (`w-[300pt]`), dan tombol Upload solid hijau di kanan. Cocok untuk form detail page yang padat.

**Props:**
```tsx
export interface DocumentFile {
  id: string
  file_name: string
  file_url: string
  drive_file_id?: string | null
  uploaded_at: string
}

interface CompactFileUploadProps {
  documents: DocumentFile[]
  onUpload: (file: File) => void
  onDelete: (docId: string) => Promise<void>
  uploading?: boolean
  accept?: string
  label?: string
}
```

**Styling:**
- Container: `flex items-center rounded-lg border bg-card px-4 w-full py-2`
- Chips container: `flex flex-wrap items-center gap-1.5 w-[300pt]`
- Each chip: `inline-flex items-center gap-1.5 rounded-md border border-primary bg-background px-2.5 py-2 text-xs w-[1250px]`
- File name span: `flex-1 truncate` — mendorong icon link & delete ke kanan
- Button: `shrink-0 ml-auto bg-success text-white hover:bg-[#16A34A]`
- Icon link: `text-green-600 hover:text-green-700`
- Icon delete: `text-red-600 hover:text-red-700`

**Status:** ✅ All modules migrated to `CompactFileUpload`.

| Modul | Status |
|-------|--------|
| Kontrak | ✅ Migrated |
| RFQ Customer | ✅ Migrated |
| RFQ Supplier | ✅ Migrated |
| Quotation | ✅ Migrated |
| Customer PO | ✅ Migrated |
| DI | ✅ Migrated |
| Sales Order | ✅ Migrated |
| Delivery Order (via DoDocuments) | ✅ Migrated |
| Invoice | ✅ Migrated |
| Retur Penjualan | ✅ Migrated |
| Retur Pembelian | ✅ Migrated |
| GRN | ✅ Migrated |
| Kwitansi | ✅ Migrated |

### 5.10 Halaman Manajemen Dokumen & Virtual PDF

Halaman `/dashboard/dokumen` menyatukan semua dokumen dari seluruh modul — baik file yang di-upload ke Supabase Storage (real documents) maupun PDF yang di-generate on-the-fly via API routes (virtual PDF entries).

#### `all_documents` View

PostgreSQL view (`all_documents`) menggabungkan real uploaded documents dari tabel `*_document` dengan virtual PDF entries via `UNION ALL`. Setiap entry:

| Field | Deskripsi |
|-------|-----------|
| `id` | Unique ID — virtual: `pdf-{modul}-{recordId}` |
| `filename` | Nama file untuk ditampilkan |
| `fileurl` | Storage: public URL Supabase. Virtual: relative API route (`/api/v1/{modul}/{id}/pdf`) |
| `modul` | Nama modul asal |
| `nomordokumen` | Format `RRI-...` |
| `customerid` / `customernama` | Resolusi customer via joins |
| `uploadedat` | Timestamp (real: upload time, virtual: current timestamp) |

#### Virtual PDF Entries

| Modul | fileurl | ID Prefix |
|-------|---------|-----------|
| Quotation | `/api/v1/quotation/{id}/pdf` | `pdf-quotation-` |
| Delivery Order / Surat Jalan | `/api/v1/delivery-order/{id}/pdf` | `pdf-do-` |
| Invoice | `/api/v1/invoice/{id}/pdf` | `pdf-invoice-` |
| Tanda Terima | `/api/v1/invoice/{id}/tanda-terima/pdf` | `pdf-tandaterima-` |
| Kwitansi | `/api/v1/kwitansi/{id}/pdf` | `pdf-kwitansi-` |
| Resi Pengiriman | `/api/v1/delivery-order/{id}/resi-pdf` | `pdf-resi-` |
| **Jurnal Umum** | `/api/v1/jurnal/{id}/pdf` | `pdf-jurnal-` |

#### Full List of Moduls in `all_documents` View

**10 real document modules (from `*_document` tables):**
RFQ Customer, Quotation, Customer PO, DI, Invoice, Retur Penjualan, Kontrak, Delivery Order, GRN Customer, Kwitansi, Retur Pembelian, RFQ Supplier, GRN, Sales Order

**2 virtual-only modules (generated PDFs, no upload table):**
Delivery Slip (from `delivery_order.delivery_slip_file_url`), Tanda Terima, **Jurnal Umum**

**1 hybrid module (both real upload + virtual PDF):**
Quotation, Delivery Order, Invoice, Kwitansi, **Jurnal Umum**

**3 supplier-side modules (customer resolved via SO → PO/DI chain):**
RFQ Supplier (via SO), Retur Pembelian (via PO → SO), GRN (via DI)

Untuk menambah virtual document baru: tambah `UNION ALL` ke view `all_documents` migration.

#### API: `/api/v1/dokumen`

| Parameter | Type | Deskripsi |
|-----------|------|-----------|
| `customerId` | string | Filter by customer |
| `modul` | string | Filter by modul |
| `search` | string | Cari filename |
| `startDate` / `endDate` | string | Filter rentang tanggal |
| `diNomor` | string | Smart filter by DI nomor — resolve seluruh chain terkait (DI, Kontrak, Sales Order, Surat Jalan, Resi, Delivery Slip, GRN Customer, Invoice, Tanda Terima, Kwitansi, Retur Penjualan) |
| `poNomor` | string | Smart filter by Customer PO nomor — resolve seluruh chain terkait (RFQ Customer, Quotation, Customer PO, Sales Order, Surat Jalan, Resi, Delivery Slip, GRN Customer, Invoice, Tanda Terima, Kwitansi, Retur Penjualan, Kontrak) |

Response: `{ data: Document[], count: number }`

Kedua param (`diNomor` / `poNomor`) bersifat opsional dan bisa dikombinasikan (AND logic). Bekerja bersama filter lainnya (customerId, modul, dll).

##### Chain Resolution — DI Filter

```
DI nomor → di.id
  ├── di.kontrak_id → Kontrak
  ├── sales_order.di_id → SO → so.id
  │   ├── delivery_order.sales_order_id → DO → do.id (Surat Jalan, Resi, Delivery Slip)
  │   ├── invoice.sales_order_id → Invoice → inv.id (Tanda Terima)
  │   │   └── kwitansi.invoice_id → Kwitansi → kw.id
  │   ├── retur_penjualan.delivery_order_id → Retur Penjualan → rp.id
  │   │   └── grn_customer.retur_penjualan_id → GRN Customer
  │   └── grn_customer.delivery_order_id → GRN Customer (direct)
```

##### Chain Resolution — PO Filter

```
PO nomor → customer_po.id
  ├── customer_po.quotation_id → Quotation → quotation.id
  │   └── quotation.rfq_id → RFQ Customer
  ├── sales_order.customer_po_id → SO → so.id
  │   ├── delivery_order.sales_order_id → DO → do.id (Surat Jalan, Resi, Delivery Slip)
  │   ├── invoice.sales_order_id → Invoice → inv.id (Tanda Terima)
  │   │   └── kwitansi.invoice_id → Kwitansi → kw.id
  │   ├── retur_penjualan.delivery_order_id → Retur Penjualan → rp.id
  │   │   └── grn_customer.retur_penjualan_id → GRN Customer
  │   ├── grn_customer.delivery_order_id → GRN Customer (direct)
  │   └── so.di_id → DI → di.id
  │       └── di.kontrak_id → Kontrak
```

Semua record UUID dikumpulkan, deduplicate, dan digunakan sebagai filter `recordid IN (...)` di `all_documents` view.

#### Autocomplete API

| Endpoint | Deskripsi |
|----------|-----------|
| `GET /api/v1/dokumen/autocomplete/di?q=...` | Cari DI by nomor (ILIKE), return max 20 hasil: `{ id, nomor, customer_id, customer_nama }` |
| `GET /api/v1/dokumen/autocomplete/po?q=...` | Cari Customer PO by nomor (ILIKE), return max 20 hasil: `{ id, nomor, customer_id, customer_nama }` |

#### Document Upload API Pattern

Setiap modul yang mendukung upload dokumen memiliki route handler di `/api/v1/{modul}/[id]/documents/route.ts`:
- **GET** — daftar dokumen milik record
- **POST** — upload file baru (multipart form-data, field `file`)
- **DELETE** — hapus file (`?docId=...`)

Modul dengan document API: `quotation`, `customer-po`, `di`, `invoice`, `delivery-order`, `retur-penjualan`, `retur-pembelian`, `rfq-customer`, `rfq-supplier`, `grn`, `grn-customer`, `kwitansi`, `master/kontrak`, **`sales-order`**

#### Halaman Frontend

`src/app/dashboard/dokumen/page.tsx` — client component "use client":

- **Filter panel**: dropdown Customer, dropdown Modul, input Cari File, Date Range, **Smart Filter DI** (autocomplete combobox), **Smart Filter PO Customer** (autocomplete combobox), tombol Cari & Reset
- **Smart filter DI/PO**: Menggunakan `DocumentSearchCombobox` (Popover + Command shadcn). Search query dikirim ke autocomplete API dengan debounce 300ms. Setelah user pilih nomor DI/PO, customer dropdown otomatis terisi dengan customer terkait.
- **Tabel**: Nama File, Modul (badge warna), Nomor Dokumen, Customer, Tanggal, Aksi
- **Aksi per baris**: Tombol "Buka" (icon ExternalLink biru), tombol "Download" (icon Download hijau), tombol "Delete" (icon Trash2 merah dengan konfirmasi AlertDialog)
- **Office docs**: `.doc/.docx/.xls/.xlsx/.ppt/.pptx` dibuka via Google Docs Viewer

#### Badge Warna per Modul

Setiap modul memiliki warna badge yang berbeda untuk memudahkan identifikasi visual. Warna menggunakan CSS variables yang support light dan dark mode.

**Early Stage - Biru:**
| Modul | Class | Light Mode | Dark Mode |
|-------|-------|------------|-----------|
| RFQ Customer | `bg-primary/10 text-primary font-medium` | `#0000FF` at 10% | `#3B82F6` at 10% |
| RFQ Supplier | `bg-blue-500/10 text-blue-500 font-medium` | `#3B82F6` at 10% | `#3B82F6` at 10% |

**Mid Stage - Kuning/Orange:**
| Modul | Class | Light Mode | Dark Mode |
|-------|-------|------------|-----------|
| Quotation | `bg-warning/10 text-warning font-medium` | `#F59E0B` at 10% | `#F59E0B` at 10% |
| Customer PO | `bg-orange-500/10 text-orange-500 font-medium` | `#F97316` at 10% | `#FB923C` at 10% |
| Sales Order | `bg-amber-500/10 text-amber-500 font-medium` | `#F59E0B` at 10% | `#FBBF24` at 10% |

**Active/Shipping - Hijau:**
| Modul | Class | Light Mode | Dark Mode |
|-------|-------|------------|-----------|
| DI | `bg-emerald-500/10 text-emerald-500 font-medium` | `#10B981` at 10% | `#34D399` at 10% |
| Delivery Order | `bg-green-500/10 text-green-500 font-medium` | `#22C55E` at 10% | `#4ADE80` at 10% |
| Delivery Slip | `bg-teal-500/10 text-teal-500 font-medium` | `#14B8A6` at 10% | `#2DD4BF` at 10% |
| Resi Pengiriman | `bg-cyan-500/10 text-cyan-500 font-medium` | `#06B6D4` at 10% | `#22D3EE` at 10% |

**Financial - Merah/Merah Muda:**
| Modul | Class | Light Mode | Dark Mode |
|-------|-------|------------|-----------|
| Invoice | `bg-destructive/10 text-destructive font-medium` | `#EF4444` at 10% | `#F87171` at 10% |
| Kwitansi | `bg-rose-500/10 text-rose-500 font-medium` | `#F43F5E` at 10% | `#FB7185` at 10% |
| Tanda Terima | `bg-pink-500/10 text-pink-500 font-medium` | `#EC4899` at 10% | `#F472B6` at 10% |

**Return - Kuning/Lime:**
| Modul | Class | Light Mode | Dark Mode |
|-------|-------|------------|-----------|
| Retur Penjualan | `bg-yellow-500/10 text-yellow-500 font-medium` | `#EAB308` at 10% | `#FACC15` at 10% |
| Retur Pembelian | `bg-lime-500/10 text-lime-500 font-medium` | `#84CC16` at 10% | `#A3E635` at 10% |

**Inventory - Abu:**
| Modul | Class | Light Mode | Dark Mode |
|-------|-------|------------|-----------|
| GRN | `bg-slate-500/10 text-slate-500 font-medium` | `#64748B` at 10% | `#94A3B8` at 10% |
| GRN Customer | `bg-zinc-500/10 text-zinc-500 font-medium` | `#71717A` at 10% | `#A1A1AA` at 10% |

**Legal - Ungu:**
| Modul | Class | Light Mode | Dark Mode |
|-------|-------|------------|-----------|
| Kontrak | `bg-violet-500/10 text-violet-500 font-medium` | `#8B5CF6` at 10% | `#A78BFA` at 10% |

**Fallback untuk modul yang tidak terdaftar:** `bg-muted text-muted-foreground font-medium`

**Implementasi di kode:**
```typescript
const modulBadgeClasses: Record<string, string> = {
  // Early Stage - Biru
  'RFQ Customer': 'bg-primary/10 text-primary font-medium',
  'RFQ Supplier': 'bg-blue-500/10 text-blue-500 font-medium',
  // ... (seluruh modul)
}

const getBadgeClass = (modul: string) => modulBadgeClasses[modul] || 'bg-muted text-muted-foreground font-medium'

// Penggunaan di TableCell:
<Badge className={getBadgeClass(doc.modul)}>
  {doc.modul}
</Badge>
```

**Panduan Penambahan Modul Baru:**
1. Tambahkan entry baru di `modulBadgeClasses` dengan class yang sesuai
2. Pilih warna berdasarkan kategori flow dokumen:
   - Early stage (RFQ, PO awal): Biru/Netral
   - Mid stage (Quotation, PO confirmed): Kuning/Orange
   - Active/Shipping (DO, Resi): Hijau
   - Financial (Invoice, Kwitansi): Merah/Merah Muda
   - Return: Kuning/Lime
   - Inventory: Abu-abu
   - Legal: Ungu
3. Pastikan warna terlihat di light dan dark mode (gunakan opacity 10% untuk background)
4. Selalu sertakan `font-medium` untuk ketebalan teks yang konsisten

#### Blob Fetch Pattern (untuk Virtual PDF)

Route PDF memerlukan `verifyAuth()` (Bearer token) — `window.open(url)` tidak bisa mengirim custom header. Solusi:

```typescript
// Buka di tab baru (anti-popup blocker):
const win = window.open('', '_blank')
const token = await getAuthToken()
const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
const blob = await res.blob()
win.location.href = URL.createObjectURL(blob)

// Download via blob:
const token = await getAuthToken()
const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
const blob = await res.blob()
const blobUrl = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = blobUrl; a.download = filename; a.click()
URL.revokeObjectURL(blobUrl)
```

Untuk storage public URLs: tetap `window.open(url)` langsung — tidak perlu auth.

## 6. Scalability & Arsitektur

### 6.1 Background Jobs & Cron
Proses berat dijalankan di background agar tidak memblokir user:
- AI Search Harga (Playwright scraping)
- AI OCR Kontrak
- Generate PDF dokumen
- Export laporan Excel

Teknologi: **cron-job.org** (free tier, max 60 requests/hour) untuk penjadwalan. Vercel Serverless Functions untuk endpoint. Semua cron endpoint diamankan dengan `CRON_SECRET_TOKEN` (Bearer auth header).

**Daftar Cron Jobs:**

| Endpoint | Schedule | Fungsi | Recipient |
|----------|----------|--------|-----------|
| `/api/v1/cron/contract-expiry-reminder` | `0 6 * * *` (setiap hari jam 6 pagi) | Contract alerts + AR summary | Owner |
| `/api/v1/cron/invoice-due-date-reminder` | `1 6 * * *` (setiap hari jam 6:01 pagi) | Invoice due date reminders (H-3, H-1, H, H+1...H+30) | Owner |
| `/api/v1/cron/do-overdue-reminder` | `2 6 * * *` (setiap hari jam 6:02 pagi) | DO delivery reminder (H-7, H-3, H-1, H) | Owner |
| `/api/v1/cron/approval-escalation` | `0 8,12,17 * * 1-5` (Senin-Jumat jam 8,12,17) | PR/PO escalation >24h | Owner |

**WhatsApp Notifications:**
- **Contract Alerts** (`/api/v1/cron/contract-expiry-reminder`): Summary kontrak expired &即将 expired dikirim ke owner WhatsApp
- **Invoice Due Date Reminders** (`/api/v1/cron/invoice-due-date-reminder`): Reminder invoice jatuh tempo H-3, H-1, H, H+1, H+2, ... H+30 (stop setelah paid atau H+30)
- **DO Overdue Reminder** (`/api/v1/cron/do-overdue-reminder`): DO delivery reminder H-7, H-3, H-1, H (hari pengiriman)
- **Approval Escalation** (`/api/v1/cron/approval-escalation`): Escalation PR/PO pending >24 jam ke owner
- **Format**: Semua message dalam Bahasa Indonesia dengan timezone WIB (Asia/Jakarta)

**Setup Fonnte API:**
1. Register akun di https://fonnte.com/
2. Dapatkan API token dari dashboard Fonnte
3. Set environment variable `FONNTE_API_KEY=<token>` di Vercel
4. Test koneksi: `curl -X POST https://api.fonnte.com/send -H "Authorization: <token>" -H "Content-Type: application/json" -d '{"target":"628xxxxxxxxxx","message":"test"}'`
**Note**: Format Authorization header tanpa prefix "Bearer"

**Setup Site Settings:**
```sql
-- Set owner WhatsApp number (format: 628xxxxxxxxxx)
INSERT INTO site_settings (key, value) 
VALUES ('owner_whatsapp', '6285640884088')
ON CONFLICT (key) DO UPDATE SET value = '6285640884088';

-- Set escalation threshold in hours (default: 24)
INSERT INTO site_settings (key, value) 
VALUES ('escalation_hours', '24')
ON CONFLICT (key) DO UPDATE SET value = '24';
```

**Setup:** Akun cron-job.org → Buat 5 cron jobs (1 per endpoint) → HTTP GET dengan header `Authorization: Bearer <CRON_SECRET_TOKEN>`. `CRON_SECRET_TOKEN` disimpan sebagai environment variable di Vercel.

**Schedule Staggering** (untuk menghindari API rate limit, jeda 1 menit antar cron):
- `0 6 * * *` → contract-expiry-reminder (start 06:00:00)
- `1 6 * * *` → invoice-due-date-reminder (start 06:01:00)
- `2 6 * * *` → do-overdue-reminder (start 06:02:00)
- `0 8,12,17 * * 1-5` → approval-escalation (jam 8,12,17)

**Monitoring Dashboard:** Riwayat notifikasi WhatsApp bisa dilihat di `/dashboard/notifikasi` — halaman client component dengan filter status, search penerima, pagination, dan expand pesan lengkap. Data disajikan via `GET /api/v1/whatsapp-log` (dengan `supabaseAdmin` + `verifyAuth`).

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
| **Barang** | Data barang (nama, kode, kategori, satuan, spesifikasi, justification, image_url, harga beli default, harga jual default, stok minimum, is_active). Kolom `kontrak_id` (FK ke kontrak, ON DELETE CASCADE) untuk barang yang dibuat dari import kontrak — jika kontrak dihapus, barang ikut terhapus otomatis. Justification & image_url untuk lampiran Quotation SPH. **Auto-create:** Saat PO Customer di-confirm, barang dari RFQ Customer yang belum terdaftar (free-text `nama_barang`) otomatis dibuat ke master barang dengan kode `BRG-RRI-{auto-increment}`. User memilih kategori per barang via dialog sebelum konfirmasi. |
| **Kategori Barang** | Pengelompokan barang (Cleaning Service, ATK, Peralatan, dll) |
| **Supplier** | Data supplier — termasuk supplier marketplace (Shopee, Tokopedia) dengan field: nama toko, link toko, no. rekening, kontak. Untuk marketplace: field tambahan seperti link produk, marketplace, nama toko. Dilengkapi **Terms of Payment** (TOP): Net 14, Net 30, Net 60, Net 90, Cash, Custom |
| **Customer** | Data customer, alamat, kontak. Dilengkapi **Terms of Payment** (TOP): Net 14, Net 30, Net 60, Net 90, Cash, Custom |
| **PIC Customer** | Multiple PIC per customer (nama, jabatan, no. HP, email). Tracking per RFQ/DI/Kontrak — setiap dokumen bisa diassign ke PIC berbeda |
| **Karyawan** | Data karyawan RRI (data pribadi, jabatan, gaji pokok) |
| **Chart of Accounts (COA)** | Daftar akun untuk pembukuan keuangan |
| **Kontrak Kunden** | Kontrak harga tetap dengan customer (fixed price list). Import item barang via paste JSON dari Gemini AI (ekstraksi manual PDF) → preview → edit → confirm → auto-create barang master + kontrak items. Barang import terikat ke kontrak (`kontrak_id` FK) — jika kontrak dihapus, barang ikut terhapus (ON DELETE CASCADE). Field: nomor kontrak, nama kontrak, customer, tanggal mulai/selesai/tanda tangan, penandatangan RRI & Customer (nama + jabatan), catatan. Upload 3 jenis dokumen: Kontrak PDF, RFQ dari Customer, Delivery Instruction (DI). Free-text items dengan kode_barang, nama_barang, satuan (tidak wajib linked ke master barang). |
| **Harga Barang** | Histori harga beli dari supplier dan harga jual ke customer |
| **Bulk Import Excel** ✅ | Import master data barang, supplier, customer via upload file Excel — Halaman `/dashboard/tools/bulk-import`, API `POST /api/v1/tools/bulk-import`, sidebar Master Data group |
| **Import dari PO Customer** ✅ | Mengimpor data Purchase Order (PO) dari customer yang **tidak dibuat melalui ERP** — yaitu PO yang terjadi di luar sistem (via email, PDF, atau dokumen fisik) sebelum ERP ini ada. Bertujuan mencatat seluruh history transaksi agar semua data tersimpan di ERP. Workflow: pilih customer → copy prompt Gemini → paste JSON hasil ekstraksi → preview → import. Auto-create: master barang, customer (jika belum ada), PIC customer (jika belum ada). Buat record Customer PO (status `confirmed`) + Customer PO Items. Nomor PO RRI: `RRI-CPO-EXT-YY-MM-NNNN` (counter terpisah dari CPO regular). Prompt per customer disimpan di tabel `customer_prompt` — admin mengisi via Supabase Table Editor. Mendukung field: nama_customer, nomor_po_customer, tanggal_po, PIC (nama + jabatan), penandatangan PO (nama + jabatan), items (nama_barang, satuan, qty, harga_satuan). PDF upload disimpan ke `dokumen/customer-po/{id}/`. Akses via tab "Import dari PO" di halaman `/dashboard/master/barang/tambah`. |

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
| **AI OCR Kontrak** | VisionAgent (NVIDIA Phi-4 multimodal) | ✅ | Upload PDF kontrak → AI extract: nomor_kontrak, nama kontrak, customer, tanggal mulai/selesai/tanda tangan, penandatangan RRI & Customer (nama+jabatan), items (kode, uom, nama, harga) → preview + edit → confirm → create kontrak + items + auto-barang master. Output: strict JSON metadata + items array. Handles: truncated JSON (auto-complete `}`/`]`), page batching (>3 halaman diproses per-batch & digabung), Indonesian number format (deteksi pemisah ribuan), signatory key fallback (`name`→`nama`). max_tokens 8192, batch_size 3. |
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
| CONTRACT_NEARING_EXPIRY | cron-job.org (daily 06:00) | CONTRACT_ALERTS | Notifikasi kontrak expired 30 hari |
| AR_OVERDUE_30 | cron-job.org (daily 06:00) | BULK_REMINDERS | Auto-reminder invoice overdue |

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
| `/api/v1/cron/contract-expiry-reminder` | GET | Ex-automation: CONTRACT_NEARING_EXPIRY (kontrak expiring 30 hari) + AR_OVERDUE_30 trigger. Dipanggil via cron-job.org schedule `0 6 * * *`. Auth via `CRON_SECRET_TOKEN` Bearer header. |

### C. Pre-Sales

Modul ini menangani proses sebelum terjadinya penjualan, dengan tracking per PIC Customer.

**Jalur RFQ Customer → Quotation → PO Customer:**

| Sub-Modul | Deskripsi |
|---|---|
| **RFQ Customer** | Merekam RFQ dari customer. **Entry point parent** — nomor dari global counter via `generateGlobalDocumentNumber('RFQC')` → `RRI-RFQC-YY-MM-NNNNN`. Tabel: `rfq_customer`, `rfq_customer_item`, `rfq_customer_document`, `rfq_customer_pic`. Assign ke PIC Customer spesifik. Upload file RFQ (PDF/gambar/Excel/Word) via upload-temp. Item images upload (1 per item). Detail, Edit, Delete di list page. API: `/api/v1/rfq-customer`. |
| **Quotation** | Membuat Surat Penawaran Harga (SPH) dengan format 2 halaman PDF. Field: rfq_customer_id (referensi ke RFQ Customer), lampiran (text), perihal, pic_customer_id, alamat (auto-fill), masa_berlaku dropdown (1 Minggu–1 Bulan), PPN toggle. Item: spec/justification/image_url/satuan default dari master Barang (bisa di-override). Auto-populate: saat pilih RFQ Customer, form otomatis mengisi customer_id, pic_customer_id, alamat, referensi, dan items. Company profile (nama, alamat, kontak, tanda tangan, stempel) dari `site_settings`. Nomor: copy dari RFQ parent via `formatChildNumber(parentNumber, 'SPH')` → `RRI-SPH-YY-MM-NNNNN`. Tanpa parent: `generateGlobalDocumentNumber('SPH')`. **Status Workflow:** `draft → sent → proses_negosiasi → approved → closed`. Quick-action buttons di halaman detail: Kirim (draft→sent), Setujui/Tolak (sent/proses_negosiasi→approved/rejected), Revisi (rejected→draft), Tutup (approved→closed). Validasi transisi status di PATCH `/[id]/status` dan PUT `/[id]`. |
| **Customer PO** | Purchase Order dari customer. Nomor: copy dari Quotation/RFQ parent via `formatChildNumber()` → `RRI-CPO-YY-MM-NNNNN`. Tanpa parent: `generateGlobalDocumentNumber('CPO')`. Field: customer, quotation_id (opsional), tanggal, nomor_po_customer, terms_of_payment, pic_customer_id (PIC dari database — auto-load saat customer dipilih), waktu_pengiriman (hari), status (draft/confirmed/cancelled). Item: barang (linked master barang atau free-text nama_barang/satuan untuk auto-create master), jumlah, harga_satuan. TOP options: Net 14, Net 30, Net 60, Net 90, Cash, Custom. **Due date:** Jatuh tempo dihitung SETELAH invoice hardcopy diterima customer, bukan dari tanggal PO. Hitungan TOP dimulai setelah: barang terkirim → GRN customer → invoice hardcopy disubmit & diterima customer. **Waktu pengiriman** (hari) disimpan di PO dan di-propagate ke Sales Order → Delivery Order → Retur Penjualan. PIC Customer auto-fetch dari database saat customer dipilih. Konfirmasi PO → auto-close quotation + auto-generate Sales Order + auto-create master barang untuk item free-text. Halaman: Tambah, Detail (dengan FileUpload), Edit. Dokument: `dokumen/customer-po/{id}/{file}` |

**Jalur Kontrak → DI (Delivery Instruction):**

| Sub-Modul | Deskripsi |
|---|---|
| **Kontrak Customer** | Kontrak fixed price list. Upload PDF → AI OCR → simpan harga kontrak. Assign PIC Customer. Upload dokumen fisik kontrak via Lampiran |
| **DI (Delivery Instruction)** | Instruksi pengiriman dari customer berdasarkan kontrak. **Entry point parent** — nomor dari global counter via `generateGlobalDocumentNumber('DI')` → `RRI-DI-YY-MM-NNNNN`. Assign PIC Customer. Upload dokumen pendukung via Lampiran. **Input Item Barang:** 2 opsi — (1) Import JSON dari Gemini AI: paste JSON array hasil ekstraksi PDF kontrak (+ kode + jumlah + nama) → auto-match harga_satuan dari kontrak. (2) Input Manual: ketik kode barang + jumlah → auto-lookup dari kontrak. Tidak ada tabel Select 137 item — hanya tabel item yang sudah ditambahkan (editable qty & harga_satuan). **Harga cross-check:** setiap item menyimpan `harga_satuan_kontrak` (client-side) — jika user mengubah `harga_satuan` sehingga berbeda dengan kontrak, tampil visual warning (amber bg + icon AlertTriangle + teks "≠ kontrak: Rp X"). Saat submit, jika ada perbedaan harga, muncul modal konfirmasi berisi tabel selisih harga — user bisa "Kembali Edit" atau "Lanjutkan Simpan". |

### D. Sales Order & Pengiriman

| Sub-Modul | Deskripsi |
|---|---|
| **Sales Order (SO)** | Order penjualan internal (berdasarkan Customer PO atau DI). Auto-generate saat PO/DI deal. Nomor: copy dari parent (CPO/DI) via `formatChildNumber(parentNumber, 'SO')` → `RRI-SO-YY-MM-NNNNN`. Meneruskan `waktu_pengiriman` (hari) dari Customer PO. **Status workflow:** `draft → confirmed → processed → delivered` (cancelled hanya dari draft). **Detail page:** menampilkan customer info (nama, PO/PIC/TOP), estimasi kirim, items dengan harga satuan, tab dokumen upload. **Edit page:** dynamic items row (add/remove), update harga & keterangan. **Document upload:** `sales_order_document` table + API, UI di detail page |
| **Delivery Order (DO)** | Surat jalan untuk pengiriman barang. Nomor: copy dari SO parent via `formatChildNumber(parentNumber, 'SJ')` → `RRI-SJ-YY-MM-NNNNN`. Auto-generate draft saat SO siap kirim. Meneruskan `waktu_pengiriman` (hari) dari Sales Order. **Status workflow:** `draft → awaiting_pickup → dikirim → selesai` (atau `ditolak`). **Scan verification:** Staff gudang scan barcode/checklist items → status otomatis `awaiting_pickup`. **Delivery confirmation:** Staff upload 2 foto (barang diterima customer + surat jalan ditandatangani) wajib sebelum status berubah ke `dikirim` atau `ditolak`. Upload foto via endpoint `POST /api/v1/delivery-order/{id}/delivery-photo`. Saat status `dikirim`, auto-generate draft Invoice + draft Kwitansi (barengan) + jurnal penjualan. |
| **Tracking Pengiriman** | Status pengiriman barang. Begitu DO status "Dikirim", auto-generate draft Invoice + draft Kwitansi |
| **Retur Penjualan** | Barang dikembalikan oleh customer karena cacat/rusak/tidak sesuai. Dokumen: Nota Retur. Upload bukti retur via Lampiran. Memiliki kolom `waktu_pengiriman` untuk referensi. **Flow:** User buat Retur Penjualan manual (auto-populate item dari DO). Setelah disetujui (status → `closed`), auto-generate Retur Barang (GRN) draft. Warehouse verifikasi barang, set GRN → `completed` → stok otomatis bertambah via stok_mutasi. Auto-buat jurnal penjualan. |
| **Barcode / QR Code** | Setiap DO bisa di-scan pakai HP gudang |

### E. Procurement / Pembelian

Modul ini menangani pembelian dari supplier — termasuk supplier marketplace Shopee & Tokopedia.

| Sub-Modul | Deskripsi |
|---|---|
| **RFQ Supplier** | Request for Quotation ke Supplier — RRI meminta harga dari supplier. Tabel: `rfq_supplier`, `rfq_supplier_item`, `rfq_supplier_document`. API: `/api/v1/rfq-supplier`. UI: `/dashboard/rfq`. Nomor otomatis: `RRI-RFQ-YY-MM-0001` |
| **Purchase Request (PR)** | Permintaan pembelian ketika stok tidak mencukupi. Auto-generate jika SO butuh barang yang stoknya kurang |
| **Supplier Search** | Cari supplier — bisa dari database seller existing, atau via AI Search (Shopee/Tokopedia) |
| **Purchase Order (PO)** | Order pembelian ke supplier. Untuk marketplace: field tambahan (link produk, nama toko, marketplace, no. resi) |
| **Receiving / Penerimaan Barang** | Penerimaan barang dari supplier, update stok |
| **GRN (Goods Received Note)** | Tanda terima barang. Upload dokumen pendukung via Lampiran |
| **Retur Pembelian** | Barang dikembalikan ke supplier karena cacat/tidak sesuai. Proses: Retur → DO Retur → Kirim ke supplier → Refund/Adjustment. Upload dokumen pendukung via Lampiran |
| **Supplier Payment** ✅ | Pembayaran ke supplier (termasuk bukti transfer) — `supplier_payment` table + API + halaman `/dashboard/procurement/supplier-payment` |
| **Approval Escalation** ✅ | Jika PR/PO tidak di-approve dalam 24 jam, auto-escalate ke manager via WhatsApp — cron-job.org schedule `0 8,12,17 * * 1-5` (jam 8,12,17 Senin-Jumat) via endpoint `/api/v1/cron/approval-escalation` + audit_log |

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
| **Financial Precision** | Semua kolom keuangan menggunakan `numeric(18,2)` untuk akurasi akuntansi. Berlaku di: Invoice, Kwitansi, Quotation, PO, Jurnal, dan semua tabel transaksi keuangan. |
| **Faktur Pajak** | Generate nomor faktur pajak sesuai ketentuan Dirjen Pajak. Full CRUD API + halaman list/detail/create/edit. Auto-generate dari Invoice dengan auto-fill DPP/PPN/PPh. PDF generation dengan layout PKP Penjual/Pembeli, NPWP dari site_settings. Detail page menampilkan company profile dari database. |
| **Tanda Terima Dokumen Penagihan** | Tanda terima dokumen penagihan (kwitansi/invoice) yang ditandatangani customer. PDF component di `src/lib/pdf/tanda-terima.ts`. API route di `/api/v1/invoice/[id]/tanda-terima/pdf`. Preview + Download buttons di halaman detail invoice. Format nomor: `RRI-TT-YY-MM-0001`. Table columns: No, Nama Dokumen, Nomor Dokumen, Asli, Copy, Keterangan. Data nomor dokumen diambil dari seluruh chain dokumen (RFQ→SPH→PO→Kontrak→DI→Delivery Slip→Surat Jalan→GRN→Invoice→Kwitansi) via sales_order + invoice_id joins. Delivery Slip nomor dari `delivery_order.delivery_slip_nomor`. |
| **Jurnal Umum** | Jurnal transaksi keuangan. Auto-generate jurnal saat Invoice terbit (debit AR, credit Revenue, debit/kredit PPN). **Balance validation:** API POST/PUT mewajibkan total debit = total kredit, return error jika tidak balance. **Invoice DELETE cleanup:** jurnal auto-generated ikut dihapus saat invoice dihapus. **Retur auto-jurnal:** retur penjualan (debit Revenue, credit AR) dan retur pembelian (debit AP, credit Persediaan) otomatis generate jurnal. **Virtual PDF:** jurnal tersedia sebagai virtual PDF di halaman dokumen. **Edit items:** halaman edit jurnal mendukung pengeditan item (akun, debit, kredit). |
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
| **Quotation (SPH)** | `RRI-SPH-YY-MM-0001` | Pre-Sales — 2 halaman PDF: surat utama + lampiran tabel rincian. Font Arial. Include spec/justification/image per item. PPN 11% toggle. Masa berlaku 1 Minggu–1 Bulan. Company info dari site_settings. |
| **Purchase Order (Internal)** | `RRI-PO-YY-MM-0001` | Procurement |
| **Delivery Order / Surat Jalan** | `RRI-SJ-YY-MM-0001` | Sales |
| **Invoice** | `RRI-INV-YY-MM-0001` | Finance — Dok: PO/DI, DO, GRN, Invoice, Kwitansi. Grand Total (tanpa DPP/PPN/PPh di tabel). Bank data dari site_settings. Wet signature only (tanpa gambar stempel/tanda tangan digital). Multi-page dengan page numbers |
| **Goods Received Note (GRN)** | `RRI-GRN-YY-MM-0001` | Procurement / Inventory |
| **Kwitansi / Receipt** | `RRI-KWT-YY-MM-0001` | Finance |
| **Tanda Terima Dokumen Penagihan** | `RRI-TT-YY-MM-0001` | Finance — PDF component di `src/lib/pdf/tanda-terima.ts`. API route di `/api/v1/invoice/[id]/tanda-terima/pdf`. Preview + Download buttons di halaman detail invoice. |
| **Faktur Pajak** | Sesuai aturan Dirjen Pajak | Finance |
| **Nota Retur** | `RRI-RTJ-YY-MM-0001` (jual) / `RRI-RP-YY-MM-0001` (beli) | Sales / Procurement |

**Ketentuan Nomor Dokumen:**
- Format: `{RRI}-{KODE}-{YY}-{MM}-{NNNNN}`
- **Global single counter**: Semua dokumen menggunakan 1 counter global (`GLB`). Hanya 2 parent entry points (RFQ Customer, DI) yang memanggil counter langsung via `generateGlobalDocumentNumber(kodeDokumen)`.
- **Child documents**: Quotation, Customer PO, Sales Order, DO, Invoice, Kwitansi, Tanda Terima, GRN, Retur — semuanya menyalin nomor dari parent (dokumen asal) dan menambahkan prefix masing-masing via `formatChildNumber(parentNumber, kodeDokumen)`. Jika parent tidak ada, fallback ke global counter langsung.
- **Hierarki**: `RFQC`/`DI` (parent, global) → `QTN`/`CPO`/`SO` (copy parent) → `SJ`/`INV`/`KWT`/`TT`/dll (copy parent lagi)
- Setiap tahun berganti, counter di-reset ke `00001`
- Implementasi: PG function `increment_document_counter(p_kode_dokumen, p_tahun, p_bulan)` upsert & increment atomically; di `lib/utils/document-number.ts`
- Contoh: DI `RRI-DI-26-06-00001` → Quotation anaknya `RRI-SPH-26-06-00001`

**Nama File Download PDF:** Menggunakan nomor dokumen saja (tanpa prefix kode dokumen).
- Contoh: `RRI-SJ-26-06-0001.pdf`, `RRI-SPH-26-06-0001.pdf`
- TIDAK menggunakan `SJ-RRI-SJ-26-06-0001.pdf` atau `SPH-RRI-SPH-26-06-0001.pdf`
- Berlaku untuk: Content-Disposition header (`filename="..."`) dan atribut `a.download` di client

Format dokumen akan mengikuti template yang akan disediakan customer di direktori `/docs/templates/`.

### I.1 Panduan Implementasi PDF

**Root Cause — React Error #31 di PDF Generation:**
`@react-pdf/renderer` menggunakan React 18's `createElement`. Namun, Next.js 15 mengintercept `import React from 'react'` di file `src/lib/` dan me-resolve ke **RSC vendored React** yang menghasilkan elemen dengan `$$typeof = Symbol(react.transitional.element)` (React 19 canary). Reconciler React 18 tidak mengenali simbol ini → `Error #31: invariant "The renderer received a React element..."`.

**Aturan Implementasi PDF Component:**
1. File harus `.ts` (bukan `.tsx`) — menghindari RSC JSX runtime
2. DILARANG `import React from 'react'` — akan meresolve ke RSC vendored React
3. Hanya boleh `import type { ReactElement } from 'react'` — tipe dihapus saat kompilasi
4. Gunakan fungsi `createEl()` (lihat template di bawah) untuk membuat elemen — menghasilkan `$$typeof: Symbol.for('react.element')` (React 18)
5. Di route handler, cast hasil sebagai `as any` saat passing ke `pdf()` untuk menghindari TypeScript error
6. Font registration: gunakan URL-encoded space (`Arial%20Bold.ttf`) untuk nama file yang mengandung spasi
7. **Content-Length header WAJIB** di setiap PDF route handler: `'Content-Length': String(blob.size)` — Chrome's built-in PDF viewer membutuhkan `Content-Length` untuk menampilkan progress dan tahu kapan response selesai. Firefox / pdf.js tidak memerlukannya. Semua 13 PDF routes sudah menerapkan ini.

**Template PDF Component (`*.ts`):**
```typescript
import type { ReactElement } from 'react'

function createEl(type: any, props?: any, ...children: any[]): ReactElement {
  return {
    $$typeof: Symbol.for('react.element'),
    type,
    key: null,
    ref: null,
    props: { ...props, children: children.length ? children : undefined },
    _owner: null,
  }
}

export function MyPDF({ data }: { data: MyData }): ReactElement {
  return createEl(
    'VIEW',
    { style: { padding: 40 } },
    createEl('TEXT', null, 'Hello, PDF!'),
  )
}
```

**Route Handler (`route.ts`):**
```typescript
import { pdf } from '@react-pdf/renderer'

export async function GET() {
  const blob = await pdf(MyPDF({ data }) as any).toBlob()
  return new Response(blob, { headers: { 'Content-Type': 'application/pdf' } })
}
```

### J. Dashboard & Laporan

Arsitektur dashboard role-based: setiap user melihat dashboard sesuai rolenya. Implementasi via server component yang mendeteksi role dari session user (`users.role`), lalu merender komponen dashboard yang sesuai.

**Owner Dashboard — Executive Command Center:**

Bukan sekedar 6 kartu statistik — dashboard Owner adalah command center yang memberikan visibilitas penuh ke semua aspek bisnis dalam satu layar:

| Section | Data | Tujuan |
|---|---|---|
| **Revenue & Profit** | Total revenue bulan ini, Laba/Rugi, perbandingan dengan bulan lalu, Revenue Trend Chart (6 bulan) | Performa bisnis real-time |
| **Sales Pipeline** | StatCards: RFQ, Quotation, PO Customer, SO — plus row Customer Aktif, Piutang Outstanding, DO Pending | Visibilitas order yang sedang berjalan |
| **Sales Analytics** | Sales Pipeline Funnel (BarChart 4 stage), Top 5 Customers by Revenue (HorizontalBarChart), AR Aging Distribution (BarChart) | Analisis penjualan visual |
| **Revenue Mix** | Revenue per Kategori Barang (Donut PieChart), Komposisi Stok per Kategori (Donut PieChart) | Komposisi pendapatan & inventori |
| **Procurement** | PR aktif, PO terbuka, Pending Receiving, Pending GRN (StatCards) | Tidak ada pembelian terlewat |
| **Inventory Analytics** | Peringkat Stok Menipis (HorizontalBarChart), Total Barang/Stok/Stok Kosong/DO Pending (StatCards) | Manajemen stok visual |
| **Pending Actions** | Semua item butuh tindakan owner (PR/PO approval, stok kosong, faktur pajak, DO) | Tidak ada yang terabaikan |
| **Recent Activity** | 8 transaksi terakhir dari Quotation/SO/Invoice/PO | Konteks aktivitas hari ini |
| **Quick Actions** | Akses Cepat terkelompok: HR, Finance, Sales & Procurement | Eksekusi cepat tanpa navigasi |
| **Modul** | Grid 8 modul utama (Master Barang, Supplier, Customer, Karyawan, Laba/Rugi, Neraca, AR Aging, Arus Kas) | Navigasi modul |

**Role-Specific Dashboards (Future-Ready):**

| Dashboard | Untuk Role |
|---|---|---|
| **Manager** | Ringkasan per modul, approval pending (PR, PO) |
| **Sales** | Pipeline order (StatCards + SalesFunnelChart), recent quotations |
| **Procurement** | PR/PO status (StatCards), Top 5 Suppliers by Spend (HorizontalBarChart), PR→PO Cycle Time (BarChart) |
| **Gudang** | Stok (StatCards), Komposisi Stok per Kategori (Donut PieChart), Peringkat Stok Menipis (HorizontalBarChart) |
| **Finance** | AR/AP (StatCards), AR/AP Aging (ArapChart), AR Aging Distribution (AgingChart), Invoice Payment Velocity (BarChart), Arus Kas (CashflowChart) |
| **Owner/Admin** | Executive Command Center — 10 section dengan 7 jenis chart interaktif |
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
  → Auto-generate draft Invoice + draft Kwitansi (barengan)
  → Auto-link GRN ke Invoice (set `grn.invoice_id` dari DO yang punya `di_id`)
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
Nomor dokumen digenerate otomatis — tidak perlu input manual. Menggunakan **single global counter** dengan hierarki parent-child:

**Parent entry points (global counter):**
- RFQ Customer → `generateGlobalDocumentNumber('RFQC')`
- DI → `generateGlobalDocumentNumber('DI')`

**Child documents (copy nomor dari parent + format prefix):**
- Quotation (dari RFQC) → `formatChildNumber(parentNumber, 'SPH')` → `RRI-SPH-26-05-00001`
- Customer PO (dari QTN atau RFQC) → `formatChildNumber(parentNumber, 'CPO')`
- Sales Order (dari CPO atau DI) → `formatChildNumber(parentNumber, 'SO')`
- DO/Surat Jalan (dari SO) → `formatChildNumber(parentNumber, 'SJ')`
- Invoice (dari SO) → `formatChildNumber(parentNumber, 'INV')`
- Kwitansi (dari INV) → `formatChildNumber(parentNumber, 'KWT')`
- Tanda Terima (dari INV) → `formatChildNumber(parentNumber, 'TT')`
- GRN (dari DO) → `formatChildNumber(parentNumber, 'GRN')`
- Retur Penjualan (dari DO) → `formatChildNumber(parentNumber, 'RTJ')`
- GRN Customer / Retur Barang (dari Retur Penjualan) → `formatChildNumber(parentNumber, 'GRNC')`
- Retur Pembelian (dari PO) → `formatChildNumber(parentNumber, 'RP')`

**Utility functions** di `src/lib/utils/document-number.ts`:
- `generateGlobalDocumentNumber(kodeDokumen)` — increment global counter, return `RRI-{KODE}-YY-MM-NNNNN`
- `formatChildNumber(parentNumber, kodeDokumen)` — ekstrak nomor urut dari parent, ganti prefix → `RRI-{KODE}-YY-MM-NNNNN`
- `generateDocumentNumber(kodeDokumen)` — legacy per-document counter (masih ada untuk backward compat, tapi tidak lagi dipakai oleh dokumen baru)

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
- **Cron Job:** `src/app/api/v1/cron/invoice-due-date-reminder/route.ts` — endpoint yang dipanggil cron-job.org setiap hari jam 6 pagi WIB. Logic: cek semua invoice aktif (status != paid), hitung due date dari `tanggal + top`, hitung total dari `invoice_item`, kirim WA sesuai selisih hari (H-3, H-1, H, H+1...H+30).
- **Schedule:** `vercel.json` — `"0 1 * * *"` (setiap hari jam 1 AM UTC = 8 AM WIB).
- **Log:** Semua pengiriman tercatat di tabel `whatsapp_log` untuk monitoring.
- **Halaman:** `/dashboard/notifikasi` — riwayat notifikasi WhatsApp.

**Catatan Biaya:** Fonnte menyediakan **500 pesan gratis per hari** – lebih dari cukup untuk kebutuhan ERP RRI (estimasi ~20 pesan/hari). Vercel Cron gratis di Hobby Plan (maks 1x/hari).

### 8.5 Email Notification via SMTP (Implemented)

Pengiriman email otomatis terintegrasi dengan Nodemailer.

| Item | Detail |
|------|--------|
| **Library** | nodemailer (`npm install nodemailer`) |
| **Utility** | `src/lib/utils/email.ts` — fungsi kirim email dengan auto-logging ke tabel `email_log` |
| **SMTP Config** | Environment variables: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` |
| **Trigger** | Saat status Quotation berubah menjadi `sent` — notifikasi email ke PIC Customer |
| **Attachment** | PDF Quotation otomatis di-generate & dilampirkan |
| **Template** | Body email auto-generated: nomor quotation, link, pesan standar |
| **Logging** | Semua pengiriman tercatat di tabel `email_log` untuk monitoring |
| **Status** | ✅ Implemented |

**Alur:**
```
Quotation siap → Klik "Tandai Terkirim" → Status jadi `sent` → 
Generate PDF → Kirim via Nodemailer (SMTP) → Attachment PDF + Body auto →
Catat log di tabel email_log → Tampilkan status di halaman Quotation
```

## 9. Professional Features

| Fitur | Deskripsi |
|---|---|
| **Audit Trail** | Setiap create/update/delete tercatat: siapa, kapan, IP, data sebelum & sesudah. Tidak bisa dihapus |
| **Activity Log** | Timeline per transaksi — lihat histori lengkap satu SO/PO/Invoice dari awal sampai selesai |
| **Digital Approval** | Approve/Reject dengan digital signature (nama + timestamp) |
| **Global Search** | Satu search bar (shortcut `/` atau `Cmd+K`) untuk mencari di tabel: barang, customer, supplier, karyawan, PO, PR, SO, Customer PO, DO, Invoice, Quotation, RFQ Supplier, RFQ Customer, DI, GRN, Faktur Pajak, Kwitansi, Retur Jual/Beli, Jurnal, Negosiasi, Kontrak, Absensi, COA, Jabatan, Kategori Barang, Gudang, PIC Customer, Stock Opname, Pembayaran Supplier, Penggajian |
| **Export Excel / CSV** | Semua halaman list data punya tombol "Export Excel" yang memanggil API `/api/v1/export`. Owner & Manager sering minta data dalam Excel. |
| **Bulk Import Excel** ✅ | Input master data barang, supplier, customer via upload file Excel — Halaman `/dashboard/tools/bulk-import` |
| **Dark Mode** | Toggle dark/light mode — nyaman dipakai malam hari |
| **Keyboard Shortcuts** | Power user: `Ctrl+N` = Baru, `Ctrl+S` = Simpan, `/` = Fokus global search, `Escape` = Tutup modal |
| **Print-Friendly CSS** | Halaman dokumen langsung bisa di-print rapi dari browser tanpa perlu PDF |
| **Loading Skeleton** | Tidak ada spinner — skeleton loading memberikan kesan profesional |
| **User Management** ✅ | CRUD user, assign role, toggle active/non-active, edit profile. API: `/api/v1/admin/users`. Halaman: `/dashboard/system/users` |
| **Role-Based Navigation** ✅ | Sidebar & menu menyesuaikan role user — tidak lihat menu yang bukan haknya. Implementasi filter by role di `sidebar-nav.tsx` |
| **User Onboarding** | Walkthrough interaktif saat pertama login — user baru langsung paham cara pakai ERP. Tur 12 step dalam 6 grup mencakup semua modul. Tombol "Panduan" permanen di sidebar untuk replay. Bisa dinonaktifkan/aktifkan via profil (field `onboarding_disabled` di tabel `users`) |
| **Multi-Bahasa (future)** | Persiapan i18n jika nanti ada customer atau kebutuhan internasional |
| **Maintenance Mode** ✅ | Toggle di `/dashboard/system/maintenance` — API + DB + layout guard + halaman maintenance |
| **Soft Delete** | Semua data hanya di-soft-delete (`deleted_at`), tidak pernah hilang permanen |
| **Data Archiving** ✅ | Data lama (>1 tahun) bisa di-archive ke `data_archive` table. Halaman `/dashboard/system/archive`. API: `POST /api/v1/system/archive`. Proses archiving dijadwalkan manual via admin. |
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
Auto-generate SALES ORDER (dengan TOP dari kontrak, harga satuan dari kontrak_item via `di.kontrak_id`)
  Atau manual: Tab "Dari DI" di halaman tambah SO → pilih DI → auto-load customer + items + harga
  ↓
Cek: Apakah stok tersedia?
  ├── YES → Auto-generate DO → Kirim barang
  └── NO  → Auto-generate PURCHASE REQUEST
        ├── AI Search harga Shopee/Tokopedia
        ├── Manager approve PR (escalation 24 jam jika pending)
        ├── Purchase Order (PO) ke supplier (nomor: RRI-PO-YY-MM-0001)
        ├── Checkout & bayar di Shopee/Tokopedia (manual)
        ├── Barang datang → Receiving → GRN → Stok masuk
        └── Lanjut auto-generate DO
  ↓
DELIVERY ORDER (DO) — Surat Jalan (nomor: RRI-SJ-YY-MM-0001)
  ↓
Barang dikirim ke Customer
  ↓
DO status "Dikirim" → Auto-generate INVOICE + KWITANSI (barengan, draft)
  ↓
INVOICE + KWITANSI (nomor: RRI-INV-YY-MM-0001, RRI-KWT-YY-MM-0001)
Dokumen kelengkapan Invoice diinput via halaman Invoice detail:
- Nomor GRN dari customer (input manual)
- File GRN customer (PDF upload via Invoice detail page)
Termasuk PPN 11% dan PPh (jika berlaku)
  ↓
Auto-buat JURNAL (debit AR, credit Revenue, credit PPN)
  ↓
Finance: Tagih Customer (AR) sesuai TOP yang dipilih saat pembuatan Customer PO / DI
  → Due date = tanggal Invoice + TOP (Net 14/30/60/90, Cash, Custom)
  → Auto-reminder jatuh tempo
  ↓
Customer bayar
  ↓
Jurnal masuk (debit Cash/Bank, credit AR)
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
RRI buat QUOTATION (nomor: RRI-SPH-YY-MM-0001)
  → Harga: Default (cost + 15%) atau Manual
  → Kirim Quotation ke Customer
  ↓
Negosiai? ← Procurement customer nego harga
  ├── YES → Counter offer → Approve internal → Kirim ulang
  └── NO  → LANJUT
  ↓
Customer SETUJU (deal) → Customer terbitkan PO (TOP sesuai master customer)
  ↓
Auto-generate SALES ORDER (Tab "Dari Customer PO" di halaman tambah SO)
  Atau dari DI: Tab "Dari Delivery Instruction" → pilih DI → auto-load + review harga
  ↓
Cek stok → jika kurang → PROCUREMENT FLOW (sama seperti Jalur A)
  ↓
Auto-generate DO → Kirim barang
  ↓
DO status "Dikirim" → Auto-generate INVOICE + KWITANSI (barengan, draft)
  ↓
INVOICE + KWITANSI
Dokumen kelengkapan Invoice diinput via halaman Invoice detail:
- Nomor GRN dari customer (input manual)
- File GRN customer (PDF upload via Invoice detail page)
Termasuk PPN 11% dan PPh (jika berlaku)
  ↓
Auto-buat JURNAL (debit AR, credit Revenue, credit PPN)
  ↓
Finance: Tagih Customer (AR) sesuai TOP yang dipilih saat pembuatan Customer PO / DI
  → Due date = tanggal Invoice + TOP (Net 14/30/60/90, Cash, Custom)
  → Auto-reminder jatuh tempo
  ↓
Customer bayar
  ↓
Jurnal masuk (debit Cash/Bank, credit AR)
  ↓
END
```

### Jalur C — Retur Penjualan (dari Customer)

```
Customer kirim barang retur (cacat/tidak sesuai)
  ↓
User buat RETUR PENJUALAN (manual — auto-populate dari DO)
  ↓
Retur Penjualan → "closed" (disetujui)
  → Auto-generate RETUR BARANG (GRN) draft
  → Auto-buat Jurnal Retur (debit Revenue, credit AR)
  ↓
Warehouse verifikasi barang fisik, set GRN → "completed"
  → Stok otomatis bertambah (stok_mutasi tipe 'masuk')
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

// Menghasilkan: RRI-SPH-26-05-0001
const nomor = await generateDocumentNumber('SPH')
```

**Cara Kerja:**
1. Panggil PostgreSQL function `increment_document_counter(p_kode_dokumen, p_tahun, p_bulan)`
2. Function melakukan atomic upsert + increment counter
3. Return formatted string: `RRI-{KODE}-{YY}-{MM}-{0000}`
4. Counter di-reset otomatis setiap tahun/bulan berganti

#### 12.2.6 Authentication Architecture

**Pattern: Client-Side Auth with Supabase Auth**

ERP RRI uses **client-side authentication** via Supabase Auth with an `AuthProvider` context:

| File | Fungsi |
|------|--------|
| `src/lib/hooks/use-auth.tsx` | Auth context provider + `useAuth` hook — wraps `onAuthStateChange` listener |
| `src/app/dashboard/auth-guard-client.tsx` | `AuthGuardClient` — client component that checks `isAuthenticated`, shows loading spinner, redirects to `/login` if not authenticated |
| `src/app/dashboard/layout.tsx` | Dashboard layout wraps with `AuthGuardClient` for route protection |
| `src/app/(auth)/login/page.tsx` | Glassmorphism card, spinner loading (no skeleton), client-side Supabase auth, Lucide icons, `#0000FF` theme, `animate-fade-in-up` entrance |
| `src/app/(auth)/register/page.tsx` | Aligned styling with login — same card design, icon-prefixed inputs, spinner button |
| `src/app/(auth)/layout.tsx` | Dual-panel: brand panel (animated mesh gradient `#0000FF` → `#0A0E27`) + form panel (entrance animation) |

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

barang                   → master barang (field: satuan — free-text, bukan tabel terpisah)
                         (+ kontrak_id — FK ke kontrak, ON DELETE CASCADE. Barang import dari kontrak terhapus otomatis saat kontrak dihapus)
kategori_barang          → kategori barang

supplier                  → data supplier (termasuk marketplace, field: kontak — single contact)
                         (+ supplier_kontak — multiple kontak ✅ API + detail page kontak management)

customer                 → data customer
customer_pic             → multiple PIC per customer
customer_top             → terms of payment per customer (net_30, net_60, cash, custom) ✅ CRUD API + halaman detail customer

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

customer_po              → po dari customer (field: waktu_pengiriman INTEGER, pic_customer_id TEXT FK ke customer_pic)
customer_po_item         → item dalam po customer

di                       → delivery instruction
di_item                  → item dalam di
di_pic                   → assign PIC customer ke di

sales_order              → sales order internal (field: waktu_pengiriman INTEGER — dari Customer PO, di_id — opsional untuk SO dari DI, is_active)
sales_order_item         → item dalam so
sales_order_document     → dokumen lampiran SO

delivery_order           → surat jalan (field: waktu_pengiriman INTEGER — dari Sales Order)
delivery_order_item      → item dalam do

grn                      → goods received note (dari supplier)
grn_item                 → item dalam grn

grn_customer             → retur barang (GRN) — penerimaan barang retur dari customer
grn_customer_item        → item dalam grn customer
                          (auto-generated saat retur penjualan → closed, atau manual via form tambah)

retur_penjualan          → retur dari customer (field: waktu_pengiriman INTEGER)
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
tanda_terima             → tanda terima dokumen penagihan (nomor: RRI-TT-YY-MM-0001)

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
email_log                → log pengiriman email notifikasi (status: terkirim/gagal)
```

### 12.4 Nomor Dokumen Otomatis

#### 12.4.1 Sistem Counter Existing

Implementasi counter di PostgreSQL:

```sql
CREATE TABLE document_counter (
  kode_dokumen TEXT NOT NULL,   -- SPH, SJ, INV, KWT, PO, GRN, RTJ, RTB, TT
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
) RETURNS INTEGER AS $$
DECLARE
  v_counter INTEGER;
BEGIN
  INSERT INTO document_counter (kode_dokumen, tahun, bulan, counter)
  VALUES (p_kode_dokumen, p_tahun, p_bulan, 1)
  ON CONFLICT (kode_dokumen, tahun, bulan)
  DO UPDATE SET counter = document_counter.counter + 1
  RETURNING counter INTO v_counter;

  RETURN v_counter;
END;
$$ LANGUAGE plpgsql;
```

**Usage dari TypeScript:**
```typescript
import { generateDocumentNumber } from '@/lib/utils/document-number'

// Output: "RRI-SPH-26-05-0001"
const nomor = await generateDocumentNumber('SPH')
```

#### 12.4.2 Document Number Reservation System

**Problem Statement:**
- **Race condition:** 2 user buka form bersamaan → dapat nomor yang sama
- **Nomor hangus:** User submit gagal/error → nomor sudah terpakai
- **Tidak ada validasi:** Tidak ada pengecekan "nomor terakhir" sebelum generate
- **Tidak ada sinkronisasi:** Counter terpisah untuk setiap modul (RFQC, SPH, NEG, CPO, DI, dll)

**Solution: Reserve on Form Open + Validate on Submit**

**Database Schema:**

```sql
CREATE TABLE document_number_reservation (
  reserve_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_dokumen TEXT NOT NULL,
  nomor TEXT NOT NULL,
  tahun INTEGER NOT NULL,
  bulan INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  modul TEXT NOT NULL, -- 'rfq-customer', 'quotation', 'di', dll
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used BOOLEAN NOT NULL DEFAULT FALSE
);

-- Index untuk cleanup & lookup
CREATE INDEX idx_reservation_expires ON document_number_reservation(expires_at);
CREATE INDEX idx_reservation_user ON document_number_reservation(user_id);
CREATE INDEX idx_reservation_kode ON document_number_reservation(kode_dokumen, tahun, bulan, used);
```

**PostgreSQL Functions:**

```sql
-- Reserve nomor dengan TTL
CREATE OR REPLACE FUNCTION reserve_document_number(
  p_kode_dokumen TEXT,
  p_tahun INTEGER,
  p_bulan INTEGER,
  p_user_id UUID,
  p_modul TEXT,
  p_ttl_minutes INTEGER DEFAULT 15
) RETURNS TABLE (
  reserve_id UUID,
  nomor TEXT,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_counter INTEGER;
  v_nomor TEXT;
  v_reserve_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Get & increment counter (atomic upsert)
  INSERT INTO document_counter (kode_dokumen, tahun, bulan, counter)
  VALUES (p_kode_dokumen, p_tahun, p_bulan, 1)
  ON CONFLICT (kode_dokumen, tahun, bulan)
  DO UPDATE SET counter = document_counter.counter + 1
  RETURNING counter INTO v_counter;
  
  -- Format nomor
  v_nomor := format('RRI-%s-%s-%s-%s',
    p_kode_dokumen,
    lpad(p_tahun::text, 2, '0'),
    lpad(p_bulan::text, 2, '0'),
    lpad(v_counter::text, 4, '0')
  );
  
  -- Set expiry
  v_expires_at := NOW() + (p_ttl_minutes || ' minutes')::INTERVAL;
  
  -- Create reservation
  INSERT INTO document_number_reservation
    (kode_dokumen, nomor, tahun, bulan, user_id, modul, expires_at)
  VALUES
    (p_kode_dokumen, v_nomor, p_tahun, p_bulan, p_user_id, p_modul, v_expires_at)
  RETURNING reserve_id INTO v_reserve_id;
  
  RETURN QUERY SELECT v_reserve_id, v_nomor, v_expires_at;
END;
$$ LANGUAGE plpgsql;

-- Validasi & gunakan reservation
CREATE OR REPLACE FUNCTION use_reserved_number(
  p_reserve_id UUID,
  p_user_id UUID
) RETURNS TABLE (
  success BOOLEAN,
  nomor TEXT,
  message TEXT
) AS $$
DECLARE
  v_reservation RECORD;
  v_is_expired BOOLEAN;
BEGIN
  -- Fetch reservation
  SELECT * INTO v_reservation
  FROM document_number_reservation
  WHERE reserve_id = p_reserve_id
    AND user_id = p_user_id;
  
  -- Check if exists
  IF v_reservation IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'Reservation not found';
    RETURN;
  END IF;
  
  -- Check if already used
  IF v_reservation.used THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'Reservation already used';
    RETURN;
  END IF;
  
  -- Check expiry
  v_is_expired := v_reservation.expires_at < NOW();
  
  IF v_is_expired THEN
    -- Release reservation (mark as used so it's not reused)
    UPDATE document_number_reservation
    SET used = TRUE
    WHERE reserve_id = p_reserve_id;
    
    RETURN QUERY SELECT false, NULL::TEXT, 'Reservation expired';
    RETURN;
  END IF;
  
  -- Mark as used
  UPDATE document_number_reservation
  SET used = TRUE
  WHERE reserve_id = p_reserve_id;
  
  RETURN QUERY SELECT true, v_reservation.nomor, 'Success'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired reservations (dipanggil via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Mark expired as used (release nomor)
  UPDATE document_number_reservation
  SET used = TRUE
  WHERE used = FALSE AND expires_at < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

**API Endpoints:**

```typescript
// GET /api/v1/{modul}/next-number
// Reserve nomor untuk form
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  const result = await reserveDocumentNumber(kodeDokumen, modul, auth.user!.id, 15)
  return NextResponse.json({
    data: {
      nomor: result.nomor,
      reserveId: result.reserveId,
      expiresAt: result.expiresAt,
    },
  })
}

// POST /api/v1/{modul}
// Validasi reserveId saat submit
export async function POST(request: NextRequest) {
  // ... parse body
  let nomor: string
  
  if (parsed.data.reserveId) {
    const result = await useReservedNumber(parsed.data.reserveId, auth.user!.id)
    if (result.success && result.nomor) {
      nomor = result.nomor
    } else {
      // Fallback: generate new number jika reservation expired/invalid
      nomor = await generateDocumentNumber(kodeDokumen)
    }
  } else {
    // Backward compatibility: fallback ke sistem lama
    nomor = await generateDocumentNumber(kodeDokumen)
  }
  
  // ... insert ke database
}
```

**Frontend Implementation:**

```typescript
// Form component (use client)
export default function TambahPage() {
  const [nomorAuto, setNomorAuto] = useState('')
  const [reserveId, setReserveId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [expiringSoon, setExpiringSoon] = useState(false)

  // Fetch nomor saat mount
  useEffect(() => {
    apiFetch<{ nomor: string; reserveId: string; expiresAt: string }>('/api/v1/rfq-customer/next-number')
      .then(res => {
        setNomorAuto(res.data.nomor)
        setReserveId(res.data.reserveId)
        setExpiresAt(res.data.expiresAt)
      })
  }, [])

  // Countdown timer untuk expiry
  useEffect(() => {
    if (!expiresAt) return
    
    const checkExpiry = setInterval(() => {
      const now = new Date()
      const expiry = new Date(expiresAt)
      const diff = expiry.getTime() - now.getTime()
      
      // Warning 5 menit sebelum expired
      if (diff < 5 * 60 * 1000 && diff > 0) {
        setExpiringSoon(true)
        toast.warning('Nomor akan kadaluarsa segera. Silakan submit form.')
      }
      
      // Handle expired
      if (diff <= 0) {
        setExpiringSoon(false)
        toast.error('Nomor reservasi kadaluarsa. Silakan refresh halaman.')
      }
    }, 10000)
    
    return () => clearInterval(checkExpiry)
  }, [expiresAt])

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      reserveId, // Include reserveId
    }
    await apiFetch('/api/v1/rfq-customer', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }
}
```

**Cron Job Setup:**

```json
// vercel.json
{
  "crons": [{
    "path": "/api/v1/cron/cleanup-reservations",
    "schedule": "0 */6 * * *" // Run setiap 6 jam
  }]
}
```

**Configuration:**

| Parameter | Value | Deskripsi |
|-----------|-------|-----------|
| TTL | 15 menit | Waktu reserve sebelum expired |
| Cleanup Frequency | Setiap 6 jam | Cron job cleanup expired reservations |
| Warning Threshold | 5 menit | Warning countdown sebelum expired |
| Backward Compatibility | ✅ Yes | Fallback ke `generateDocumentNumber()` jika `reserveId` tidak ada/invalid |

**Monitoring Dashboard:**

Endpoint: `/dashboard/admin/reservations`

Fitur:
- Active reservations (belum expired, belum used)
- Expired reservations (hari ini)
- Usage statistics (berapa nomor yang hangus vs terpakai)
- Filter by modul, user, tanggal

**Rollback Plan:**

1. **Disable Reservation di Frontend:** Revert frontend changes (hapus `reserveId` dari payload)
2. **Bypass Reservation di Backend:** Add feature flag `ENABLE_NUMBER_RESERVATION`
3. **Emergency Cleanup:**
   ```sql
   UPDATE document_number_reservation
   SET used = FALSE
   WHERE used = TRUE AND created_at > NOW() - INTERVAL '1 hour';
   ```

**Trade-offs:**

| Keuntungan | Kekurangan |
|------------|------------|
| ✅ Tidak ada race condition | ❌ Kompleksitas bertambah |
| ✅ User tahu nomor di awal (UX lebih baik) | ❌ Overhead database (insert per form open) |
| ✅ Audit trail lengkap | ❌ Potensi nomor hangus jika user tidak submit |
| ✅ Nomor tidak hangus jika user batal submit (TTL expired → release) | |

**Mitigasi:**
- TTL 15 menit — cukup untuk user isi form, tidak terlalu lama untuk hangus
- Cleanup job setiap 6 jam — release nomor expired
- Monitoring dashboard — track berapa nomor yang hangus per hari

**Modul yang Diimplementasi (Phase 1):**
1. RFQ Customer (`RFQC`)
2. Quotation (`SPH`)
3. DI (`DI`)

**Modul yang Akan Diimplementasi (Phase 2+):**
- Customer PO (`CPO`), Negosiasi (`NEG`), Sales Order (`SO`), Delivery Order (`SJ`), Invoice (`INV`), Kwitansi (`KWT`), GRN Customer (`GRNC`), Retur Penjualan (`RTJ`), Retur Pembelian (`RP`), dll.

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