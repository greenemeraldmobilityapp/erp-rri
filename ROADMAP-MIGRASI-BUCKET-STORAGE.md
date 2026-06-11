# ROADMAP — Migrasi Storage: Supabase → Cloudflare R2

> Mentransisikan seluruh penyimpanan file ERP (dokumen, gambar barang, avatar, dll) dari Supabase Storage (bucket `dokumen`) ke Cloudflare R2 (bucket `erp-documents`). Path direktori **tidak berubah** — yang berubah hanya provider storage di belakang layar.

---

## 📊 Latar Belakang

| Item | Supabase Storage (Saat Ini) | Cloudflare R2 (Target) |
|------|----------------------------|------------------------|
| **Free tier** | 1 GB | 10 GB |
| **Estimasi pemakaian/tahun** | ~800 MB | ~800 MB |
| **Durasi gratis** | ~1 tahun | ~12 tahun |
| **Upgrade plan** | $25/bulan (100 GB) | Tidak perlu upgrade |
| **Egress (bandwidth)** | Termasuk dalam plan | **$0 selamanya** |
| **CDN** | Supabase CDN | Cloudflare global network |
| **Kustom domain** | Tidak support | ✅ Support gratis |

--- 

## 🏗️ Arsitektur Target

```
Cloudflare R2 Bucket: erp-documents
│
├── dokumen/                              ← Semua dokumen ERP (sama persis)
│   ├── rfq-customer/{id}/{file}
│   ├── rfq-supplier/{id}/{file}
│   ├── quotation/{id}/{file}
│   ├── customer-po/{id}/{file}
│   ├── kontrak/{id}/{file}
│   ├── di/{id}/{file}
│   ├── sales-order/{id}/{file}
│   ├── delivery-order/{id}/{file}
│   ├── delivery-order/{id}/barang_diterima-{ts}-{file}
│   ├── delivery-order/{id}/surat_jalan-{ts}-{file}
│   ├── invoice/{id}/{file}
│   ├── grn/{id}/{file}
│   ├── retur-penjualan/{id}/{file}
│   ├── retur-pembelian/{id}/{file}
│   ├── ocr-kontrak/{ts}-{file}
│   └── temp/rfq-customer/{type}/{ts}-{file}
│
├── barang/{barangId}/{ts}-foto-{n}.webp  ← Gambar barang
├── avatars/{userId}/{ts}-avatar.jpg      ← Foto profil user
├── company/{ts}_{file}                   ← Logo company
└── temporary/{sessionId}/{file}          ← Temporary upload (excel, dll)

Public URL: https://files.erp.pt-rri.com/{path}
```

### Path Tidak Berubah

**Contoh — sebelum & sesudah migrasi:**

| File | Path (sama) |
|------|-------------|
| Dokumen Quotation | `dokumen/quotation/{uuid}/SPH-001.pdf` |
| Gambar Barang | `barang/{uuid}/1234567890-foto-1.webp` |
| Avatar User | `avatars/{uuid}/1234567890-avatar.jpg` |
| Logo Company | `company/1234567890_logo.png` |
| OCR Kontrak | `dokumen/ocr-kontrak/1234567890-file.pdf` |

---

## ✅ Prasyarat

1. **Domain `pt-rri.com`** sudah di Cloudflare ✅ (existing)
2. **`@aws-sdk/client-s3`** + **`@aws-sdk/s3-request-presigner`** sudah terinstall ✅ (dari Phase 11 email)
3. **Abstraction layer `IStorageService`** sudah ada di `src/lib/storage/` ✅
4. **24 API route files** sudah pakai `storageService` singleton ✅
5. **`drive_file_id`** di semua 15 tabel document sudah menyimpan path objek ✅

---

## 🗺️ Tahapan Implementasi

---

### 🔧 Tahap 1 — Infrastruktur Cloudflare (15 menit)

*Lakukan di Cloudflare Dashboard — tidak ada perubahan kode.*

