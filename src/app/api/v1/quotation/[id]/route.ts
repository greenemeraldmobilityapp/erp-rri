import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

const itemSchema = z.object({
  barang_id: z.string().optional().nullable(),
  specification: z.string().optional().nullable(),
  justification: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  satuan: z.string().optional().nullable(),
  jumlah: z.coerce.number().int().positive(),
  harga_satuan: z.coerce.number().nonnegative(),
  diskon: z.coerce.number().nonnegative().optional().nullable(),
  keterangan: z.string().optional().nullable(),
})

const schema = z.object({
  customer_id: z.string().min(1).optional(),
  rfq_id: z.string().optional().nullable(),
  referensi: z.string().optional().nullable(),
  lampiran: z.string().optional().nullable(),
  perihal: z.string().optional(),
  pic_customer_id: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  tanggal: z.string().optional(),
  status: z.string().optional(),
  masa_berlaku: z.string().optional().nullable(),
  ppn_rate: z.coerce.number().nonnegative().optional(),
  ppn_enabled: z.coerce.boolean().optional(),
  keterangan: z.string().optional().nullable(),
  items: z.array(itemSchema).optional(),
})

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request); if (auth.error) return auth.error
  const { id } = await params

  const { data: qtn, error: qtnError } = await supabaseAdmin
    .from('quotation')
    .select('*')
    .eq('id', id)
    .single()

  if (qtnError) return internalError(qtnError)
  if (!qtn) return notFound('Quotation tidak ditemukan')

  let customer = null
  if (qtn.customer_id) {
    const { data: c } = await supabaseAdmin
      .from('customer')
      .select('id, nama, kode')
      .eq('id', qtn.customer_id)
      .single()
    customer = c
  }

  let rfqCustomer = null
  if (qtn.rfq_id) {
    const { data: r } = await supabaseAdmin
      .from('rfq_customer')
      .select('nomor')
      .eq('id', qtn.rfq_id)
      .single()
    if (r) rfqCustomer = r
  }

  const { data: items } = await supabaseAdmin
    .from('quotation_item')
    .select('*')
    .eq('quotation_id', id)
    .order('created_at', { ascending: true })

  const barangIds = [...new Set(items?.filter(i => i.barang_id).map(i => i.barang_id) ?? [])]
  let barangMap = new Map<string, { id: string; nama: string; kode: string; satuan: string; spesifikasi?: string; justification?: string; image_url?: string }>()
  if (barangIds.length > 0) {
    const { data: barangList } = await supabaseAdmin
      .from('barang')
      .select('id, nama, kode, satuan, spesifikasi, justification, image_url')
      .in('id', barangIds)
    barangMap = new Map(barangList?.map(b => [b.id, b]) ?? [])
  }

  let rfqItemNames: string[] = []
  if (qtn.rfq_id) {
    const { data: rfqItems } = await supabaseAdmin
      .from('rfq_customer_item')
      .select('nama_barang')
      .eq('rfq_customer_id', qtn.rfq_id)
      .order('created_at', { ascending: true })
    rfqItemNames = rfqItems?.map(i => i.nama_barang) ?? []
  }

  const itemsWithBarang = (items ?? []).map((item, idx) => ({
    ...item,
    barang: item.barang_id ? (barangMap.get(item.barang_id) ?? null) : null,
    nama_barang: idx < rfqItemNames.length ? rfqItemNames[idx] : null,
  }))

  return NextResponse.json({ data: { ...qtn, customer, rfq_customer: rfqCustomer, items: itemsWithBarang } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const updateData: Record<string, unknown> = {}
  if (parsed.data.customer_id !== undefined) updateData.customer_id = parsed.data.customer_id
  if (parsed.data.rfq_id !== undefined) updateData.rfq_id = parsed.data.rfq_id ?? null
  if (parsed.data.referensi !== undefined) updateData.referensi = parsed.data.referensi ?? null
  if (parsed.data.lampiran !== undefined) updateData.lampiran = parsed.data.lampiran ?? null
  if (parsed.data.perihal !== undefined) updateData.perihal = parsed.data.perihal
  if (parsed.data.pic_customer_id !== undefined) updateData.pic_customer_id = parsed.data.pic_customer_id ?? null
  if (parsed.data.alamat !== undefined) updateData.alamat = parsed.data.alamat ?? null
  if (parsed.data.tanggal !== undefined) updateData.tanggal = parsed.data.tanggal
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status
  if (parsed.data.masa_berlaku !== undefined) {
    updateData.masa_berlaku = parsed.data.masa_berlaku ?? null
    if (parsed.data.tanggal || parsed.data.masa_berlaku) {
      const tgl = parsed.data.tanggal ? new Date(parsed.data.tanggal) : new Date()
      updateData.tanggal_berlaku_sampai = parsed.data.masa_berlaku
        ? calcTanggalBerlaku(parsed.data.masa_berlaku, tgl)
        : null
    }
  }
  if (parsed.data.ppn_rate !== undefined) updateData.ppn_rate = parsed.data.ppn_rate
  if (parsed.data.ppn_enabled !== undefined) updateData.ppn_enabled = parsed.data.ppn_enabled
  if (parsed.data.keterangan !== undefined) updateData.keterangan = parsed.data.keterangan ?? null

  updateData.updated_at = new Date().toISOString()

  if (parsed.data.items) {
    const items = parsed.data.items.map(item => {
      const totalHarga = item.jumlah * item.harga_satuan
      return {
        quotation_id: id,
        barang_id: item.barang_id,
        specification: item.specification ?? null,
        justification: item.justification ?? null,
        image_url: item.image_url ?? null,
        satuan: item.satuan ?? null,
        jumlah: item.jumlah,
        harga_satuan: item.harga_satuan,
        diskon: item.diskon ?? 0,
        total_harga: totalHarga,
        keterangan: item.keterangan ?? null,
      }
    })
    const totalHarga = items.reduce((sum, i) => sum + (i.total_harga ?? 0), 0)
    updateData.total_harga = totalHarga

    const ppnRate = parsed.data.ppn_rate ?? 0.11
    await supabaseAdmin.from('quotation_item').delete().eq('quotation_id', id)

    const dbItems = items.map(item => ({
      ...item,
      ppn_per_item: (parsed.data.ppn_enabled ?? true) ? (item.total_harga ?? 0) * ppnRate : 0,
    }))

    const { error: itemsError } = await supabaseAdmin.from('quotation_item').insert(dbItems)
    if (itemsError) return internalError(itemsError)
  }

  const { data, error } = await supabaseAdmin
    .from('quotation')
    .update(updateData)
    .eq('id', id)
    .select('*, customer!customer_id(id, nama, kode)')
    .single()

  if (error) return internalError(error)
  if (!data) return notFound('Quotation tidak ditemukan')

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params

  await supabaseAdmin.from('quotation_item').delete().eq('quotation_id', id)

  const { error } = await supabaseAdmin.from('quotation').delete().eq('id', id)
  if (error) return internalError(error)

  return NextResponse.json({ message: 'Quotation berhasil dihapus' })
}
