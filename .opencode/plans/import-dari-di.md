# ROADMAP: Import dari DI (Delivery Instruction)

## Goal
Fitur untuk mengimpor data dari PDF Delivery Instruction (DI) Customer ke sistem ERP RRI — khusus untuk customer BJS (PT. Bhumi Jepara Service). Mencatat history DI yang terjadi di luar sistem dengan cara mengimpor data barang, kontrak matching, PIC, dan DI itu sendiri.

---

## Document Numbering

### Format
```
RRI-DI-EXT-{YY}-{MM}-{NNNN}
```

| Segmen | Makna | Sumber |
|--------|-------|--------|
| `DI` | Delivery Instruction (kode dokumen) | Fixed |
| `EXT` | External (sumber dari luar sistem) | Fixed |
| `YY` | Tahun pembuatan DI (2 digit) | Dari `tanggal_di` pada JSON |
| `MM` | Bulan pembuatan DI (2 digit) | Dari `tanggal_di` pada JSON |
| `NNNN` | Counter 4 digit | Tabel `document_counter` via `increment_document_counter` |

### Implementasi
- Panggil `generateDocumentNumber('DI-EXT', tahun, bulan)` — fungsi sudah support parameter opsional `tahun`/`bulan`
- Counter terpisah dari `DI` reguler (karena kode_dokumen berbeda: `DI-EXT`)

---

## Standardized JSON Output DI (WAJIB — semua prompt harus produce format ini)

```json
{
  "nomor_di": "C-BJS-25-0004-HRGA-12",
  "tanggal_di": "2025-10-21",
  "revisi_ke": 0,
  "department": "Procurement & Coordination",
  "nama_pic": "MUHAMMAD FAUZI",
  "jabatan_pic": "PIC Procurement",
  "nomor_kontrak": "C-BJS-25-0004-HRGA",
  "requestor": "HRGA",
  "time_for_delivery_hari": 14,
  "durasi_payment_hari": 30,
  "catatan": "",
  "nama_penandatangan": "CHANDRA ADITYA",
  "jabatan_penandatangan": "HRGA Manager",
  "items": [
    {
      "kode": "PTR006",
      "nama_barang": "Jahe Wangi (10pcs/rtg)",
      "satuan": "PACK",
      "qty": 5,
      "harga_satuan": 14000
    }
  ]
}
```

### Field Wajib (validasi ketat)
| Field | Type | Keterangan |
|-------|------|------------|
| `nomor_di` | string | Nomor DI dari customer |
| `tanggal_di` | string (YYYY-MM-DD) | Tanggal DI |
| `nomor_kontrak` | string | Nomor kontrak referensi |
| `items` | array (min 1) | Array item barang |
| `items[].kode` | string | Kode barang dari DI |
| `items[].nama_barang` | string | Nama/deskripsi barang |
| `items[].satuan` | string | Satuan barang |
| `items[].qty` | number | Quantity |
| `items[].harga_satuan` | number | Harga satuan |

### Field Opsional (fallback: `"-"` untuk string, `0` untuk number, `""` untuk catatan)
| Field | Type | Fallback |
|-------|------|----------|
| `department` | string | `"-"` |
| `nama_pic` | string | `"-"` |
| `jabatan_pic` | string | `"-"` |
| `requestor` | string | `"-"` |
| `revisi_ke` | number | `0` |
| `time_for_delivery_hari` | number | `0` |
| `durasi_payment_hari` | number | `0` |
| `catatan` | string | `""` |
| `nama_penandatangan` | string | `"-"` |
| `jabatan_penandatangan` | string | `"-"` |

---

## Database: Tabel Baru `customer_prompt_di`