| # | Task | Lokasi | Detail |
|---|------|--------|--------|
| CF-1 | **Buat R2 bucket `erp-documents`** | Cloudflare Dashboard → R2 → Create Bucket | Nama: `erp-documents`. Location: Automatic |
| CF-2 | **Buat R2 API token** | Cloudflare Dashboard → R2 → Manage R2 API Tokens → Create API Token | Permission: **Admin Read & Write** (untuk bucket `erp-documents`). Simpan `Access Key ID` + `Secret Access Key` |
| CF-3 | **Set custom domain `files.erp.pt-rri.com`** | Cloudflare Dashboard → R2 → `erp-documents` → Settings → Custom Domain | Masukkan `files.erp.pt-rri.com`. Cloudflare auto-provision SSL + tambah CNAME record ke DNS |
| CF-4 | **Test akses public** | Browser | Buka `https://files.erp.pt-rri.com` → harusnya return `401 Unauthorized` (status R2, bukan Cloudflare error) |

**Catatan:** Custom domain `files.erp.pt-rri.com` akan melayani file secara publik — siapa pun dengan URL bisa akses. Ini sama seperti public URL Supabase Storage saat ini. Jika ingin akses terbatas, perlu signed URL (presigned) — tapi untuk use case ERP RRI (share dokumen ke customer/supplier), public URL sudah sesuai.

---

### 📝 Tahap 2 — Implementasi Kode (2-3 jam)

#### 2.1 Buat: `src/lib/storage/r2.ts`

Implementasi baru dari `IStorageService` menggunakan S3 SDK → Cloudflare R2.

**Struktur kode (~80 baris):**

```typescript
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from "@aws-sdk/client-s3"
import type { IStorageService, UploadResult, StoredFile } from './types'

function getClient() {
  const endpoint = process.env.R2_DOCUMENTS_ENDPOINT
  const accessKeyId = process.env.R2_DOCUMENTS_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_DOCUMENTS_SECRET_ACCESS_KEY
  const bucket = process.env.R2_DOCUMENTS_BUCKET

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("R2_DOCUMENTS_* environment variables not configured")
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })

  return { client, bucket }
}

const PUBLIC_URL_BASE = 'https://files.erp.pt-rri.com'

export const storageService: IStorageService = {
  async upload(buffer: Buffer, filePath: string, mimeType: string): Promise<UploadResult> {
    const { client, bucket } = getClient()
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: filePath,
      Body: buffer,
      ContentType: mimeType,
    }))

    return {
      fileId: filePath,
      webViewLink: `${PUBLIC_URL_BASE}/${filePath}`,
      webContentLink: `${PUBLIC_URL_BASE}/${filePath}`,
    }
  },

  async getUrl(fileId: string) {
    return {
      webViewLink: `${PUBLIC_URL_BASE}/${fileId}`,
      webContentLink: `${PUBLIC_URL_BASE}/${fileId}`,
    }
  },

  async copy(fromPath: string, toPath: string) {
    const { client, bucket } = getClient()
    await client.send(new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${fromPath}`,
      Key: toPath,
    }))

    return {
      fileId: toPath,
      webViewLink: `${PUBLIC_URL_BASE}/${toPath}`,
    }
  },

  async delete(fileId: string): Promise<void> {
    const { client, bucket } = getClient()
    await client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: fileId,
    }))
  },

  async list(prefix: string): Promise<StoredFile[]> {
    const { client, bucket } = getClient()
    const result = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: 200,
    }))

    return (result.Contents ?? [])
      .filter(obj => obj.Key && !obj.Key.endsWith('/'))
      .map(obj => ({
        fileId: obj.Key!,
        name: obj.Key!.split('/').pop() ?? obj.Key!,
        webViewLink: `${PUBLIC_URL_BASE}/${obj.Key!}`,
        webContentLink: `${PUBLIC_URL_BASE}/${obj.Key!}`,
        size: obj.Size ?? undefined,
      }))
  },
}
```

#### 2.2 Update: `src/lib/storage/index.ts`

**Perubahan:** 1 baris — ganti export dari Supabase ke R2.

```typescript
// SEBELUM:
export { storageService } from './supabase'

