/**
 * @openapi
 * /api/v1/laporan/neraca/pdf:
 *   get:
 *     tags: [Laporan]
 *     summary: Cetak PDF laporan neraca
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: PDF laporan neraca
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { internalError } from '@/lib/api/errors'
import { LaporanNeracaPDF } from '@/lib/pdf/laporan-neraca'

function makeDateRange(tahun: string | null) {
  const y = tahun ? parseInt(tahun) : new Date().getFullYear()
  return { since: new Date(y, 0, 1).toISOString(), until: new Date(y, 11, 31, 23, 59, 59).toISOString() }
}

type CoaRow = { kode: string; nama: string; tipe: string; saldo: number }

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const tahun = searchParams.get('tahun')

  const period = makeDateRange(tahun)

  const { data } = await supabaseAdmin
    .from('jurnal_item')
    .select('*, jurnal!jurnal_id(status, tanggal), coa!coa_id(kode, nama, tipe)')
    .gte('jurnal.tanggal', period.since)
    .lte('jurnal.tanggal', period.until)
    .neq('jurnal.status', 'draft')

  const coaMap = new Map<string, CoaRow & { tipe: string }>()
  for (const row of data ?? []) {
    const coa = row.coa as { kode: string; nama: string; tipe: string } | null
    if (!coa) continue
    const existing = coaMap.get(coa.kode)
    const delta = (row.debit ?? 0) - (row.credit ?? 0)
    if (existing) existing.saldo += delta
    else coaMap.set(coa.kode, { kode: coa.kode, nama: coa.nama, tipe: coa.tipe, saldo: delta })
  }

  const groups: Array<{ tipe: string; total: number; akuns: Array<{ kode: string; nama: string; saldo: number }> }> = []
  const order = ['aset', 'liabilitas', 'ekuitas']

  for (const tipe of order) {
    const filtered = [...coaMap.values()].filter(c => c.tipe?.toLowerCase() === tipe)
    if (!filtered.length) continue
    const total = filtered.reduce((s, c) => s + c.saldo, 0)
    groups.push({ tipe, total, akuns: filtered.map(c => ({ kode: c.kode, nama: c.nama, saldo: c.saldo })) })
  }

  const balanceDiff = (groups.find(g => g.tipe === 'aset')?.total ?? 0) - ((groups.find(g => g.tipe === 'liabilitas')?.total ?? 0) + (groups.find(g => g.tipe === 'ekuitas')?.total ?? 0))

  const pdfData = {
    tahun: tahun ?? String(new Date().getFullYear()),
    groups,
    balanceDiff,
  }

  try {
    const blob = await pdf(LaporanNeracaPDF({ data: pdfData })).toBlob()
    const disposition = searchParams.get('download') === '1'
      ? `attachment; filename="NERACA-${tahun ?? new Date().getFullYear()}.pdf"`
      : `inline; filename="NERACA-${tahun ?? new Date().getFullYear()}.pdf"`
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
      },
    })
  } catch {
    return internalError('Gagal generate PDF')
  }
}