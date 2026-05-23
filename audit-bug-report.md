# Audit Bug Report — ERP RRI

Tanggal: 2026-05-23

---

## Status Pengerjaan

| # | Deskripsi | Severity | Status |
|---|-----------|----------|--------|
| 1 | GET Handler Tanpa Authentication | HIGH | ✅ FIXED |
| 2 | Cron Endpoint Tanpa Authentication | HIGH | ✅ FIXED |
| 3 | Memory Leak — Object URL Tidak Di-revoke | HIGH | ✅ FIXED |
| 4 | Stale Cached Token Setelah Sign-Out | HIGH | ✅ FIXED |
| 5 | Dynamic Tailwind Class Names | MEDIUM | ⏳ Pending |
| 6 | Login Page Console Logs | MEDIUM | ⏳ Pending |
| 7 | FormSkeleton Tidak Digunakan di Page "Tambah" | MEDIUM | ⏳ Pending |
| 8 | RFQ Page Pakai fetch langsung | MEDIUM | ⏳ Pending |
| 9 | Badge Variants CSS Variables Non-Standard | MEDIUM | ⏳ Pending |
| 10 | API Response Format Tidak Konsisten | LOW | ⏳ Pending |
| 11 | Unused Ref OCR Kontrak | LOW | ⏳ Pending |
| 12 | Finance Dashboard Hardcoded Colors | LOW | ⏳ Pending |
| 13 | Error Boundary Tidak Dipakai | LOW | ⏳ Pending |

---

## Ringkasan

| Severity | Jumlah |
|----------|--------|
| HIGH     | 4      |
| MEDIUM   | 5      |
| LOW      | 4      |

---

## HIGH Severity

### 1. GET Handler Tidak Punya Authentication ✅ FIXED

**File:**
- `src/app/api/v1/stok/route.ts:6`
- `src/app/api/v1/master/gudang/route.ts:6`
- `src/app/api/v1/master/kategori-barang/route.ts:22`
- `src/app/api/v1/rfq/[id]/documents/route.ts:6`

**Deskripsi:** GET endpoint menggunakan `supabaseAdmin` (service role key) tapi tidak menjalankan `verifyAuth()`. Data sensitif (stok, gudang, RFQ) bisa diakses tanpa autentikasi.

**Perbaikan:** Tambahkan `verifyAuth(req)` di awal setiap GET handler dengan tipe `NextRequest`.

---

### 2. Cron Endpoint Tidak Ada Authentication ✅ FIXED

**File:** `src/app/api/v1/cron/ar-reminder/route.ts`

**Deskripsi:** Seluruh route tidak punya autentikasi. Endpoint ini kirim pesan WhatsApp — bisa disalahgunakan untuk spam atau memicu query berlebihan ke database.

**Perbaikan:** Tambahkan validasi `CRON_SECRET_TOKEN` dari environment variable jika diset.

---

### 3. Memory Leak — Object URL Tidak Di-revoke ✅ FIXED

**File:** `src/app/dashboard/ai/ocr-kontrak/page.tsx`

**Deskripsi:** Setiap upload file baru, `URL.createObjectURL(file)` dipanggil tapi URL sebelumnya tidak di-revoke. URL orphan menumpuk di memory browser.

**Perbaikan:** Revoke URL lama sebelum create URL baru: `if (previewUrl) { URL.revokeObjectURL(previewUrl); }`

---

### 4. Stale Cached Token Setelah Sign-Out ✅ FIXED

**File:** `src/lib/api/client.ts`

**Deskripsi:** `cachedToken` tidak pernah dibersihkan saat sign-out. Jika user logout dan user lain login di browser yang sama, token user pertama bisa dikembalikan dari cache sebelum subscription update.

**Perbaikan:** Hapus caching token — selalu panggil `supabase.auth.getSession()` langsung.

---

## MEDIUM Severity

### 5. Dynamic Tailwind Class Names Tidak di-Purge

**File:** `src/app/dashboard/ai/search-harga/page.tsx:188`

**Deskripsi:** `text-${getPriceStatus(item.harga)}` menghasilkan class seperti `text-high`, `text-low` yang tidak ada di Tailwind config dan tidak akan di-generate.

**Rencana Perbaikan:** Gunakan conditional class eksplisit:

```typescript
<p className={`text-xl font-bold ${
  getPriceStatus(item.harga) === 'high' ? 'text-destructive' :
  getPriceStatus(item.harga) === 'low' ? 'text-success' : 'text-foreground'
}`}>
```

---

### 6. Login Page Mengandung Debug Console Logs

**File:** `src/app/(auth)/login/page.tsx:38,49,57,58,62,66`

**Deskripsi:** multiple `console.log` yang expose informasi autentikasi di production.

**Rencana Perbaikan:** Hapus semua `console.log` di login page.

---

### 7. FormSkeleton Tidak Digunakan di Page "Tambah"

**File:**
- `src/app/dashboard/invoice/tambah/page.tsx`
- `src/app/dashboard/purchase-order/tambah/page.tsx`
- `src/app/dashboard/quotation/tambah/page.tsx`

**Deskripsi:** Page-page ini fetch dropdown options via `useEffect` tapi tidak tampilkan `FormSkeleton` saat loading. Form render langsung dengan dropdown kosong.

**Rencana Perbaikan:** Ikuti pola yang sudah ada di inventory stok pages:

```typescript
const [loading, setLoading] = useState(true)

useEffect(() => {
  Promise.all([...]).then(...).finally(() => setLoading(false))
}, [])

if (loading) return <FormSkeleton />
```

---

### 8. RFQ Page Pakai `fetch` Langsung вместо `apiFetch`

**File:** `src/app/dashboard/rfq/[id]/page.tsx:90-94`

**Deskripsi:** `handleUpload` pakai `fetch` manual dengan token handling, tidak konsiten dengan pola `apiFetch` helper.

**Rencana Perbaikan:** Buat helper `apiFetchFormData` yang support FormData dengan auth token otomatis, atau gunakan pola direct fetch yang sudah ada secara konsisten.

---

### 9. Badge Variants Pakai CSS Variables Non-Standard

**File:** `src/components/ui/badge.tsx:14-15`

**Deskripsi:** Badge pakai variant `success` dan `warning` yang rely pada CSS variables `--success` dan `--warning`, tapi shadcn/ui tidak define ini secara default.

**Rencana Perbaikan:** Definisikan CSS variables di `globals.css` atau map ke warna standar:

```css
:root {
  --success: hsl(142 76% 36%);
  --warning: hsl(38 92% 50%);
}
```

---

## LOW Severity

### 10. API Response Format Tidak Konsisten

**Deskripsi:** API routes return struktur data berbeda:
- `/ai/search-harga` → `{ data: { history_id, query, results, priceComparison } }`
- `/ai/ocr-kontrak` → `{ data: { ...result, extracted_items } }`

**Rencana Perbaikan:** Standardisasi response format — selalu pakai `{ data: {...}, message?: string }`.

---

### 11. Unused Ref

**File:** `src/app/dashboard/ai/ocr-kontrak/page.tsx:17`

**Deskripsi:** `previewUrlRef` di-assign tapi tidak digunakan — `previewUrl` state dipakai untuk rendering.

**Rencana Perbaikan:** Hapus `previewUrlRef` jika tidak digunakan.

---

### 12. Finance Dashboard Pakai Hardcoded Tailwind Colors

**File:** `src/components/dashboards/finance.tsx:133,143,163`

**Deskripsi:** `border-emerald-200`, `text-emerald-600`, `text-red-600` — tidak menggunakan CSS variables dari theme.

**Rencana Perbaikan:** Ganti dengan CSS variables yang sesuai:
- `border-muted`, `text-muted-foreground` untuk abu-abu
- `text-destructive` untuk merah
- `text-success` untuk hijau

---

### 13. Error Boundary Tidak Dipakai

**Deskripsi:** `ErrorBoundary` component ada di `src/components/error-boundary.tsx` tapi tidak digunakan di dashboard layout atau page manapun.

**Rencana Perbaikan:** Wrap dashboard layout dengan `ErrorBoundary`:

```tsx
// src/app/dashboard/layout.tsx
import { ErrorBoundary } from '@/components/error-boundary'

export default function DashboardLayout({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
```

---

## Prioritas Perbaikan

1. **Segera (sebelum production):** Bug #1, #2, #3, #4
2. **Sebelum production deploy:** Bug #5, #6, #7, #9
3. **Nice to have:** Bug #8, #10, #11, #12, #13