// SESUDAH:
export { storageService } from './r2'
```

**Dampak:** Semua 24 consumer `@/lib/storage` otomatis pakai R2.

#### 2.3 Perbaiki: `src/app/api/v1/dokumen/[id]/route.ts`

**Masalah:** Baris 58-71 saat ini parsing URL Supabase untuk extract path dan panggil `supabaseAdmin.storage.remove()` langsung — bukan via `storageService`.

**Fix:** Ganti dengan `storageService.delete()` pakai `drivefileid` dari view.

```typescript
// SEBELUM (baris 58-71):
const fileUrl = doc.fileurl
if (fileUrl && !fileUrl.startsWith('/api/')) {
  const url = new URL(fileUrl)
  const path = url.pathname.split('/').slice(-3).join('/')
  const bucket = 'dokumen'
  const { error: storageError } = await supabaseAdmin.storage
    .from(bucket)
    .remove([path])
  if (storageError) {
    console.error('Failed to delete file from storage:', storageError)
  }
}

// SESUDAH:
// Hapus file dari storage via storageService (gunakan drivefileid dari view)
// drivefileid berisi path objek, misal: dokumen/quotation/{uuid}/file.pdf
if (doc.drivefileid) {
  try {
    await storageService.delete(doc.drivefileid)
  } catch (err) {
    console.error('Failed to delete file from storage:', err)
  }
}
```

**Import yang perlu ditambahkan:**
```typescript
import { storageService } from '@/lib/storage'
```

#### 2.4 Perbaiki: `src/app/api/v1/master/barang/[id]/image/route.ts`

**Masalah:** 2 tempat (POST baris 29-34, DELETE baris 65-69) menggunakan regex `/\/public\/dokumen\/(.+)/` untuk extract path dari Supabase URL.

**Fix:** Ekstrak path dari R2 URL (dengan prefix `files.erp.pt-rri.com/`).

```typescript
// SEBELUM (POST, baris 29-34):
if (barang.image_url) {
  const match = barang.image_url.match(/\/public\/dokumen\/(.+)/)
  if (match) {
    await storageService.delete(match[1]).catch(() => {})
  }
}

// SESUDAH:
if (barang.image_url) {
  const path = extractPathFromUrl(barang.image_url)
  if (path) {
    await storageService.delete(path).catch(() => {})
  }
}
```

Buat helper function di file yang sama atau di utility:
```typescript
function extractPathFromUrl(url: string): string | null {
  // R2 custom domain: https://files.erp.pt-rri.com/{path}
  const r2Match = url.match(/https:\/\/files\.erp\.pt-rri\.com\/(.+)/)
  if (r2Match) return r2Match[1]
  // Fallback: Supabase URL — untuk existing data sebelum migrasi
  const supabaseMatch = url.match(/\/public\/dokumen\/(.+)/)
  if (supabaseMatch) return supabaseMatch[1]
  return null
}
```

**Catatan:** Helper ini reusable untuk kasus lain yang mungkin juga parsing URL storage.

#### 2.5 Update: `src/app/api/v1/system/health/route.ts`

**Perubahan:** Baris 64 — ganti label provider.

```typescript
// SEBELUM:
provider: 'supabase',

// SESUDAH:
provider: 'cloudflare-r2',
```

#### 2.6 Update: `.env.example`

Tambah 4 environment variable baru (terpisah dari R2 email-attachments):

```bash
# === Cloudflare R2 — Dokumen ERP Storage (migrasi dari Supabase Storage) ===
# Bucket untuk semua file ERP: dokumen, barang images, avatars, company logo, dll.
# Get from: Cloudflare Dashboard → R2 → erp-documents → Settings → API
R2_DOCUMENTS_ENDPOINT=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.cloudflarestorage.com
R2_DOCUMENTS_ACCESS_KEY_ID=your_access_key_id
R2_DOCUMENTS_SECRET_ACCESS_KEY=your_secret_access_key
R2_DOCUMENTS_BUCKET=erp-documents

