import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateGlobalDocumentNumber, formatChildNumber } from '@/lib/utils/document-number'
import { logAudit } from '@/lib/audit'
import { createBarangFromRfqItem } from '@/lib/utils/barang-auto-create'

const itemSchema = z.object({
  barang_id: z.string().optional(),
  jumlah: z.coerce.number().int().positive(),
  harga_satuan: z.coerce.number().nonnegative(),
  keterangan: z.string().optional(),
  nama_barang: z.string().optional(),
  satuan: z.string().optional(),
  image_url: z.string().optional().nullable(),
  create_barang: z.boolean().optional().default(false),
})

const schema = z.object({
  customer_id: z.string().min(1),
  quotation_id: z.string().optional(),
  tanggal: z.string().min(1),
  nomor_po_customer: z.string().optional(),
  terms_of_payment: z.string().optional(),
  waktu_pengiriman: z.coerce.number().int().positive().optional(),
  pic_customer_id: z.string().optional(),
  kategori_baru_id: z.string().optional(),
  nama_penandatangan: z.string().optional().nullable(),
  jabatan_penandatangan: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('customer_po').select('*, customer!customer_id(nama, kode)').order('tanggal', { ascending: false }).order('created_at', { ascending: false })
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

  let nomor: string
  if (parsed.data.quotation_id) {
    const { data: parent } = await supabaseAdmin
      .from('quotation')
      .select('nomor')
      .eq('id', parsed.data.quotation_id)
      .maybeSingle()
    if (parent?.nomor) {
      nomor = formatChildNumber(parent.nomor, 'CPO')
    } else {
      nomor = await generateGlobalDocumentNumber('CPO')
    }
  } else {
    nomor = await generateGlobalDocumentNumber('CPO')
  }
  const now = new Date().toISOString()

  const { data: po, error: poError } = await supabaseAdmin.from('customer_po').insert({
    nomor, customer_id: parsed.data.customer_id, quotation_id: parsed.data.quotation_id ?? null,
    tanggal: parsed.data.tanggal, status: 'draft', nomor_po_customer: parsed.data.nomor_po_customer ?? null,
    terms_of_payment: parsed.data.terms_of_payment ?? null,
    waktu_pengiriman: parsed.data.waktu_pengiriman ?? null,
    pic_customer_id: parsed.data.pic_customer_id ?? null,
    nama_penandatangan: parsed.data.nama_penandatangan ?? null,
    jabatan_penandatangan: parsed.data.jabatan_penandatangan ?? null,
    created_at: now, updated_at: now,
  }).select().single()
  if (poError) return internalError(poError)

  const processedItems: Array<{
    customer_po_id: string; barang_id: string; jumlah: number
    harga_satuan: number; keterangan: string | null; created_at: string; updated_at: string
  }> = []

  for (const item of parsed.data.items) {
    let barangId = item.barang_id

    if (!barangId && item.create_barang) {
      const newBarang = await createBarangFromRfqItem(
        item.nama_barang || '',
        item.satuan || null,
        parsed.data.kategori_baru_id || null,
        item.image_url ?? null,
        item.harga_satuan ?? null,
      )
      barangId = newBarang.id
    }

    if (!barangId) {
      await supabaseAdmin.from('customer_po').delete().eq('id', po.id)
      return badRequest(`Item "${item.nama_barang || '(tanpa nama)'}" tidak memiliki barang_id`)
    }

    processedItems.push({
      customer_po_id: po.id,
      barang_id: barangId,
      jumlah: item.jumlah,
      harga_satuan: item.harga_satuan,
      keterangan: item.keterangan ?? null,
      created_at: now,
      updated_at: now,
    })
  }
  
  for (const pi of parsed.data.items) {
    if (pi.image_url && pi.barang_id) {
      await supabaseAdmin.from('barang').update({ image_url: pi.image_url }).eq('id', pi.barang_id).is('image_url', null)
    }
  }

  const { error: itemsError } = await supabaseAdmin.from('customer_po_item').insert(processedItems)
  if (itemsError) { await supabaseAdmin.from('customer_po').delete().eq('id', po.id); return internalError(itemsError) }

  await logAudit({
    userId: auth.user?.id, action: 'CREATE', tableName: 'customer_po',
    recordId: po.id, changes: { nomor, customer_id: parsed.data.customer_id, items_count: processedItems.length },
  })

  return NextResponse.json({ data: { ...po, items: processedItems } }, { status: 201 })
}
