# Roadmap — Loading Skeleton Implementation

## Overview

Target: Add loading skeleton for all dashboard pages to improve UX during data fetching.

**Design Principle:** Centralized component in `/src/components/ui/skeleton.tsx` — update 1 file, affects all pages.

## Current State

### Implemented (13 pages)
| Page | Skeleton Type | File |
|------|--------------|------|
| AI Search Harga | Result items skeleton | `src/app/dashboard/ai/search-harga/page.tsx` |
| AI OCR Kontrak | Upload history skeleton | `src/app/dashboard/ai/ocr-kontrak/page.tsx` |
| Master Barang | `TableSkeleton` | `src/app/dashboard/master/barang/page.tsx` |
| Master Supplier | `TableSkeleton` | `src/app/dashboard/master/supplier/page.tsx` |
| Master Customer | `TableSkeleton` | `src/app/dashboard/master/customer/page.tsx` |
| Master PIC Customer | `TableSkeleton` | `src/app/dashboard/master/pic-customer/page.tsx` |
| Master COA | `TableSkeleton` | `src/app/dashboard/master/coa/page.tsx` |
| Master Kontrak | `TableSkeleton` | `src/app/dashboard/master/kontrak/page.tsx` |
| Master Kategori Barang | `TableSkeleton` | `src/app/dashboard/master/kategori-barang/page.tsx` |
| Master Jabatan | `TableSkeleton` | `src/app/dashboard/master/jabatan/page.tsx` |
| Master Karyawan | `TableSkeleton` | `src/app/dashboard/master/karyawan/page.tsx` |
| HR Absensi | `CalendarSkeleton` | `src/app/dashboard/absensi/page.tsx` |
| Inventory Stok | `TableSkeleton` | `src/app/dashboard/inventory/stok/page.tsx` |

### Server Components (no client-side loading needed)
Pages that are Server Components with `async/await` — these block on server until data ready, so no client loading state needed:
- invoice, sales-order, purchase-order, quotation, rfq, dll.

## Skeleton Components Available

Located in `/src/components/ui/skeleton.tsx`:

```tsx
// Base skeleton
export function Skeleton({ className, ...props })

// Universal table skeleton - works for any table
export function TableSkeleton({ 
  rows = 5,        // number of rows to show
  cols = 5,        // number of data columns
  headerHidden,    // hide header row
  actionsCols = 0,  // number of action buttons (edit/delete/view)
  colWidths = []    // specific widths per column (Tailwind classes)
})

// Calendar skeleton - for absensi-style views
export function CalendarSkeleton()

// Card skeleton - for dashboard KPI cards
export function CardSkeleton()

// Form skeleton - for form loading states
export function FormSkeleton()
```

## Pages to Implement

### Category: Client Component List Pages (need skeleton)

#### Master Data (9 pages)
| Priority | Page | Type | Columns | Actions |
|----------|------|------|---------|---------|
| P1 | `master/customer` | client | 6 | 3 | ✅ Done |
| P1 | `master/pic-customer` | client | 5 | 3 | ✅ Done |
| P1 | `master/coa` | client | 5 | 3 | ✅ Done |
| P1 | `master/kontrak` | client | 6 | 3 | ✅ Done |
| P1 | `master/kategori-barang` | client | 4 | 3 | ✅ Done |
| P1 | `master/jabatan` | client | 3 | 3 | ✅ Done |
| P1 | `master/karyawan` | client | 5 | 3 | ✅ Done |
| P2 | `master/barang` | client | 8 | 3 | ✅ Done |
| P2 | `master/supplier` | client | 7 | 3 | ✅ Done |