# === Cloudflare R2 — Email Attachment Storage (Phase 11, existing) ===
R2_ENDPOINT=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET=email-attachments
```

**Update komentar Supabase Storage (baris 29-30):**
```bash
# Supabase Storage — TIDAK DIPAKAI LAGI untuk file storage
# Semua file sekarang pakai Cloudflare R2 (bucket: erp-documents)
```

---

### 🔄 Tahap 3 — Data Migration (2-3 jam, one-time script)

Script untuk migrasi massal semua file dari Supabase Storage ke Cloudflare R2.

#### 3.1 Buat: `scripts/migrate-storage-to-r2.ts`

**Algoritma:**

```
1. Konek ke Supabase (via supabaseAdmin / service role)
2. Konek ke R2 (via S3 client)
3. List semua folder/prefix di bucket 'dokumen':
   - dokumen/
   - barang/
   - avatars/
   - company/
   - temporary/
4. Untuk setiap folder:
   a. List semua file dari Supabase (rekursif, pagination)
   b. Download file buffer
   c. Upload ke R2 dengan path SAMA PERSIS
   d. Catat mapping path lama → path baru
5. Update database:
   a. Untuk setiap tabel document (*_document):
      - UPDATE file_url = REPLACE(file_url, 'supabase.co/storage/v1/object/public/dokumen/', 'files.erp.pt-rri.com/')
   b. Untuk barang:
      - UPDATE barang SET image_url = REPLACE(image_url, '...', '...') WHERE image_url IS NOT NULL
   c. Untuk delivery_order:
      - UPDATE delivery_order SET delivery_slip_file_url = REPLACE(...) WHERE delivery_slip_file_url IS NOT NULL
   d. Untuk tabel lain yang menyimpan file_url (ai_ocr_history, ai_vision_history, dll)
6. Generate laporan: sukses/gagal per file
```

**Detail teknis:**

| Aspek | Implementasi |
|-------|-------------|
| **Download dari Supabase** | `supabaseAdmin.storage.from('dokumen').download(path)` → `Blob` → `Buffer` |
| **List file Supabase** | `supabaseAdmin.storage.from('dokumen').list(folder, { limit: 100, offset: n })` — looping sampai habis |
| **Upload ke R2** | `PutObjectCommand` dengan path yang sama |
| **Concurrency** | `Promise.allSettled()` dengan batch 5-10 file paralel |
| **Progress** | `stdout` per 100 file + estimasi waktu |
| **Dry-run mode** | Opsional: `--dry-run` hanya hitung file tanpa eksekusi |
| **Rollback** | Path tetap, jika ada error tinggal retry file tertentu |

**Cara menjalankan:**
```bash
# Dry run (hitung jumlah file)
npx tsx scripts/migrate-storage-to-r2.ts --dry-run

# Migrasi aktual
npx tsx scripts/migrate-storage-to-r2.ts

# Migrasi spesifik folder (jika perlu retry)
npx tsx scripts/migrate-storage-to-r2.ts --prefix dokumen/quotation
```

#### 3.2 Update URL di Database (SQL alternatif jika script lambat)

Alternatif untuk update URL di database — langsung pakai SQL `REPLACE()`:

```sql
-- Update semua tabel document
UPDATE rfq_customer_document SET file_url = REPLACE(file_url, 
  'https://<project>.supabase.co/storage/v1/object/public/dokumen/', 
  'https://files.erp.pt-rri.com/');
UPDATE quotation_document SET file_url = REPLACE(file_url, ...);
UPDATE customer_po_document SET file_url = REPLACE(file_url, ...);
UPDATE di_document SET file_url = REPLACE(file_url, ...);
UPDATE sales_order_document SET file_url = REPLACE(file_url, ...);
UPDATE delivery_order_document SET file_url = REPLACE(file_url, ...);
UPDATE invoice_document SET file_url = REPLACE(file_url, ...);
UPDATE kwitansi_document SET file_url = REPLACE(file_url, ...);
UPDATE retur_penjualan_document SET file_url = REPLACE(file_url, ...);
UPDATE retur_pembelian_document SET file_url = REPLACE(file_url, ...);
UPDATE grn_document SET file_url = REPLACE(file_url, ...);
UPDATE grn_customer_document SET file_url = REPLACE(file_url, ...);
UPDATE kontrak_file SET file_url = REPLACE(file_url, ...);
UPDATE rfq_supplier_document SET file_url = REPLACE(file_url, ...);

