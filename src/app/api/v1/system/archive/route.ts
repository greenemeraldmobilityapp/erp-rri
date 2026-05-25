import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { forbidden } from '@/lib/api/errors'

const ARCHIVE_TABLES = [
  'invoice', 'kwitansi', 'faktur_pajak', 'jurnal',
  'purchase_order', 'purchase_request', 'purchase_receiving',
  'quotation', 'delivery_order', 'sales_order', 'customer_po',
  'retur_penjualan', 'retur_pembelian',
] as const

/**
 * @openapi
 * /api/v1/system/archive:
 *   get:
 *     tags: [System]
 *     summary: Get archive status
 *     description: Menampilkan statistik data yang bisa diarsipkan
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Archive status
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [System]
 *     summary: Run archiving
 *     description: Mengarsipkan data transaksi >12 bulan (hanya owner/admin)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Archiving completed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  const stats: Record<string, { total: number; archivable: number }> = {}

  for (const table of ARCHIVE_TABLES) {
    const { count: total } = await supabaseAdmin
      .from(table).select('id', { count: 'exact', head: true })

    const { count: old } = await supabaseAdmin
      .from(table).select('id', { count: 'exact', head: true })
      .lt('created_at', twelveMonthsAgo.toISOString())

    stats[table] = { total: total ?? 0, archivable: old ?? 0 }
  }

  const { count: archivedCount } = await supabaseAdmin
    .from('data_archive').select('id', { count: 'exact', head: true })

  return NextResponse.json({
    tables: stats,
    totalArchivable: Object.values(stats).reduce((a, b) => a + b.archivable, 0),
    totalArchived: archivedCount ?? 0,
    cutoffDate: twelveMonthsAgo.toISOString(),
  })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  if (auth.user?.role !== 'owner' && auth.user?.role !== 'admin') {
    return forbidden('Hanya owner dan admin yang dapat menjalankan archiving')
  }

  const body = await request.json().catch(() => ({}))
  const months = body.months ?? 12
  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - months)

  let totalArchived = 0
  const errors: string[] = []

  for (const table of ARCHIVE_TABLES) {
    const { data: oldRecords, error: fetchError } = await supabaseAdmin
      .from(table).select('*')
      .lt('created_at', cutoffDate.toISOString())
      .limit(100)

    if (fetchError) { errors.push(`${table}: ${fetchError.message}`); continue }
    if (!oldRecords?.length) continue

    const archiveRows = oldRecords.map((r: Record<string, unknown>) => ({
      source_table: table,
      source_id: r.id as string,
      data: r,
      archived_by: auth.user?.id ?? null,
    }))

    const { error: insertError } = await supabaseAdmin.from('data_archive').insert(archiveRows)
    if (insertError) { errors.push(`${table}: ${insertError.message}`); continue }

    const ids = oldRecords.map(r => r.id)
    const { error: deleteError } = await supabaseAdmin.from(table).delete().in('id', ids)
    if (deleteError) errors.push(`${table} (delete): ${deleteError.message}`)

    totalArchived += oldRecords.length
  }

  return NextResponse.json({
    archived: totalArchived,
    errors: errors.length ? errors : undefined,
    message: `${totalArchived} record berhasil diarsipkan`,
    cutoffDate: cutoffDate.toISOString(),
  })
}
