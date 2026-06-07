import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateAutoKode, generateCustomerAutoKode, getDefaultKategoriId } from '@/lib/utils/barang-auto-create'
import { generateDocumentNumber } from '@/lib/utils/document-number'
import { storageService } from '@/lib/storage'

const importItemSchema = z.object({
  nama_barang: z.string().default(''),
  satuan: z.string().default('-'),
  qty: z.number().default(0),
  harga_satuan: z.number().default(0),
})

const poJsonSchema = z.object({
  nama_customer: z.string().default(''),
  nama_pic: z.string().default(''),
  jabatan_pic: z.string().default(''),
  nomor_po_customer: z.string().default(''),
  nomor_pr_customer: z.string().optional().default('-'),
  nomor_quotation_rri: z.string().optional().default('-'),
  tanggal_po: z.string().default(''),
  revisi_ke: z.number().optional().default(0),
  time_for_delivery_hari: z.number().optional().default(0),
  durasi_payment_hari: z.number().optional().default(0),
  catatan: z.string().optional().default(''),
  nama_penandatangan: z.string().optional().default('-'),
  jabatan_penandatangan: z.string().optional().default('-'),
  items: z.array(importItemSchema).min(1, 'Minimal 1 item'),
})

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const formData = await request.formData().catch(() => null)
  if (!formData) return badRequest('Invalid form data')

  const jsonRaw = formData.get('jsonData') as string | null
  if (!jsonRaw) return badRequest('jsonData wajib diisi')

  let jsonParsed: unknown
  try {
    jsonParsed = JSON.parse(jsonRaw)
  } catch {
    return badRequest('jsonData tidak valid: bukan JSON yang valid')
  }

  const parsed = poJsonSchema.safeParse(jsonParsed)
  if (!parsed.success) {
    return badRequest(parsed.error.issues.map(e => `[${e.path.join('.')}] ${e.message}`).join(', '))
  }

  const data = parsed.data

  // Base required field validation (applies to all customers)
  const baseMissing: string[] = []
  if (!data.nama_customer) baseMissing.push('nama_customer')
  if (!data.nama_pic) baseMissing.push('nama_pic')
  if (!data.jabatan_pic) baseMissing.push('jabatan_pic')
  if (!data.nomor_po_customer) baseMissing.push('nomor_po_customer')
  if (!data.tanggal_po || isNaN(Date.parse(data.tanggal_po))) baseMissing.push('tanggal_po (YYYY-MM-DD)')
  if (baseMissing.length > 0) {
    return badRequest(`Field wajib: ${baseMissing.join(', ')}`)
  }

  const tanggalPo = new Date(data.tanggal_po)
  const tahun = tanggalPo.getFullYear()
  const bulan = tanggalPo.getMonth() + 1

  const imported: Array<{ nama_barang: string; barangId: string; status: 'created' | 'skipped' | 'linked' }> = []
  const errors: Array<{ nama_barang: string; error: string }> = []

  // Step 1: Auto-match / create customer by nama_customer
  const { data: existingCustomer } = await supabaseAdmin
    .from('customer')
    .select('id, nama, kode')
    .ilike('nama', data.nama_customer)
    .maybeSingle()

  let customerId: string
  if (existingCustomer) {
    customerId = existingCustomer.id
    // Customer-specific field validation
    const kode = existingCustomer.kode
    const custMissing: string[] = []
    if (kode === 'BJS') {
      if (!data.nomor_pr_customer || data.nomor_pr_customer === '-') custMissing.push('nomor_pr_customer')
      if (typeof data.time_for_delivery_hari !== 'number' || data.time_for_delivery_hari <= 0) custMissing.push('time_for_delivery_hari (>0)')
      if (typeof data.durasi_payment_hari !== 'number' || data.durasi_payment_hari <= 0) custMissing.push('durasi_payment_hari (>0)')
      if (!data.nama_penandatangan || data.nama_penandatangan === '-') custMissing.push('nama_penandatangan')
      if (!data.jabatan_penandatangan || data.jabatan_penandatangan === '-') custMissing.push('jabatan_penandatangan')
    }
    if (kode === 'MKP') {
      if (!data.catatan) custMissing.push('catatan')
      if (!data.nama_penandatangan || data.nama_penandatangan === '-') custMissing.push('nama_penandatangan')
      if (!data.jabatan_penandatangan || data.jabatan_penandatangan === '-') custMissing.push('jabatan_penandatangan')
    }
    if (custMissing.length > 0) {
      return badRequest(`Field wajib untuk ${existingCustomer.nama}: ${custMissing.join(', ')}`)
    }
  } else {
    const customerKode = await generateCustomerAutoKode()
    const { data: newCustomer, error: customerError } = await supabaseAdmin
      .from('customer')
      .insert({ nama: data.nama_customer, kode: customerKode, is_active: true })
      .select('id')
      .single()

    if (customerError || !newCustomer) {
      return internalError('Gagal membuat customer: ' + (customerError?.message || 'unknown'))
    }
    customerId = newCustomer.id
  }

  // Step 2: Auto-match / create PIC
  let picCustomerId: string | null = null
  if (data.nama_pic && data.nama_pic !== '-') {
    const { data: existingPic } = await supabaseAdmin
      .from('customer_pic')
      .select('id')
      .eq('customer_id', customerId)
      .ilike('nama', data.nama_pic)
      .maybeSingle()

    if (existingPic) {
      picCustomerId = existingPic.id
    } else {
      const { data: newPic, error: picError } = await supabaseAdmin
        .from('customer_pic')
        .insert({
          customer_id: customerId,
          nama: data.nama_pic,
          jabatan: data.jabatan_pic !== '-' ? data.jabatan_pic : null,
          is_active: true,
        })
        .select('id')
        .single()

      if (!picError && newPic) {
        picCustomerId = newPic.id
      }
    }
  }

  // Step 3: Check for duplicate nomor_po_customer (case-insensitive, non-cancelled)
  const { data: existingPo } = await supabaseAdmin
    .from('customer_po')
    .select('id, nomor')
    .ilike('nomor_po_customer', data.nomor_po_customer)
    .neq('status', 'cancelled')
    .maybeSingle()

  if (existingPo) {
    return badRequest(
      `PO dengan nomor "${data.nomor_po_customer}" sudah pernah diimport sebelumnya (${existingPo.nomor}). Silakan gunakan nomor PO yang berbeda, atau hubungi admin jika ini adalah revisi.`
    )
  }

  // Step 4: Generate document number
  let nomorPo: string
  try {
    nomorPo = await generateDocumentNumber('CPO-EXT', tahun, bulan)
  } catch (err) {
    return internalError('Gagal generate nomor PO: ' + (err instanceof Error ? err.message : 'unknown'))
  }

  // Step 5: Get default kategori_id before looping items
  const defaultKategoriId = await getDefaultKategoriId()

  // Step 6: Loop items — create barang
  for (const item of data.items) {
    try {
      const { data: existingBarang } = await supabaseAdmin
        .from('barang')
        .select('id, nama, harga_jual_default')
        .ilike('nama', item.nama_barang)
        .maybeSingle()

      if (existingBarang) {
        const existingHarga = Number(existingBarang.harga_jual_default)
        if (existingHarga === item.harga_satuan) {
          imported.push({ nama_barang: item.nama_barang, barangId: existingBarang.id, status: 'skipped' })
          continue
        }
        // Nama sama tapi harga beda — link existing barang
        imported.push({ nama_barang: item.nama_barang, barangId: existingBarang.id, status: 'linked' })
        continue
      }

      // Barang belum ada — create baru
      const kode = await generateAutoKode()
      const { data: newBarang, error: barangError } = await supabaseAdmin
        .from('barang')
        .insert({
          nama: item.nama_barang,
          kode,
          satuan: item.satuan,
          kategori_id: defaultKategoriId,
          harga_jual_default: item.harga_satuan,
          stok_minimum: 0,
          is_active: true,
        })
        .select('id')
        .single()

      if (barangError || !newBarang) {
        errors.push({ nama_barang: item.nama_barang, error: barangError?.message || 'Gagal membuat barang' })
        continue
      }
      imported.push({ nama_barang: item.nama_barang, barangId: newBarang.id, status: 'created' })
    } catch (err) {
      errors.push({ nama_barang: item.nama_barang, error: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  // Edge case: imported array still empty despite no errors thrown — shouldn't happen but guard it
  if (imported.length === 0 && errors.length === 0 && data.items.length > 0) {
    errors.push({ nama_barang: 'system', error: `Tidak ada item yang berhasil diproses dari ${data.items.length} item. Semua item gagal di tahap query/insert barang.` })
  }

  // Step 7: Create customer_po
  const poId = crypto.randomUUID()
  const { error: poError } = await supabaseAdmin
    .from('customer_po')
    .insert({
      id: poId,
      nomor: nomorPo,
      customer_id: customerId,
      nomor_po_customer: data.nomor_po_customer,
      nomor_quotation_rri: data.nomor_quotation_rri,
      nomor_pr_customer: data.nomor_pr_customer !== '-' ? data.nomor_pr_customer : null,
      tanggal: tanggalPo.toISOString(),
      status: 'confirmed',
      terms_of_payment: data.durasi_payment_hari > 0 ? `${data.durasi_payment_hari} hari` : null,
      waktu_pengiriman: data.time_for_delivery_hari > 0 ? data.time_for_delivery_hari : null,
      pic_customer_id: picCustomerId,
      is_active: true,
      nama_penandatangan: data.nama_penandatangan !== '-' ? data.nama_penandatangan : null,
      jabatan_penandatangan: data.jabatan_penandatangan !== '-' ? data.jabatan_penandatangan : null,
    })

  if (poError) {
    return internalError('Gagal membuat PO: ' + poError.message)
  }

  // Step 8: Create customer_po_item for imported barang
  const poItems: Array<{
    customer_po_id: string
    barang_id: string
    jumlah: number
    harga_satuan: number
  }> = []
  for (const item of data.items) {
    const matched = imported.find(i => i.nama_barang === item.nama_barang)
    if (matched) {
      poItems.push({
        customer_po_id: poId,
        barang_id: matched.barangId,
        jumlah: item.qty,
        harga_satuan: item.harga_satuan,
      })
    }
  }

  if (poItems.length > 0) {
    const { error: itemsError } = await supabaseAdmin
      .from('customer_po_item')
      .insert(poItems)

    if (itemsError) {
      errors.push({ nama_barang: 'system', error: 'Gagal menyimpan item PO: ' + itemsError.message })
    }
  }

  // Step 9: Upload PDF file if provided
  const pdfFile = formData.get('pdfFile') as File | null
  if (pdfFile) {
    const maxSize = 10 * 1024 * 1024
    if (pdfFile.size > maxSize) {
      errors.push({ nama_barang: 'system', error: 'Ukuran file maksimal 10MB — file tidak disimpan' })
    } else {
      try {
        const buffer = Buffer.from(await pdfFile.arrayBuffer())
        const filePath = `dokumen/customer-po/${poId}/${pdfFile.name}`
        const uploadResult = await storageService.upload(buffer, filePath, pdfFile.type)

        const { error: docError } = await supabaseAdmin
          .from('customer_po_document')
          .insert({
            id: crypto.randomUUID(),
            customer_po_id: poId,
            file_name: pdfFile.name,
            file_url: uploadResult.webViewLink,
            drive_file_id: uploadResult.fileId,
          })

        if (docError) {
          await storageService.delete(uploadResult.fileId).catch(() => {})
          errors.push({ nama_barang: 'system', error: 'Gagal menyimpan dokumen: ' + docError.message })
        }
      } catch {
        errors.push({ nama_barang: 'system', error: 'Gagal upload file PDF' })
      }
    }
  }

  return NextResponse.json({
    data: {
      success: errors.length === 0,
      imported_count: imported.filter(i => i.status === 'created').length,
      skipped_count: imported.filter(i => i.status === 'skipped').length,
      po_id: poId,
      nomor_po: nomorPo,
      customer_id: customerId,
      items: imported,
      errors: errors.length > 0 ? errors : undefined,
    },
  })
}
