import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { logAudit } from '@/lib/audit'
import { generateGlobalDocumentNumber } from '@/lib/utils/document-number'

const itemSchema = z.object({
  quotation_item_id: z.string().min(1),
  harga_satuan_baru: z.coerce.number().nonnegative(),
  diskon_baru: z.coerce.number().nonnegative().optional(),
  alasan: z.string().optional(),
})

const schema = z.object({
  quotation_id: z.string().min(1, 'Quotation harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  keterangan: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { data, error } = await supabaseAdmin
    .from('negoiasi')
    .select('*, quotation!quotation_id(nomor)')
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

  const { data: existingPO } = await supabaseAdmin
    .from('customer_po')
    .select('id, nomor')
    .eq('quotation_id', parsed.data.quotation_id)
    .eq('status', 'confirmed')
    .limit(1)
  if (existingPO && existingPO.length > 0) {
    return badRequest(`Quotation ini sudah memiliki PO Customer (${existingPO[0].nomor}) yang dikonfirmasi. Tidak bisa membuat negosiasi baru.`)
  }

  // Calculate revision number
  const { count } = await supabaseAdmin
    .from('negoiasi')
    .select('*', { count: 'exact', head: true })
    .eq('quotation_id', parsed.data.quotation_id)
  const revision = (count ?? 0) + 1

  const nomor = await generateGlobalDocumentNumber('NEG')
  const now = new Date().toISOString()

  const { data: neg, error: negError } = await supabaseAdmin
    .from('negoiasi')
    .insert({ nomor, quotation_id: parsed.data.quotation_id, tanggal: parsed.data.tanggal, status: 'draft', revision, keterangan: parsed.data.keterangan ?? null, created_at: now, updated_at: now })
    .select().single()

  if (negError) return internalError(negError)

  // Fetch current quotation_item prices as snapshot
  const qtnItemIds = parsed.data.items.map(i => i.quotation_item_id)
  const { data: qtnItems } = await supabaseAdmin
    .from('quotation_item')
    .select('id, harga_satuan, diskon')
    .in('id', qtnItemIds)
  const qtnPriceMap = (qtnItems ?? []).reduce((acc, qi) => {
    acc[qi.id] = { harga_satuan: qi.harga_satuan, diskon: qi.diskon ?? 0 }
    return acc
  }, {} as Record<string, { harga_satuan: number; diskon: number }>)

  const items = parsed.data.items.map(item => {
    const lama = qtnPriceMap[item.quotation_item_id]
    return {
      negoiasi_id: neg.id,
      quotation_item_id: item.quotation_item_id,
      harga_satuan_lama: lama?.harga_satuan ?? null,
      diskon_lama: lama?.diskon ?? null,
      harga_satuan_baru: item.harga_satuan_baru,
      diskon_baru: item.diskon_baru ?? 0,
      alasan: item.alasan ?? null,
      created_at: now, updated_at: now,
    }
  })

  const { error: itemsError } = await supabaseAdmin.from('negoiasi_item').insert(items)
  if (itemsError) { await supabaseAdmin.from('negoiasi').delete().eq('id', neg.id); return internalError(itemsError) }

  await supabaseAdmin
    .from('quotation')
    .update({ status: 'proses_negosiasi', updated_at: now })
    .eq('id', parsed.data.quotation_id)
    .eq('status', 'sent')

  await logAudit({ userId: auth.user?.id, action: 'CREATE', tableName: 'negoiasi', recordId: neg.id, changes: { nomor: neg.nomor, quotation_id: parsed.data.quotation_id, revision, items_count: items.length } })

  return NextResponse.json({ data: { ...neg, items } }, { status: 201 })
}
