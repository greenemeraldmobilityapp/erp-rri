import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { generateGlobalDocumentNumber, formatChildNumber } from '@/lib/utils/document-number'
import { sendWhatsapp } from '@/lib/utils/whatsapp'
import { logAudit } from '@/lib/audit'
import { getConfigNumber } from '@/lib/utils/config'

const itemSchema = z.object({
  barang_id: z.string().optional().nullable(),
  specification: z.string().optional().nullable(),
  justification: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  nama_barang: z.string().optional().nullable(),
  satuan: z.string().optional().nullable(),
  jumlah: z.coerce.number().int().positive(),
  harga_satuan: z.coerce.number().nonnegative(),
  diskon: z.coerce.number().nonnegative().optional().nullable(),
  keterangan: z.string().optional().nullable(),
})

const schema = z.object({
  customer_id: z.string().min(1, 'Customer harus dipilih'),
  rfq_id: z.string().optional().nullable(),
  referensi: z.string().optional().nullable(),
  lampiran: z.string().optional().nullable(),
  perihal: z.string().optional().default('Penawaran Harga'),
  pic_customer_id: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  masa_berlaku: z.string().optional().nullable(),
  ppn_rate: z.coerce.number().nonnegative().optional(),
  ppn_enabled: z.coerce.boolean().optional().default(false),
  keterangan: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1, 'Minimal 1 item'),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { data, error } = await supabaseAdmin
    .from('quotation')
    .select('*, customer!customer_id(id, nama, kode)')
    .order('created_at', { ascending: false })

  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}

function calcTanggalBerlaku(masaBerlaku: string, tanggal: Date): string | null {
  const map: Record<string, number> = {
    '1 Minggu': 7, '2 Minggu': 14, '3 Minggu': 21, '1 Bulan': 30,
  }
  const days = map[masaBerlaku]
  if (!days) return null
  const end = new Date(tanggal)
  end.setDate(end.getDate() + days)
  return end.toISOString().split('T')[0]
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  // Copy nomor from parent RFQ Customer if linked
  let nomor: string
  if (parsed.data.rfq_id) {
    const { data: parent } = await supabaseAdmin
      .from('rfq_customer')
      .select('nomor')
      .eq('id', parsed.data.rfq_id)
      .maybeSingle()
    if (parent?.nomor) {
      nomor = formatChildNumber(parent.nomor, 'SPH')
    } else {
      nomor = await generateGlobalDocumentNumber('SPH')
    }
  } else {
    nomor = await generateGlobalDocumentNumber('SPH')
  }

  const ppnRate = parsed.data.ppn_rate ?? await getConfigNumber('ppn_rate', 0.11)
  const now = new Date().toISOString()

  const items = parsed.data.items.map(item => {
    const totalHarga = item.jumlah * item.harga_satuan
    return {
      barang_id: item.barang_id,
      specification: item.specification ?? null,
      justification: item.justification ?? null,
      image_url: item.image_url ?? null,
      nama_barang: item.nama_barang ?? null,
      satuan: item.satuan ?? null,
      jumlah: item.jumlah,
      harga_satuan: item.harga_satuan,
      diskon: item.diskon ?? 0,
      total_harga: totalHarga,
      keterangan: item.keterangan ?? null,
    }
  })

  const totalHarga = items.reduce((sum, i) => sum + (i.total_harga ?? 0), 0)
  const tanggal = new Date(parsed.data.tanggal)
  const tanggalBerlakuSampai = parsed.data.masa_berlaku
    ? calcTanggalBerlaku(parsed.data.masa_berlaku, tanggal)
    : null

  let picCustomerId = parsed.data.pic_customer_id || null
  if (!picCustomerId && parsed.data.rfq_id) {
    const { data: rfq } = await supabaseAdmin
      .from('rfq_customer')
      .select('pic_customer_id')
      .eq('id', parsed.data.rfq_id)
      .single()
    if (rfq?.pic_customer_id) picCustomerId = rfq.pic_customer_id
  }

  const { data: qtn, error: qtnError } = await supabaseAdmin
    .from('quotation')
    .insert({
      nomor,
      customer_id: parsed.data.customer_id,
      rfq_id: parsed.data.rfq_id ?? null,
      referensi: parsed.data.referensi ?? null,
      lampiran: parsed.data.lampiran ?? null,
      perihal: parsed.data.perihal ?? 'Penawaran Harga',
      pic_customer_id: picCustomerId,
      alamat: parsed.data.alamat ?? null,
      tanggal: parsed.data.tanggal,
      masa_berlaku: parsed.data.masa_berlaku ?? null,
      tanggal_berlaku_sampai: tanggalBerlakuSampai,
      status: 'draft',
       ppn_rate: ppnRate,
      ppn_enabled: parsed.data.ppn_enabled,
      total_harga: totalHarga,
      keterangan: parsed.data.keterangan ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (qtnError) return internalError(qtnError)

  const dbItems = items.map(item => ({
    quotation_id: qtn.id,
    ...item,
    ppn_per_item: parsed.data.ppn_enabled
      ? (item.total_harga ?? 0) * ppnRate
      : 0,
  }))

  const { error: itemsError } = await supabaseAdmin.from('quotation_item').insert(dbItems)

  if (itemsError) {
    try {
      await supabaseAdmin.from('quotation').delete().eq('id', qtn.id)
    } catch (deleteError) {
      console.error('Failed to cleanup orphan quotation', qtn.id, deleteError)
    }
    return internalError(itemsError)
  }

  try {
    const { data: pics } = await supabaseAdmin
      .from('customer_pic')
      .select('no_hp, nama')
      .eq('customer_id', parsed.data.customer_id)
      .eq('is_active', true)
      .limit(1)

    const pic = pics?.[0]
    if (pic?.no_hp) {
      const msg = `Halo *${pic.nama}*,\n\nQuotation *${nomor}* telah diterbitkan untuk Anda oleh RRI.\n\nSilakan cek detailnya di portal customer RRI.\n\nTerima kasih.`
      await sendWhatsapp(pic.no_hp, msg, auth.user?.id)
    }
  } catch (e) {
    console.error('WhatsApp notification failed for quotation', qtn.id, e)
  }

  try {
    await logAudit({ userId: auth.user?.id, action: 'CREATE', tableName: 'quotation', recordId: qtn.id, changes: { nomor, customer_id: parsed.data.customer_id, total_harga: totalHarga, items_count: items.length } })
  } catch (e) {
    console.error('Audit log failed for quotation', qtn.id, e)
  }

  return NextResponse.json({ data: { ...qtn, items: dbItems } }, { status: 201 })
}
