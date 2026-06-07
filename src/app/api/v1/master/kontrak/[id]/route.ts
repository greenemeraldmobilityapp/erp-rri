import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

const itemSchema = z.object({
  barang_id: z.string().nullable().optional(),
  kode_barang: z.string(),
  nama_barang: z.string(),
  satuan: z.string(),
  harga_satuan: z.number(),
})

const schema = z.object({
  customer_id: z.string().optional(),
  nomor_kontrak: z.string().optional(),
  nama: z.string().optional(),
  tanggal_mulai: z.string().optional(),
  tanggal_selesai: z.string().optional(),
  tanggal_tanda_tangan: z.string().optional(),
  penandatangan_rri_nama: z.string().optional(),
  penandatangan_rri_jabatan: z.string().optional(),
  penandatangan_customer_nama: z.string().optional(),
  penandatangan_customer_jabatan: z.string().optional(),
  catatan: z.string().optional(),
  is_active: z.boolean().optional(),
  items: z.array(itemSchema).optional(),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request); if (auth.error) return auth.error
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('kontrak')
    .select('*, customer!customer_id(nama)')
    .eq('id', id)
    .single()
  if (error) return internalError(error)
  if (!data) return notFound('Kontrak tidak ditemukan')
  const today = new Date().toISOString().split('T')[0]
  const kontrak = {
    ...data,
    is_active: !data.tanggal_selesai || data.tanggal_selesai >= today,
  }
  const { data: items } = await supabaseAdmin.from('kontrak_item').select('*').eq('kontrak_id', id)
  return NextResponse.json({ data: { ...kontrak, items: items ?? [] } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))
  const { items, ...headerData } = parsed.data

  const { data, error } = await supabaseAdmin.from('kontrak')
    .update({ ...headerData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, customer!customer_id(nama)')
    .single()
  if (error) return internalError(error)
  if (!data) return notFound('Kontrak tidak ditemukan')

  if (items) {
    await supabaseAdmin.from('kontrak_item').delete().eq('kontrak_id', id)
    if (items.length > 0) {
      const now = new Date().toISOString()
      const rows = items.map(item => ({
        id: crypto.randomUUID(),
        kontrak_id: id,
        barang_id: item.barang_id ?? null,
        kode_barang: item.kode_barang,
        nama_barang: item.nama_barang,
        nama_kontrak: data.nama,
        satuan: item.satuan,
        harga_satuan: item.harga_satuan,
        ppn_include: false,
        created_at: now,
        updated_at: now,
      }))
      const { error: itemsError } = await supabaseAdmin.from('kontrak_item').insert(rows)
      if (itemsError) return internalError(itemsError)

      for (const row of rows) {
        if (!row.barang_id || !data.tanggal_mulai) continue
        const { data: existingKontrakItems } = await supabaseAdmin
          .from('kontrak_item')
          .select('kontrak_id')
          .eq('barang_id', row.barang_id)
          .neq('kontrak_id', id)

        let shouldUpdate = true
        if (existingKontrakItems && existingKontrakItems.length > 0) {
          const existingKontrakIds = existingKontrakItems.map(k => k.kontrak_id)
          const { data: latestLinkedKontrak } = await supabaseAdmin
            .from('kontrak')
            .select('tanggal_mulai')
            .in('id', existingKontrakIds)
            .order('tanggal_mulai', { ascending: false })
            .limit(1)
            .single()

          if (latestLinkedKontrak?.tanggal_mulai) {
            shouldUpdate = new Date(data.tanggal_mulai) >= new Date(latestLinkedKontrak.tanggal_mulai)
          }
        }

        if (shouldUpdate) {
          await supabaseAdmin.from('barang')
            .update({ harga_jual_default: row.harga_satuan })
            .eq('id', row.barang_id)
        }
      }
    }
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const { error } = await supabaseAdmin.from('kontrak').delete().eq('id', id)
  if (error) return internalError(error)
  return new NextResponse(null, { status: 204 })
}
