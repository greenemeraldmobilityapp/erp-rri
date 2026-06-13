import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateAutoKode, getDefaultKategoriId } from '@/lib/utils/barang-auto-create'
import { generateDocumentNumber } from '@/lib/utils/document-number'
import { storageService } from '@/lib/storage'

const importItemSchema = z.object({
  kode: z.string().default(''),
  nama_barang: z.string().default(''),
  satuan: z.string().default('-'),
  qty: z.number().default(0),
  harga_satuan: z.number().default(0),
})

const diJsonSchema = z.object({
  nomor_di: z.string().default(''),
  tanggal_di: z.string().default(''),
  revisi_ke: z.number().optional().default(0),
  department: z.string().optional().default('-'),
  nama_pic: z.string().optional().default('-'),
  jabatan_pic: z.string().optional().default('-'),
  nomor_kontrak: z.string().default(''),
  requestor: z.string().optional().default('-'),
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

  const customerId = formData.get('customerId') as string | null
  if (!customerId) return badRequest('customerId wajib diisi')

  const jsonRaw = formData.get('jsonData') as string | null
  if (!jsonRaw) return badRequest('jsonData wajib diisi')

  let jsonParsed: unknown
  try {
    jsonParsed = JSON.parse(jsonRaw)
  } catch {
    return badRequest('jsonData tidak valid: bukan JSON yang valid')
  }

  const parsed = diJsonSchema.safeParse(jsonParsed)
  if (!parsed.success) {
    return badRequest(parsed.error.issues.map(e => `[${e.path.join('.')}] ${e.message}`).join(', '))
  }

  const data = parsed.data

  const tanggalDi = new Date(data.tanggal_di)
  const tahun = tanggalDi.getFullYear()
  const bulan = tanggalDi.getMonth() + 1

  const imported: Array<{ kode: string; nama_barang: string; barangId: string; status: 'from_kontrak' | 'from_master' | 'created' | 'linked' }> = []
  const errors: Array<{ nama_barang: string; error: string }> = []

  // Step 1: Verify customer exists
  const { data: customer } = await supabaseAdmin
    .from('customer')
    .select('id, nama, kode')
    .eq('id', customerId)
    .single()

  if (!customer) return badRequest('Customer tidak ditemukan')

  // Base required fields
  const diMissing: string[] = []
  if (!data.nomor_di) diMissing.push('nomor_di')
  if (!data.tanggal_di || isNaN(Date.parse(data.tanggal_di))) diMissing.push('tanggal_di (YYYY-MM-DD)')
  if (!data.nomor_kontrak) diMissing.push('nomor_kontrak')
  if (diMissing.length > 0) {
    return badRequest(`Field wajib: ${diMissing.join(', ')}`)
  }

  // Customer-specific validation
  const custDiMissing: string[] = []
  if (customer.kode === 'BJS') {
    if (!data.nama_pic || data.nama_pic === '-') custDiMissing.push('nama_pic')
    if (!data.jabatan_pic || data.jabatan_pic === '-') custDiMissing.push('jabatan_pic')
    if (typeof data.time_for_delivery_hari !== 'number' || data.time_for_delivery_hari <= 0) custDiMissing.push('time_for_delivery_hari (>0)')
    if (typeof data.durasi_payment_hari !== 'number' || data.durasi_payment_hari <= 0) custDiMissing.push('durasi_payment_hari (>0)')
    if (!data.nama_penandatangan || data.nama_penandatangan === '-') custDiMissing.push('nama_penandatangan')
    if (!data.jabatan_penandatangan || data.jabatan_penandatangan === '-') custDiMissing.push('jabatan_penandatangan')
  }
  if (custDiMissing.length > 0) {
    return badRequest(`Field wajib untuk ${customer.nama}: ${custDiMissing.join(', ')}`)
  }

  // Step 2: Auto-match kontrak by nomor + customer_id (without date range — for late DI import)
  const { data: matchedKontrak } = await supabaseAdmin
    .from('kontrak')
    .select('id, nomor_kontrak, customer_id')
    .eq('customer_id', customerId)
    .ilike('nomor_kontrak', data.nomor_kontrak)
    .order('tanggal_selesai', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!matchedKontrak) {
    return badRequest(`Kontrak dengan nomor "${data.nomor_kontrak}" tidak ditemukan untuk customer ini. Pastikan nomor kontrak sesuai.`)
  }

  // Step 3: Auto-match / create PIC
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

  // Step 4: Generate document number
  let nomorDi: string
  try {
    nomorDi = await generateDocumentNumber('DI-EXT', tahun, bulan)
  } catch (err) {
    return internalError('Gagal generate nomor DI: ' + (err instanceof Error ? err.message : 'unknown'))
  }

  // Step 5: Get default kategori_id
  const defaultKategoriId = await getDefaultKategoriId()

  // Step 6: Process items
  for (const item of data.items) {
    try {
      // 6a: Try to find in kontrak_item by kontrak_id + kode
      const { data: kontrakItem } = await supabaseAdmin
        .from('kontrak_item')
        .select('id, barang_id, nama_barang')
        .eq('kontrak_id', matchedKontrak.id)
        .ilike('kode', item.kode)
        .maybeSingle()

      if (kontrakItem) {
        // Found in kontrak_item
        const kontrakItemName = String(kontrakItem.nama_barang ?? '')
        if (kontrakItemName.toLowerCase() === item.nama_barang.toLowerCase()) {
          // Same name — reuse existing barang
          imported.push({ kode: item.kode, nama_barang: item.nama_barang, barangId: kontrakItem.barang_id, status: 'from_kontrak' })
          continue
        }
        // Different name — create new barang (linked to kontrak_item)
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
        imported.push({ kode: item.kode, nama_barang: item.nama_barang, barangId: newBarang.id, status: 'created' })
        continue
      }

      // 6b: Not in kontrak_item — search master barang by kode
      const { data: existingBarang } = await supabaseAdmin
        .from('barang')
        .select('id, nama')
        .eq('is_active', true)
        .ilike('kode', item.kode)
        .maybeSingle()

      if (existingBarang) {
        // Found by kode — link it
        imported.push({ kode: item.kode, nama_barang: item.nama_barang, barangId: existingBarang.id, status: 'from_master' })
        continue
      }

      // 6c: Not found anywhere — create new barang
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
      imported.push({ kode: item.kode, nama_barang: item.nama_barang, barangId: newBarang.id, status: 'created' })
    } catch (err) {
      errors.push({ nama_barang: item.nama_barang, error: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  // Edge case guard
  if (imported.length === 0 && errors.length === 0 && data.items.length > 0) {
    errors.push({ nama_barang: 'system', error: `Tidak ada item yang berhasil diproses dari ${data.items.length} item.` })
  }

  // Step 7: Create DI record
  const diId = crypto.randomUUID()
  const { error: diError } = await supabaseAdmin
    .from('di')
    .insert({
      id: diId,
      nomor: nomorDi,
      customer_id: customerId,
      kontrak_id: matchedKontrak.id,
      pic_customer_id: picCustomerId,
      nomor_di_customer: data.nomor_di,
      terms_of_payment: data.durasi_payment_hari > 0 ? `${data.durasi_payment_hari} hari` : null,
      waktu_pengiriman: data.time_for_delivery_hari > 0 ? data.time_for_delivery_hari : null,
      tanggal: tanggalDi.toISOString(),
      status: 'confirmed',
      is_active: true,
      keterangan: data.catatan || null,
      nama_penandatangan: data.nama_penandatangan !== '-' ? data.nama_penandatangan : null,
      jabatan_penandatangan: data.jabatan_penandatangan !== '-' ? data.jabatan_penandatangan : null,
      revisi_ke: data.revisi_ke || 0,
      nomor_kontrak_customer: data.nomor_kontrak,
    })

  if (diError) {
    return internalError('Gagal membuat DI: ' + diError.message)
  }

  // Step 8: Create DI items
  const diItems: Array<{
    di_id: string
    barang_id: string
    jumlah: number
    harga_satuan: number
    keterangan?: string
    nama_barang: string
    kode_barang: string
    satuan: string
  }> = []

  for (const item of data.items) {
    const matched = imported.find(i => i.kode === item.kode && i.nama_barang === item.nama_barang)
    if (matched) {
      diItems.push({
        di_id: diId,
        barang_id: matched.barangId,
        jumlah: item.qty,
        harga_satuan: item.harga_satuan,
        nama_barang: item.nama_barang,
        kode_barang: item.kode,
        satuan: item.satuan,
      })
    }
  }

  if (diItems.length > 0) {
    const { error: itemsError } = await supabaseAdmin
      .from('di_item')
      .insert(diItems)

    if (itemsError) {
      errors.push({ nama_barang: 'system', error: 'Gagal menyimpan item DI: ' + itemsError.message })
    }
  }

  // Step 9: Upload PDF file
  const pdfFile = formData.get('pdfFile') as File | null
  if (pdfFile) {
    const maxSize = 10 * 1024 * 1024
    if (pdfFile.size > maxSize) {
      errors.push({ nama_barang: 'system', error: 'Ukuran file maksimal 10MB — file tidak disimpan' })
    } else {
      try {
        const buffer = Buffer.from(await pdfFile.arrayBuffer())
        const filePath = `dokumen/di/${diId}/${pdfFile.name}`
        const uploadResult = await storageService.upload(buffer, filePath, pdfFile.type)

        const { error: docError } = await supabaseAdmin
          .from('di_document')
          .insert({
            id: crypto.randomUUID(),
            di_id: diId,
            file_name: pdfFile.name,
            file_url: uploadResult.webViewLink,
            drive_file_id: uploadResult.fileId,
          })

        if (docError) {
          await storageService.delete(uploadResult.fileId).catch(() => {})
          errors.push({ nama_barang: 'system', error: 'Gagal menyimpan dokumen DI: ' + docError.message })
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
      from_kontrak_count: imported.filter(i => i.status === 'from_kontrak').length,
      from_master_count: imported.filter(i => i.status === 'from_master').length,
      di_id: diId,
      nomor_di: nomorDi,
      customer_id: customerId,
      kontrak_id: matchedKontrak.id,
      items: imported,
      errors: errors.length > 0 ? errors : undefined,
    },
  })
}