```sql
CREATE TABLE customer_prompt_di (
  customer_id UUID PRIMARY KEY REFERENCES customer(id) ON DELETE CASCADE,
  prompt_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

- Diisi **manual via Supabase Table Editor** oleh admin
- Jika customer belum punya prompt → blokir import (tampilkan error)
- Join dengan customer untuk dropdown — hanya tampilkan customer yang sudah `is_active = true`

## Database: New Columns on `di` Table

```sql
ALTER TABLE di ADD COLUMN IF NOT EXISTS nama_penandatangan TEXT;
ALTER TABLE di ADD COLUMN IF NOT EXISTS jabatan_penandatangan TEXT;
ALTER TABLE di ADD COLUMN IF NOT EXISTS revisi_ke INTEGER DEFAULT 0;
ALTER TABLE di ADD COLUMN IF NOT EXISTS nomor_kontrak_customer TEXT;
```

---

## Flow End-to-End

```
[Tab Import dari DI]
  │
  ├─ 1. Pilih Customer dari Dropdown
  │    → GET customer yang punya prompt_di aktif
  │    → Hanya tampilkan customer dengan prompt_di tersedia
  │    → Jika belum ada prompt: blokir, suruh admin isi via Supabase
  │
  ├─ 2. Prompt Gemini Muncul (custom per customer)
  │    → GET /api/v1/master/customer/{id}/prompt-di
  │    → Tampilkan prompt di textarea read-only
  │    → Tombol "Salin Prompt"
  │    → User upload PDF DI ke Gemini, paste prompt, dapat JSON
  │
  ├─ 3. Upload File PDF DI (WAJIB)
  │    → Compact upload UI
  │    → Simpan ke Supabase Storage: dokumen/di/{id}/{file}
  │    → Jika belum upload: tombol Import disabled + toast error
  │
  ├─ 4. Paste JSON & Preview
  │    → Parse & validasi JSON (validasi ketat field wajib)
  │    → Tampilkan tabel pratinjau items
  │    → Tampilkan ringkasan header (nomor DI, tanggal, kontrak, PIC, penandatangan)
  │
  ├─ 5. Import
  │    │
  │    ├─ Auto-match Customer by ID (from dropdown)
  │    │   → Customer sudah terpilih dari dropdown, pakai ID langsung
  │    │
  │    ├─ Auto-match Kontrak by nomor + customer_id + date range
  │    │   → Cari kontrak WHERE nomor_kontrak = JSON.nomor_kontrak
  │    │     AND customer_id = selectedCustomerId
  │    │     AND tanggal_mulai <= JSON.tanggal_di <= tanggal_berakhir
  │    │   → Jika tidak ditemukan: error (import gagal)
  │    │
  │    ├─ Auto-create/update PIC (optional, if nama_pic != "-")
  │    │   → Cari PIC by nama + customer_id
  │    │   → Jika tidak ditemukan: auto-create
  │    │
  │    ├─ Extract kode barang dari description items
  │    │   → Items sudah punya field "kode" terpisah dari JSON
  │    │   → Tidak perlu regex extraction (Gemini sudah extract)
  │    │
  │    ├─ Process items — auto-create barang
  │    │   For each item:
  │    │   1. Cari di kontrak_item WHERE kontrak_id = matchedKontrak.id AND kode = item.kode
  │    │   2. Jika ditemukan:
  │    │      a. Nama SAMA (case-insensitive) → reuse barang_id (skipped)
  │    │      b. Nama BEDA → create barang baru (linked ke existing kontrak_item?)
  │    │   3. Jika tidak ditemukan di kontrak_item:
  │    │      → Cari di master barang by kode
  │    │      → Jika ditemukan: link barang_id
  │    │      → Jika tidak: create barang baru dengan kode BRG-RRI-NNNNN
  │    │
  │    ├─ Buat DI record
  │    │   → Nomor RRI: generateDocumentNumber('DI-EXT', tahun, bulan)
  │    │   → Status: confirmed
  │    │   → Field dari JSON + matched kontrak_id + PIC
  │    │
  │    ├─ Buat DI Item records
  │    │   → di_id, barang_id, jumlah, harga_satuan, keterangan, nama_barang, kode_barang, satuan
  │    │
  │    └─ Upload PDF ke storage & create di_document record
  │        → Simpan ke dokumen/di/{diId}/{pdfFile.name}
  │        → Insert ke di_document
  │
  └─ 6. Redirect ke halaman master barang
```

---

## Prompt Template: BJS DI (PT. Bhumi Jepara Service)

```text
Extract Delivery Instruction data from this PT. Bhumi Jepara Service DI PDF as a JSON object.

