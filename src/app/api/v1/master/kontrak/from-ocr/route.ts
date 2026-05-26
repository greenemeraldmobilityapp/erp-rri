import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'

const ocrItemSchema = z.object({
  kode: z.string().optional(),
  uom: z.string().optional(),
  nama: z.string().optional(),
  harga: z.number().nonnegative().default(0),
  createAsBarang: z.boolean().default(false),
})

const schema = z.object({
  customerId: z.string().min(1, 'Customer harus dipilih'),
  nomorKontrak: z.string().optional(),
  nama: z.string().min(1, 'Nama kontrak harus diisi'),
  tanggalMulai: z.string().optional(),
  tanggalSelesai: z.string().optional(),
  tanggalTandaTangan: z.string().optional(),
  penandatanganRriNama: z.string().optional(),
  penandatanganRriJabatan: z.string().optional(),
  penandatanganCustomerNama: z.string().optional(),
  penandatanganCustomerJabatan: z.string().optional(),
  catatan: z.string().optional(),
  items: z.array(ocrItemSchema).default([]),
  fileId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const { customerId, nomorKontrak, nama, tanggalMulai, tanggalSelesai, tanggalTandaTangan, penandatanganRriNama, penandatanganRriJabatan, penandatanganCustomerNama, penandatanganCustomerJabatan, catatan, items, fileId } = parsed.data

  const kontrakPayload: Record<string, unknown> = {
    customer_id: customerId,
    nomor_kontrak: nomorKontrak || null,
    nama,
    tanggal_mulai: tanggalMulai || null,
    tanggal_selesai: tanggalSelesai || null,
    tanggal_tanda_tangan: tanggalTandaTangan || null,
    penandatangan_rri_nama: penandatanganRriNama || null,
    penandatangan_rri_jabatan: penandatanganRriJabatan || null,
    penandatangan_customer_nama: penandatanganCustomerNama || null,
    penandatangan_customer_jabatan: penandatanganCustomerJabatan || null,
    catatan: catatan || null,
    is_active: true,
  }

  const { data: kontrak, error: kontrakError } = await supabaseAdmin.from('kontrak')
    .insert(kontrakPayload)
    .select()
    .single()

  if (kontrakError) return internalError('Gagal membuat kontrak: ' + kontrakError.message)

  const kontrakId = kontrak.id

  for (const item of items) {
    let barangId: string | null = null

    if (item.createAsBarang && item.nama) {
      const { data: existingBarang } = await supabaseAdmin.from('barang')
        .select('id').eq('kode', item.kode).maybeSingle()

      if (existingBarang) {
        barangId = existingBarang.id
      } else {
        const { data: newBarang, error: barangError } = await supabaseAdmin.from('barang')
          .insert({ kode: item.kode || '', nama: item.nama, satuan: item.uom || 'pcs' })
          .select()
          .single()

        if (!barangError && newBarang) {
          barangId = newBarang.id
        }
      }
    }

    const itemPayload: Record<string, unknown> = {
      kontrak_id: kontrakId,
      barang_id: barangId,
      kode_barang: item.kode || null,
      nama_barang: item.nama || null,
      satuan: item.uom || null,
      harga_satuan: item.harga,
      ppn_include: true,
    }

    const { error: itemError } = await supabaseAdmin.from('kontrak_item').insert(itemPayload)
    if (itemError) console.error('Failed to create kontrak item:', itemError)
  }

  if (fileId) {
    const { data: ocrHistory } = await supabaseAdmin.from('ai_ocr_history')
      .select('file_name, file_url, drive_file_id')
      .eq('id', fileId)
      .single()

    if (ocrHistory) {
      await supabaseAdmin.from('kontrak_file').insert({
        kontrak_id: kontrakId,
        jenis_dokumen: 'kontrak',
        file_name: ocrHistory.file_name,
        file_url: ocrHistory.file_url,
        drive_file_id: ocrHistory.drive_file_id,
      })
    }
  }

  return NextResponse.json({ data: kontrak }, { status: 201 })
}