-- Update tabel non-document
UPDATE barang SET image_url = REPLACE(image_url, ...) WHERE image_url IS NOT NULL;
UPDATE delivery_order SET delivery_slip_file_url = REPLACE(delivery_slip_file_url, ...) WHERE delivery_slip_file_url IS NOT NULL;
UPDATE ai_ocr_history SET file_url = REPLACE(file_url, ...) WHERE file_url IS NOT NULL;
UPDATE ai_vision_history SET file_url = REPLACE(file_url, ...) WHERE file_url IS NOT NULL;
```

**Peringatan:** Jalankan SQL UPDATE ini **hanya** setelah semua file sukses di-copy ke R2. Jika ada file yang gagal di-copy, URL baru akan broken.

---

### 🚀 Tahap 4 — Switch ke R2 + Verifikasi (30 menit)

| # | Task | Detail |
|---|------|--------|
| SW-1 | **Set env vars di Vercel** | `npx vercel env add R2_DOCUMENTS_ENDPOINT` (Production + Preview + Development). Lakukan untuk 4 variable |
| SW-2 | **Deploy kode** | `npm run lint && npm run build` (sequential). Lalu `npx vercel deploy --prod` |
| SW-3 | **Verifikasi upload baru** | Upload dokumen via modul mana pun → cek di Cloudflare R2 Dashboard → file muncul di bucket `erp-documents` |
| SW-4 | **Verifikasi public URL** | Buka `https://files.erp.pt-rri.com/dokumen/{modul}/{id}/{file}` → file bisa diakses |
| SW-5 | **Verifikasi delete** | Hapus dokumen via UI → file di R2 harus terhapus |
| SW-6 | **Verifikasi download** | Download dari halaman Dokumen Management → blob berfungsi |
| SW-7 | **Verifikasi health check** | `GET /api/v1/system/health` → `storage.provider` = `cloudflare-r2` |
| SW-8 | **Verifikasi semua modul** | Cek 2-3 modul: upload, list, delete dokumen berfungsi normal |

---

### 🧹 Tahap 5 — Cleanup (optional, 15 menit)

> **Status per 11 Jun 2026:** Tahap 5 belum dilakukan. Semua file Supabase Storage masih ada dan dipakai sebagai **backup**.

| # | Task | Status | Detail |
|---|------|--------|--------|
| CL-1 | **Hapus file Supabase Storage** | ⏳ Belum dilakukan | Hanya lakukan jika backup tidak diperlukan lagi. `supabaseAdmin.storage.from('dokumen').remove(['...'])` via script atau hapus via Supabase Dashboard |
| CL-2 | **Update PRD.md** | ✅ Done | Section 5: diganti "Supabase Storage" → "Cloudflare R2". Tabel storage strategy, arsitektur upload, dll sudah di-update |
| CL-3 | **Update AGENTS.md** | ✅ Done | Env vars R2 documents, command reference, storage structure sudah di-update |
| CL-4 | **Archive migration script** | ✅ Done | `scripts/migrate-storage-to-r2.ts` disimpan untuk referensi |

---

## 📁 Files yang Berubah / Dibuat

### File Baru
| File | Fungsi |
|------|--------|
| `src/lib/storage/r2.ts` | Implementasi `IStorageService` untuk Cloudflare R2 |
| `scripts/migrate-storage-to-r2.ts` | One-time migration script |
| `ROADMAP-MIGRASI-BUCKET-STORAGE.md` | Dokumen ini |