Return a valid JSON object (NOT array) with this exact structure:
{
  "nomor_di": "string (DI Number, e.g. C-BJS-25-0004-HRGA-12)",
  "tanggal_di": "YYYY-MM-DD (DI Date, e.g. 2025-10-21)",
  "revisi_ke": 0,
  "department": "string (e.g. Procurement & Coordination)",
  "nama_pic": "string (PIC name, e.g. MUHAMMAD FAUZI)",
  "jabatan_pic": "string (PIC position)",
  "nomor_kontrak": "string (Reference Contract Number, e.g. C-BJS-25-0004-HRGA)",
  "requestor": "string (e.g. HRGA)",
  "time_for_delivery_hari": 0 (convert "14 days" to 14, "2 weeks" to 14, "30 days" to 30, etc.),
  "durasi_payment_hari": 0 (extract from PAYMENT terms, e.g. "TTR 30 calendar days" = 30),
  "catatan": "string (Note section content, or empty string)",
  "nama_penandatangan": "string (signatory name from Authorized by section, e.g. CHANDRA ADITYA)",
  "jabatan_penandatangan": "string (signatory position, e.g. HRGA Manager)",
  "items": [
    {
      "kode": "string (item code extracted from Description column — characters before the first '-' or before the first space, whichever fits the data format. Examples: 'PTR006_Jahe Wangi' → 'PTR006', 'SNT042 Bebek Toilet Cleaner' → 'SNT042')",
      "nama_barang": "string (full Description including the code prefix, e.g. PTR006_Jahe Wangi (10pcs/rtg))",
      "satuan": "string (Unit column, e.g. PACK)",
      "qty": 0,
      "harga_satuan": 0
    }
  ]
}

Extraction rules:
- Item code extraction: Use one of these methods based on the description format:
  1. Characters before the first '-' character (e.g. 'PTR006-Jahe Wangi' → 'PTR006')
  2. Characters before the first space character (e.g. 'SNT042 Bebek Toilet Cleaner' → 'SNT042')
  Choose whichever method produces the correct code for each item.
- TIME FOR DELIVERY: parse from terms table, convert weeks to days
- PAYMENT: parse "TTR X calendar days" → extract number
- PIC name from header section
- Authorized signatory from signature section (Authorized by)
- If a field is not found, use "-" (text) or 0 (number) or "" (catatan)

Return ONLY valid JSON with no markdown formatting, no explanation.
```

---

## Files yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/lib/db/schema/di.ts` | Tambah field: `namaPenandatangan`, `jabatanPenandatangan`, `revisiKe`, `nomorKontrakCustomer` |
| `src/lib/db/schema/index.ts` | Export `customerPromptDi` |
| `src/app/dashboard/master/barang/tambah/page.tsx` | Tambah tab "Import dari DI" (posisi ke-4 setelah Import PO) |

## Files yang Dibuat

| File | Tujuan |
|------|--------|
| `src/lib/db/migrations/0045_customer_prompt_di.sql` | Migration: CREATE TABLE `customer_prompt_di` + ALTER TABLE `di` add columns |
| `src/lib/db/schema/customer-prompt-di.ts` | Drizzle schema untuk `customer_prompt_di` |
| `src/app/api/v1/master/customer/[id]/prompt-di/route.ts` | GET prompt DI by customer ID |
| `src/app/api/v1/master/barang/import-from-di/route.ts` | POST import (validasi JSON, auto-match kontrak, auto-create barang, create DI + items + upload PDF) |

---

## Implementation Detail

### 1. Migration SQL (`0045_customer_prompt_di.sql`)
```sql
-- Create customer_prompt_di table
CREATE TABLE IF NOT EXISTS customer_prompt_di (
  customer_id UUID PRIMARY KEY REFERENCES customer(id) ON DELETE CASCADE,
  prompt_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE customer_prompt_di ENABLE ROW LEVEL SECURITY;
GRANT ALL ON customer_prompt_di TO authenticated, service_role;

-- Add columns to di table
ALTER TABLE di ADD COLUMN IF NOT EXISTS nama_penandatangan TEXT;
ALTER TABLE di ADD COLUMN IF NOT EXISTS jabatan_penandatangan TEXT;
ALTER TABLE di ADD COLUMN IF NOT EXISTS revisi_ke INTEGER DEFAULT 0;
ALTER TABLE di ADD COLUMN IF NOT EXISTS nomor_kontrak_customer TEXT;
```

