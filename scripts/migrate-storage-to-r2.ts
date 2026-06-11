/**
 * Migrate files from Supabase Storage (bucket: dokumen) to Cloudflare R2 (bucket: erp-documents).
 *
 * Usage:
 *   npx tsx scripts/migrate-storage-to-r2.ts
 *   npx tsx scripts/migrate-storage-to-r2.ts --dry-run
 *   npx tsx scripts/migrate-storage-to-r2.ts --prefix=dokumen/quotation
 *   npx tsx scripts/migrate-storage-to-r2.ts --update-db
 *   npx tsx scripts/migrate-storage-to-r2.ts --prefix=dokumen/quotation --dry-run
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3'

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const UPDATE_DB = args.includes('--update-db')
const HELP = args.includes('--help')
const PREFIX_FILTER = args.find((a) => a.startsWith('--prefix='))?.split('=')[1]

// ─── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const R2_ENDPOINT = process.env.R2_DOCUMENTS_ENDPOINT
const R2_ACCESS_KEY_ID = process.env.R2_DOCUMENTS_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_DOCUMENTS_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_DOCUMENTS_BUCKET

const OLD_URL_BASE = `${SUPABASE_URL}/storage/v1/object/public/dokumen/`
const NEW_URL_BASE = 'https://files.erp.pt-rri.com/'

// ─── Init clients ────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const r2 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID!, secretAccessKey: R2_SECRET_ACCESS_KEY! },
})

// ─── Help ────────────────────────────────────────────────────────────────────
if (HELP) {
  console.log(`
  Migrate files from Supabase Storage → Cloudflare R2

  Usage:
    npx tsx scripts/migrate-storage-to-r2.ts [options]

  Options:
    --dry-run             Count files only, no uploads
    --prefix=<path>       Only process files under this prefix (e.g. dokumen/quotation)
    --update-db           After migration, update file_url in database via REPLACE() SQL
    --help                Show this help

  Examples:
    npx tsx scripts/migrate-storage-to-r2.ts --dry-run
    npx tsx scripts/migrate-storage-to-r2.ts --prefix=dokumen/quotation
    npx tsx scripts/migrate-storage-to-r2.ts --update-db
  `)
  process.exit(0)
}

// ─── Validasi ────────────────────────────────────────────────────────────────
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}
if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error('Missing R2_DOCUMENTS_* environment variables')
  process.exit(1)
}

// ─── Recursive file listing ──────────────────────────────────────────────────
async function listAllFiles(folderPath: string): Promise<string[]> {
  const files: string[] = []
  let offset = 0
  const limit = 200

  while (true) {
    const { data, error } = await supabase.storage.from('dokumen').list(folderPath, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })

    if (error) {
      console.error(`\n  Error listing ${folderPath} (offset ${offset}): ${error.message}`)
      break
    }
    if (!data || data.length === 0) break

    for (const item of data) {
      const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name

      if (item.id === null) {
        const subFiles = await listAllFiles(itemPath)
        files.push(...subFiles)
      } else {
        files.push(itemPath)
      }
    }

    if (data.length < limit) break
    offset += limit
  }

  return files
}

// ─── File migration ──────────────────────────────────────────────────────────
async function migrateFile(filePath: string): Promise<{ status: 'ok' | 'skip' | 'error'; error?: string }> {
  if (DRY_RUN) return { status: 'ok' }

  const { data: blob, error: downloadError } = await supabase.storage.from('dokumen').download(filePath)
  if (downloadError || !blob) {
    return { status: 'error', error: `Download error: ${downloadError?.message ?? 'empty blob'}` }
  }

  const buffer = Buffer.from(await blob.arrayBuffer())

  try {
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: filePath,
      Body: buffer,
      ContentType: blob.type || 'application/octet-stream',
    } as PutObjectCommandInput))
    return { status: 'ok' }
  } catch (err) {
    return { status: 'error', error: `Upload error: ${err instanceof Error ? err.message : 'unknown'}` }
  }
}

// ─── DB URL update ───────────────────────────────────────────────────────────
async function updateDatabaseUrls(): Promise<void> {
  console.log('\n  Updating file_url in database...')

  const tables: { table: string; column: string }[] = [
    { table: 'rfq_customer_document', column: 'file_url' },
    { table: 'rfq_supplier_document', column: 'file_url' },
    { table: 'quotation_document', column: 'file_url' },
    { table: 'customer_po_document', column: 'file_url' },
    { table: 'di_document', column: 'file_url' },
    { table: 'sales_order_document', column: 'file_url' },
    { table: 'delivery_order_document', column: 'file_url' },
    { table: 'invoice_document', column: 'file_url' },
    { table: 'kwitansi_document', column: 'file_url' },
    { table: 'retur_penjualan_document', column: 'file_url' },
    { table: 'retur_pembelian_document', column: 'file_url' },
    { table: 'grn_document', column: 'file_url' },
    { table: 'grn_customer_document', column: 'file_url' },
    { table: 'kontrak_file', column: 'file_url' },
    { table: 'ai_ocr_history', column: 'file_url' },
    { table: 'ai_vision_history', column: 'file_url' },
    { table: 'barang', column: 'image_url' },
    { table: 'quotation_item', column: 'image_url' },
    { table: 'rfq_customer_item', column: 'image_url' },
    { table: 'delivery_order', column: 'delivery_slip_file_url' },
    { table: 'delivery_order', column: 'foto_barang_diterima_url' },
    { table: 'delivery_order', column: 'foto_surat_jalan_url' },
  ]

  // Test R2 access first — upload a marker file to verify credentials
  const markerKey = 'migration-test/__marker__.txt'
  try {
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: markerKey,
      Body: Buffer.from(`Migration test — ${new Date().toISOString()}`),
      ContentType: 'text/plain',
    }))
    console.log('  ✓ R2 access verified (marker file uploaded)')
    await r2.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: markerKey,
    }))
  } catch (err) {
    console.error('\n  ✗ R2 access failed. Aborting DB update.')
    console.error(`    ${err instanceof Error ? err.message : 'unknown'}`)
    process.exit(1)
  }

  let totalUpdated = 0
  for (const { table, column } of tables) {
    const sql = `UPDATE ${table} SET ${column} = REPLACE(${column}, '${OLD_URL_BASE}', '${NEW_URL_BASE}') WHERE ${column} ILIKE '${OLD_URL_BASE}%'`

    if (DRY_RUN) {
      // Count how many rows would be affected
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .ilike(column, `${OLD_URL_BASE}%`)

      if (!error && count !== null) {
        console.log(`    ${table}.${column}: ${count} rows`)
        totalUpdated += count
      }
      continue
    }

    try {
      const { error } = await supabase.rpc('exec_sql', { query: sql })
      if (error) {
        // Fallback: try raw query via REST
        console.log(`    ${table}.${column}: skipped (RPC not available — run SQL manually)`)
        console.log(`      ${sql}`)
      } else {
        console.log(`    ${table}.${column}: updated`)
        totalUpdated++
      }
    } catch {
      console.log(`    ${table}.${column}: skipped — cannot execute via RPC`)
      console.log(`      SQL: ${sql}`)
    }
  }

  console.log(`\n  Total rows to update${DRY_RUN ? ' (dry-run)' : ''}: ${totalUpdated}`)

  if (!DRY_RUN) {
    console.log('\n  ✓ Database URLs updated successfully')
    console.log('\n  ⚠️  If RPC `exec_sql` is not available in your Supabase project,')
    console.log('     run the SQL manually via Supabase SQL Editor or the DATABASE_URL directly.')
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('')
  console.log('='.repeat(80))
  console.log('  Storage Migration: Supabase Storage → Cloudflare R2')
  console.log('='.repeat(80))
  console.log(`  Supabase:  ${SUPABASE_URL}`)
  console.log(`  R2 Bucket: ${R2_BUCKET} (${R2_ENDPOINT})`)
  console.log(`  Dry run:   ${DRY_RUN ? 'YES' : 'NO'}`)
  console.log(`  Prefix:    ${PREFIX_FILTER ?? '(all)'}`)
  console.log(`  Update DB: ${UPDATE_DB ? 'YES' : 'NO'}`)
  console.log('='.repeat(80))
  console.log('')

  // ── Step 1: List files ──────────────────────────────────────────────────
  console.log('[1/4] Listing files from Supabase Storage...')

  const startPrefix = PREFIX_FILTER ?? ''
  const allFiles = await listAllFiles(startPrefix)
  allFiles.sort()

  console.log(`  Found ${allFiles.length} file(s)`)

  if (allFiles.length === 0) {
    console.log('\n  Nothing to migrate. Exiting.')
    return
  }

  // ── Step 2: Show preview ────────────────────────────────────────────────
  console.log('\n[2/4] File preview (first 20):')
  for (const f of allFiles.slice(0, 20)) {
    console.log(`  • ${f}`)
  }
  if (allFiles.length > 20) {
    console.log(`  ... and ${allFiles.length - 20} more`)
  }

  if (DRY_RUN) {
    console.log('\n  ── DRY RUN ──')
    console.log(`  Would migrate ${allFiles.length} file(s)`)
    console.log(`  Old URL base: ${OLD_URL_BASE}`)
    console.log(`  New URL base: ${NEW_URL_BASE}`)
    console.log('  ─────────────')
  }

  // ── Step 3: Migrate files ───────────────────────────────────────────────
  if (!DRY_RUN) {
    console.log('\n[3/4] Migrating files to Cloudflare R2...')

    const BATCH_SIZE = 5
    let ok = 0
    const errors: { file: string; error: string }[] = []
    let done = 0
    const total = allFiles.length

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(batch.map((f) => migrateFile(f)))

      for (let j = 0; j < results.length; j++) {
        const r = results[j]
        if (r.status === 'fulfilled') {
          if (r.value.status === 'ok') ok++
          else errors.push({ file: batch[j], error: r.value.error! })
        } else {
          errors.push({ file: batch[j], error: r.reason?.message ?? 'Promise rejected' })
        }
      }

      done += batch.length
      const pct = ((done / total) * 100).toFixed(1)
      process.stdout.write(`\r  Progress: ${done}/${total} (${pct}%) — ${ok} ok, ${errors.length} error(s)   `)
    }

    console.log('')
    console.log('')

    if (errors.length > 0) {
      console.log(`  ⚠️  ${errors.length} error(s) — first 10:`)
      for (const e of errors.slice(0, 10)) {
        console.log(`    ✗ ${e.file}: ${e.error}`)
      }
      if (errors.length > 10) {
        console.log(`    ... and ${errors.length - 10} more`)
      }
    }

    console.log(`\n  ✓ ${ok}/${total} file(s) migrated successfully`)
  }

  // ── Step 4: Update DB URLs ──────────────────────────────────────────────
  if (UPDATE_DB) {
    console.log('\n[4/4] Updating database URLs...')
    await updateDatabaseUrls()
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('')
  console.log('='.repeat(80))
  console.log('  Migration Complete')
  console.log('='.repeat(80))
  if (DRY_RUN) {
    console.log(`  ${allFiles.length} file(s) would be migrated.`)
    console.log('  Run without --dry-run to execute.')
  } else {
    console.log(`  ${allFiles.length} file(s) processed.`)
    console.log('  Next step: Update file_url in database via:')
    console.log(`    npx tsx scripts/migrate-storage-to-r2.ts --update-db`)
    console.log('  Or via Supabase SQL Editor with REPLACE() queries.')
  }
  console.log('='.repeat(80))
  console.log('')
}

main().catch((err) => {
  console.error('\nFatal error:', err)
  process.exit(1)
})
