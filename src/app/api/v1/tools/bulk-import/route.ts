import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { badRequest } from '@/lib/api/errors'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const dryRun = request.nextUrl.searchParams.get('dry_run') === 'true'

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return badRequest('File Excel wajib diupload')

  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer' })

  const results: Record<string, { success: number; failed: number; errors: string[] }> = {}

  if (workbook.SheetNames.includes('barang')) {
    const sheet = workbook.Sheets['barang']
    const rows = XLSX.utils.sheet_to_json(sheet) as Array<Record<string, unknown>>
    const barangResult = { success: 0, failed: 0, errors: [] as string[] }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2
      try {
        if (!row.nama) { barangResult.failed++; barangResult.errors.push(`Baris ${rowNum}: Nama wajib diisi`); continue }
        if (!row.kode) { barangResult.failed++; barangResult.errors.push(`Baris ${rowNum}: Kode wajib diisi`); continue }
        if (!row.kategori_id) { barangResult.failed++; barangResult.errors.push(`Baris ${rowNum}: Kategori ID wajib diisi`); continue }
        if (!dryRun) {
          const { error } = await supabaseAdmin.from('barang').insert({
            id: crypto.randomUUID(),
            nama: row.nama,
            kode: row.kode,
            kategori_id: row.kategori_id,
            satuan: row.satuan || 'pcs',
            spesifikasi: row.spesifikasi || null,
            harga_beli_default: row.harga_beli_default ? Number(row.harga_beli_default) : null,
            harga_jual_default: row.harga_jual_default ? Number(row.harga_jual_default) : null,
            stok_minimum: row.stok_minimum ? Number(row.stok_minimum) : 0,
            is_active: true,
          })
          if (error) { barangResult.failed++; barangResult.errors.push(`Baris ${rowNum}: ${error.message}`); continue }
        }
        barangResult.success++
      } catch (err) {
        barangResult.failed++
        barangResult.errors.push(`Baris ${rowNum}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
    results['barang'] = barangResult
  }

  if (workbook.SheetNames.includes('supplier')) {
    const sheet = workbook.Sheets['supplier']
    const rows = XLSX.utils.sheet_to_json(sheet) as Array<Record<string, unknown>>
    const supplierResult = { success: 0, failed: 0, errors: [] as string[] }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2
      try {
        if (!row.nama) { supplierResult.failed++; supplierResult.errors.push(`Baris ${rowNum}: Nama wajib diisi`); continue }
        if (!row.kode) { supplierResult.failed++; supplierResult.errors.push(`Baris ${rowNum}: Kode wajib diisi`); continue }
        if (!dryRun) {
          const { error } = await supabaseAdmin.from('supplier').insert({
            id: crypto.randomUUID(),
            nama: row.nama,
            kode: row.kode,
            kontak: row.kontak || null,
            terms_of_payment: row.terms_of_payment || null,
            is_active: true,
          })
          if (error) { supplierResult.failed++; supplierResult.errors.push(`Baris ${rowNum}: ${error.message}`); continue }
        }
        supplierResult.success++
      } catch (err) {
        supplierResult.failed++
        supplierResult.errors.push(`Baris ${rowNum}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
    results['supplier'] = supplierResult
  }

  if (workbook.SheetNames.includes('customer')) {
    const sheet = workbook.Sheets['customer']
    const rows = XLSX.utils.sheet_to_json(sheet) as Array<Record<string, unknown>>
    const customerResult = { success: 0, failed: 0, errors: [] as string[] }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2
      try {
        if (!row.nama) { customerResult.failed++; customerResult.errors.push(`Baris ${rowNum}: Nama wajib diisi`); continue }
        if (!row.kode) { customerResult.failed++; customerResult.errors.push(`Baris ${rowNum}: Kode wajib diisi`); continue }
        if (!dryRun) {
          const { error } = await supabaseAdmin.from('customer').insert({
            id: crypto.randomUUID(),
            nama: row.nama,
            kode: row.kode,
            alamat: row.alamat || null,
            kontak: row.kontak || null,
            terms_of_payment: row.terms_of_payment || null,
            is_active: true,
          })
          if (error) { customerResult.failed++; customerResult.errors.push(`Baris ${rowNum}: ${error.message}`); continue }
        }
        customerResult.success++
      } catch (err) {
        customerResult.failed++
        customerResult.errors.push(`Baris ${rowNum}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
    results['customer'] = customerResult
  }

  const totalSuccess = Object.values(results).reduce((s, r) => s + r.success, 0)
  const totalFailed = Object.values(results).reduce((s, r) => s + r.failed, 0)

  return NextResponse.json({
    dry_run: dryRun,
    total_success: totalSuccess,
    total_failed: totalFailed,
    details: results,
  })
}
