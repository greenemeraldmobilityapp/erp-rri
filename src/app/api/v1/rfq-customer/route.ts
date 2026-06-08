import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateGlobalDocumentNumber } from '@/lib/utils/document-number'

const itemSchema = z.object({
  barang_id: z.string().optional().nullable(),
  nama_barang: z.string().optional().nullable(),
  jumlah: z.coerce.number().int().positive('Jumlah harus > 0'),
  satuan: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
  justification: z.string().optional().nullable(),
})

const fileSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
  fileUrl: z.string(),
})

const schema = z.object({
  id: z.string().uuid().optional(), // client-generated UUID for direct storage path
  customer_id: z.string().min(1, 'Customer harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  nomor_rfq_customer: z.string().optional().nullable(),
  pic_customer_id: z.string().optional().nullable(),
  perihal: z.string().optional().default('Permintaan Penawaran'),
  status: z.string().optional().default('draft'),
  keterangan: z.string().optional().nullable(),
  items: z.array(itemSchema).optional().default([]),
  files: z.array(fileSchema).optional().default([]),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { data, error } = await supabaseAdmin
    .from('rfq_customer')
    .select('*, customer!customer_id(id, nama, kode)')
    .order('created_at', { ascending: false })

  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const nomor = await generateGlobalDocumentNumber('RFQC')

  const now = new Date().toISOString()
  const recordId = parsed.data.id || crypto.randomUUID()

  const { data: rfq, error: rfqError } = await supabaseAdmin
    .from('rfq_customer')
    .insert({
      id: recordId,
      nomor,
      customer_id: parsed.data.customer_id,
      nomor_rfq_customer: parsed.data.nomor_rfq_customer ?? null,
      tanggal: parsed.data.tanggal,
      pic_customer_id: parsed.data.pic_customer_id || null,
      perihal: parsed.data.perihal ?? 'Permintaan Penawaran',
      status: parsed.data.status ?? 'draft',
      keterangan: parsed.data.keterangan ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (rfqError) return internalError(rfqError)

  const items = (parsed.data.items ?? []).map(item => ({
    rfq_customer_id: recordId,
    barang_id: item.barang_id ?? null,
    nama_barang: item.nama_barang ?? null,
    jumlah: item.jumlah,
    satuan: item.satuan ?? null,
    image_url: item.image_url ?? null,
    keterangan: item.keterangan ?? null,
    justification: item.justification ?? null,
    created_at: now,
    updated_at: now,
  }))

  if (items.length > 0) {
    const { error: itemsError } = await supabaseAdmin.from('rfq_customer_item').insert(items)
    if (itemsError) {
      await supabaseAdmin.from('rfq_customer').delete().eq('id', recordId)
      return internalError(itemsError)
    }
  }

  const fileRecords = (parsed.data.files ?? []).map(f => ({
    id: crypto.randomUUID(),
    rfq_customer_id: recordId,
    file_name: f.fileName,
    file_url: f.fileUrl,
    drive_file_id: f.fileId,
  }))

  if (fileRecords.length > 0) {
    const { error: filesError } = await supabaseAdmin.from('rfq_customer_document').insert(fileRecords)
    if (filesError) {
      await supabaseAdmin.from('rfq_customer').delete().eq('id', recordId)
      return internalError(filesError)
    }
  }

  return NextResponse.json({ data: { ...rfq, items, fileRecords } }, { status: 201 })
}
