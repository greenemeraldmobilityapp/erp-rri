# Agent Guidelines for ERP-RRI Repository

## Essential Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- **IMPORTANT**: Never run `lint` and `build` in parallel — run sequentially (lint first, then build) to avoid VPS RAM/CPU crash
- Database migrations: Use Drizzle Kit directly (e.g., `npx drizzle-kit generate`)
- Generate OpenAPI docs: `npx next-openapi-gen generate`

## Technology Stack
- **Framework**: Next.js 15.5.18 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand + TanStack React Query
- **Forms**: React Hook Form + Zod
- **Database**: Drizzle ORM with Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **PDF Generation**: @react-pdf/renderer

## Project Structure
- `/app` - Next.js App Router pages
- `/components` - React components
- `/lib` - Shared library code (database, utils, etc.)
  - `/db` - Database configuration and schemas
  - `/utils` - Utility functions
- `/types` - TypeScript definitions
- `/public` - Static assets

## Key Configuration Files
- `next.config.ts` - Next.js configuration (minimal)
- `postcss.config.mjs` - Tailwind CSS configuration
- `eslint.config.mjs` - ESLint configuration with Next.js presets
- `package.json` - Dependencies and scripts
- `drizzle.config.ts` - Drizzle ORM configuration

## Database Workflow
1. Database schema located in `/src/lib/db/schema/`
2. Migrations managed via Drizzle ORM (use `drizzle-kit` CLI directly)
3. Database client in `/src/lib/db/client.ts`
4. Required environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (optional, for direct database access)

## System Dependencies
- **poppler-utils** (required for AI OCR Kontrak PDF-to-JPEG conversion): `sudo apt-get install -y poppler-utils`
  - Provides `pdftoppm` binary used by VisionAgent to convert PDF pages to JPEG images before sending to NVIDIA NIM Phi-4 multimodal model

## Development Notes
- Standard Next.js file-based routing applies
- Tailwind CSS utility-first approach
- Components should follow shadcn/ui patterns where applicable
- API routes should follow `/api/v1/` versioning pattern
- No special testing framework configured yet (manual/testing approach varies)

### PDF Route Handlers — Critical Rules
- **Content-Length WAJIB**: Setiap PDF route handler yang mengembalikan PDF blob via `NextResponse(blob)` HARUS menyertakan `'Content-Length': String(blob.size)` di headers. Tanpa ini, Chrome PDF viewer akan loading terus (Firefox tidak masalah).
- **Lokasi**: Semua PDF route ada di `src/app/api/v1/{modul}/[id]/pdf/route.ts` — total 13 routes sudah diberi Content-Length.
- Format response:
  ```typescript
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(blob.size),
      'Content-Disposition': `inline; filename="..."`,
    },
  })
  ```

## Important Conventions from PRD
### Document Numbering
- Format: `RRI-{KODE}-{YY}-{MM}-{0000}`
- Examples: `RRI-SPH-26-05-0001`, `RRI-SJ-26-05-0001`
- Reset automatically at year boundary
- Implemented via `document_counter` table + `increment_document_counter()` PG function
- Usage: `import { generateDocumentNumber } from '@/lib/utils/document-number'`
- Calls `supabase.rpc('increment_document_counter', { p_kode_dokumen, p_tahun, p_bulan })`
- Atomically upserts & increments counter; returns formatted number string

### `all_documents` View
- **Virtual document entries** (`all_documents` view in PostgreSQL): PDFs generated on-the-fly via API routes, not stored in bucket.
- Entries use ID prefix `pdf-{modul}-{id}` (e.g., `pdf-quotation-uuid`, `pdf-do-uuid`) to avoid ID collision with real uploaded documents.
- All virtual entries have `fileurl` pointing to the relative API endpoint (e.g., `/api/v1/quotation/{id}/pdf`).
- Customer resolution for virtual entries follows the same joins as real uploaded documents.
- To add a new virtual document type: add a `UNION ALL` to the `all_documents` view migration.