### 2. Drizzle Schema (`customer-prompt-di.ts`)
```typescript
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { customer } from "./customer";

export const customerPromptDi = pgTable("customer_prompt_di", {
  customerId: text("customer_id").primaryKey().references(() => customer.id, { onDelete: "cascade" }),
  promptTemplate: text("prompt_template").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### 3. Update Drizzle Schema `di.ts`
Add these imports and fields to existing schema:
```typescript
namaPenandatangan: text("nama_penandatangan"),
jabatanPenandatangan: text("jabatan_penandatangan"),
revisiKe: integer("revisi_ke").default(0),
nomorKontrakCustomer: text("nomor_kontrak_customer"),
```

### 4. API — GET prompt DI by customer
- `GET /api/v1/master/customer/{id}/prompt-di`
- Query `customer_prompt_di` WHERE `customer_id = {id}` AND `is_active = true`
- Return `{ data: { customer_id, prompt_template, customer: { nama } } }`

### 5. API — POST import
- Request body: FormData
  - `customerId`: string (UUID from dropdown)
  - `jsonData`: string (JSON.stringify of standardized DI JSON)
  - `pdfFile`: File (PDF upload)
- Flow:
  1. Verify auth
  2. Parse & validate JSON with Zod
  3. Get customer by ID (from dropdown)
  4. Auto-match kontrak by nomor_kontrak + customer_id + date range (tanggal_mulai <= tanggal_di <= tanggal_berakhir)
  5. Auto-match / create PIC by nama_pic + customer_id
  6. Generate nomor DI: `generateDocumentNumber('DI-EXT', tahun, bulan)`
  7. Loop items:
     - Find kontrak_item by kontrak_id + kode
     - If matched kontrak_item with same nama → reuse barang
     - If matched kontrak_item but different nama → create new barang
     - If not in kontrak_item → search master barang by kode
     - If found by kode → link
     - If not found → create new barang with `generateAutoKode()`
  8. Insert DI (confirmed) + DI items
  9. Upload PDF to storage: `dokumen/di/{diId}/{file}`
  10. Insert di_document record
  11. Return hasil import

### 6. Frontend — Tab "Import dari DI"
- Tab baru `import-di` setelah tab `import-po`
- Dropdown customer (filter: hanya yang punya prompt_di aktif) — fetch dari `/api/v1/master/customer` + cek `/api/v1/master/customer/{id}/prompt-di`
- Saat pilih customer → fetch prompt → tampilkan
- Tombol "Salin Prompt"
- Upload PDF DI (WAJIB — tombol Import disabled jika belum upload)
- Textarea paste JSON
- Tombol "Preview Data" — validasi JSON + field wajib
- Tabel pratinjau (header info + items)
- Tombol "Import" — kirim ke API via FormData

### 7. Seed Data Prompt DI BJS
```sql
INSERT INTO customer_prompt_di (customer_id, prompt_template, is_active)
VALUES (
  (SELECT id FROM customer WHERE nama ILIKE '%bhumi%jepara%service%' LIMIT 1),
  'Extract Delivery Instruction data...',  -- full prompt template
  TRUE
);
```

---

## UI/UX Notes

- Tab aktif: `bg-primary text-primary-foreground`
- Dropdown: hanya customer yang sudah punya prompt_di
- Upload file: compact, drag-drop or click, PDF only
- Upload WAJIB — jika belum upload, tombol Import disabled, muncul toast "Upload file PDF DI terlebih dahulu"
- Loading state: spinner di tombol import
- Error handling: toast per-item error + summary
- Jika customer tanpa prompt: tampilkan pesan "Prompt DI untuk customer ini belum tersedia. Hubungi admin untuk menambahkan prompt DI di Supabase."

---

## Referensi

- Pattern "Import dari PO": `src/app/api/v1/master/barang/import-from-po/route.ts`
- Pattern "Import dari DI Tab": existing Import PO tab di `src/app/dashboard/master/barang/tambah/page.tsx`
- DI schema: `src/lib/db/schema/di.ts`
- DI document schema: `src/lib/db/schema/di-document.ts`
- Barang auto-create: `src/lib/utils/barang-auto-create.ts`
- Document number: `src/lib/utils/document-number.ts`
- Storage path: `dokumen/di/{diId}/{file}`
- Format DI BJS: `docs-format-examples/format-di-BJS.html`