#### Transaction List Pages (all confirmed Server Components)
| Priority | Page | Component Type |
|----------|------|----------------|
| P1 | `absensi` | Client | ✅ Done |
| P2 | `penggajian` | Server |
| P2 | `invoice` | Server |
| P2 | `sales-order` | Server |
| P2 | `purchase-order` | Server |
| P2 | `customer-po` | Server |
| P2 | `delivery-order` | Server |
| P2 | `quotation` | Server |
| P2 | `rfq` | Server |
| P2 | `purchase-request` | Server |
| P2 | `purchase-receiving` | Server |
| P2 | `grn` | Server |
| P2 | `retur-pembelian` | Server |
| P2 | `retur-penjualan` | Server |
| P2 | `di` | Server |
| P2 | `negoiasi` | Server |
| P2 | `jurnal` | Server |
| P2 | `kwitansi` | Server |
| P2 | `faktur-pajak` | Server |

#### Inventory Pages
| Priority | Page | Component Type |
|----------|------|----------------|
| P2 | `inventory/gudang` | Server |
| P2 | `inventory/stok` | Client | ✅ Done |
| P3 | `inventory/stok/masuk` | Client (form, uses submitting state) |
| P3 | `inventory/stok/keluar` | Client (form, uses submitting state) |
| P3 | `inventory/stok/kartu/[id]` | Server? |

#### Laporan Pages
| Priority | Page | Component Type |
|----------|------|----------------|
| P2 | `laporan/ar-aging` | Server |
| P2 | `laporan/ap-aging` | Server |
| P2 | `laporan/laba-rugi` | Server |
| P2 | `laporan/neraca` | Server |
| P2 | `laporan/arus-kas` | Server |

#### Other Pages
| Priority | Page | Component Type |
|----------|------|----------------|
| P3 | `notifikasi` | Server? |
| P3 | `audit-log` | Server? |

### How to Check Component Type

```bash
# Server components have "import" at top level, no "use client"
head -3 src/app/dashboard/[page]/page.tsx

# Client components start with "use client"
grep -l "^\\"use client\\"" src/app/dashboard/*/page.tsx
```

## Implementation Pattern

For Client Components with loading state:

```tsx
// In the loading check:
if (loading) {
  return (
    <div className="...">
      <BreadcrumbNav items={breadcrumbItems} />
      <PageHeader title="..." />
      <TableSkeleton 
        rows={5} 
        cols={8}  // match actual table columns
        actionsCols={3}  // edit, delete, view buttons
        headerHidden  // optional: hide header row
      />
    </div>
  )
}
```

For pages that are Server Components: No change needed — they render on server and show content directly.

## Priority Work Order

### Phase 1: Master Data (P1) — ✅ COMPLETE (9/9 pages)
1. `master/customer` ✅
2. `master/pic-customer` ✅
3. `master/coa` ✅
4. `master/kontrak` ✅
5. `master/kategori-barang` ✅
6. `master/jabatan` ✅
7. `master/karyawan` ✅
8. `master/barang` ✅ (done earlier)
9. `master/supplier` ✅ (done earlier)

### Phase 2: Key Transactions (P2) — ✅ COMPLETE (2/2 client list pages)
**Finding:** Most transaction list pages are Server Components (async/await) — they block on server, no skeleton needed.
Only client component list pages needed skeleton:
1. `absensi` ✅ (CalendarSkeleton - done earlier)
2. `inventory/stok` ✅ (TableSkeleton - done now)
All 19 other transaction list pages are Server Components → no skeleton needed.

### Phase 3: Other Pages (P3) — ✅ COMPLETE
Phase 3 pages are form pages (stok masuk/keluar) with `submitting` state — no page-level data fetch loading needed since the main data is already pre-loaded via server components.

**Form pages** — use `submitting` state pattern for form submission:
- `inventory/stok/masuk` — FormSkeleton while initial data loads + shadcn Select ✅ Done
- `inventory/stok/keluar` — FormSkeleton while initial data loads + shadcn Select ✅ Done

**Server Components** (no skeleton needed):
- `inventory/stok/kartu/[id]` — Server ✅
- `notifikasi` — Server ✅
- `audit-log` — Server ✅

## Notes

- **Server Components don't need loading skeletons** — they block on server
- **Only client components** with `useState` + `useEffect` patterns need skeletons
- **Centralized design** — all skeleton styles controlled via `/src/components/ui/skeleton.tsx`
- **Maintenance** — to change skeleton style (color, animation, spacing), edit only `skeleton.tsx`