### PDF Download from Document Management Page
- **Blob fetch pattern for virtual PDFs**: The Document Management page (`dokumen/page.tsx`) uses `openFile(url, filename)` which detects API routes (starts with `/api/`) and uses blob fetch with auth token: `window.open('')` (anti-popup) → `getAuthToken()` → `fetch(url, {Authorization})` → blob → `URL.createObjectURL()` → `win.location.href = blobUrl`. For public storage URLs, uses `window.open(url)` directly.
- **Download button**: Each row has a separate Download icon button that uses the same blob fetch pattern and triggers download via `<a download>` click.
- Office documents (.doc, .docx, .xls, .xlsx, .ppt, .pptx) are opened via Google Docs Viewer: `window.open('https://docs.google.com/viewer?url=...&embedded=true', ...)`

### Storage Structure
- Bucket: `dokumen` (Supabase Storage)
- Standard path pattern: `dokumen/{modul}/{recordId}/{file.name}` (no timestamp prefix, no sub-folders)

```
dokumen/rfq-customer/{id}/{file}
dokumen/rfq-supplier/{id}/{file}
dokumen/quotation/{id}/{file}
dokumen/customer-po/{id}/{file}
dokumen/kontrak/{id}/{file}
dokumen/di/{id}/{file}
dokumen/delivery-order/{id}/{file}               # DO documents
dokumen/delivery-order/{id}/barang_diterima-{ts}-{file}  # Foto barang diterima (verifikasi kirim)
dokumen/delivery-order/{id}/surat_jalan-{ts}-{file}      # Foto surat jalan ditandatangani (verifikasi kirim)
dokumen/invoice/{id}/{file}
dokumen/grn/{id}/{file}
dokumen/retur-penjualan/{id}/{file}
dokumen/retur-pembelian/{id}/{file}
dokumen/ocr-kontrak/{ts}-{file}"         # temp — uses timestamp
dokumen/temp/rfq-customer/{type}/{ts}-{file}"  # temp — uses timestamp
```

- `avatars/` → User profile images
- `barang/` → Product images
- `temporary/` → Auto-deleted after 24 hours

### Image Processing Pipeline
1. Client-side validation (type & size)
2. Compress with `browser-image-compression`
3. Convert to WebP
4. Delete existing file if present
5. Upload to Supabase Storage
6. Store public URL in database

### API Structure
All API endpoints under `/api/v1/`:
- `/api/v1/master/barang`
- `/api/v1/master/supplier`
- `/api/v1/master/customer`
- `/api/v1/master/pic-customer`
- `/api/v1/master/coa`
- `/api/v1/master/kontrak`
- `/api/v1/master/kategori-barang`
- `/api/v1/master/jabatan`
- `/api/v1/master/karyawan`
- `/api-docs` → Scalar UI (interactive API documentation)
- `/openapi.json` → Raw OpenAPI spec

### API Architecture
- **API Layer**: Next.js Route Handlers at `src/app/api/v1/*`
- **Auth**: Each API route calls `verifyAuth()` to verify Bearer JWT token
- **DB**: Uses `supabaseAdmin` (service role key) for all DB operations
- **Validation**: Zod schemas for request body validation
- **Client**: Frontend uses `apiFetch()` from `@/lib/api/client` which auto-attaches auth token
- **Docs**: OpenAPI spec auto-generated via `next-openapi-gen` CLI; served via Scalar UI at `/api-docs`
- **Hybrid Pattern**: Server components (list pages) use direct Supabase for speed; client components (forms) use API routes for safety

## Workflow
After completing any changes or implementing a feature, always update:
1. **PRD.md** — Update relevant sections (tech stack, architecture, modul, API, etc.) to reflect current state
2. **ROADMAP.md** — Mark completed items as `[x]`, add new items if scope changed

This ensures documentation stays synchronized with the actual codebase.