### File Dimodifikasi
| File | Perubahan |
|------|-----------|
| `src/lib/storage/index.ts` | Ganti export dari `./supabase` → `./r2` |
| `src/app/api/v1/dokumen/[id]/route.ts` | Ganti Supabase URL parsing → `storageService.delete(doc.drivefileid)` |
| `src/app/api/v1/master/barang/[id]/image/route.ts` | Ganti regex `/public/dokumen/` → `extractPathFromUrl()` helper |
| `src/app/api/v1/system/health/route.ts` | `provider: 'supabase'` → `provider: 'cloudflare-r2'` |
| `.env.example` | Tambah `R2_DOCUMENTS_*` vars, update komentar Supabase Storage |

### File TIDAK Berubah (Zero Change)
| Kategori | Jumlah | Alasan |
|----------|--------|--------|
| API Routes document (POST upload) | 14 file | Semua pakai `storageService` — abstraction layer menyerap perubahan |
| API Routes lain (barang image, company, dll) | 10 file | Sama — pakai `storageService` |
| Drizzle schema | 15 file | `drive_file_id` tetap sama (path objek) |
| `all_documents` view | 1 file | Tetap baca `d.file_url` — hanya nilainya yang beda |
| Frontend components | semua | Tidak ada kode frontend yang akses storage langsung |
| Cloudflare Email Worker | 1 file | Urusan email attachment — bucket terpisah |

---

## ⚠️ Resiko & Mitigasi

| Resiko | Dampak | Mitigasi |
|--------|--------|----------|
| **File existing broken saat switch** | `file_url` di DB masih指向 Supabase | Jalankan migrasi data SEBELUM deploy kode R2. Update URL di DB baru setelah semua file tercopy |
| **R2 public URL belum siap** | Upload sukses tapi URL broken | Setup custom domain `files.erp.pt-rri.com` di **Tahap 1** — verifikasi akses dulu |
| **Timeout upload file besar (Vercel 10 detik)** | Upload gagal untuk file >5MB | Sama seperti sekarang — client-side compress + validasi size. Tidak ada perubahan |
| **S3 CopyObject antar-path** | Error jika source dan destination beda region | R2 S3-compatible, `CopyObject` dalam bucket yang sama selalu OK |
| **Supabase URL pattern di kode lain** | `drive_file_id` extraction rusak | Sudah di-audit: hanya 2 file yang parsing URL (fixed di Tahap 2) |
| **Kehilangan akses file selama migrasi** | File tidak bisa diakses | Kedua storage jalan paralel sampai semua diverifikasi |

---

## 💰 Perbandingan Biaya

| Skenario | Supabase Pro | Cloudflare R2 | Selisih/Tahun |
|----------|-------------|---------------|---------------|
| 1 tahun (800 MB) | $0 (free) | $0 (free) | $0 |
| 2 tahun (1.6 GB) | $25/bulan = $300/tahun | $0 (masih <10 GB) | **$300** |
| 5 tahun (4 GB) | $25/bulan = $300/tahun | $0 (masih <10 GB) | **$300/tahun** |
| 10 tahun (8 GB) | $25/bulan = $300/tahun | $0 | **$300/tahun** |
| >10 tahun (>10 GB) | $25/bulan | ~$0.015/GB/bulan | Tetap lebih murah |

> **Catatan:** Supabase free tier hanya 1 GB. Jika melebihi 1 GB, harus upgrade ke Pro $25/bulan. Cloudflare R2 free tier 10 GB — cukup untuk ~12 tahun ERP RRI.

---

## 🔗 Referensi

- `src/lib/storage/types.ts` — Interface `IStorageService`
- `src/lib/storage/supabase.ts` — Implementasi Supabase (existing, akan diganti)
- `src/lib/email/r2-client.ts` — R2 client untuk email attachments (referensi pola kode)
- `AGENTS.md` — Panduan environment variables & storage paths
- `PRD.md` Section 5 — Storage & File Management (akan di-update)
- `src/lib/db/migrations/0039_add_retur_penjualan_grn_customer_virtual_pdf.sql` — `all_documents` view
