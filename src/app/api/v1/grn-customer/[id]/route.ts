import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request); if (auth.error) return auth.error
  const { id } = await params
  const { data: grn, error } = await supabaseAdmin.from('grn_customer').select('*, customer!customer_id(nama, kode), gudang!gudang_id(nama), delivery_order!delivery_order_id(nomor), retur_penjualan!retur_penjualan_id(nomor)').eq('id', id).single()
  if (error) return internalError(error)
  if (!grn) return notFound('GRN tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('grn_customer_item').select('*, barang!barang_id(nama, kode, satuan)').eq('grn_customer_id', id).order('urutan')
  return NextResponse.json({ data: { ...grn, items: items ?? [] } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const upd: Record<string, unknown> = {}
  if (body.status) upd.status = body.status; if (body.keterangan !== undefined) upd.keterangan = body.keterangan
  upd.updated_at = new Date().toISOString()
  const { data, error } = await supabaseAdmin.from('grn_customer').update(upd).eq('id', id).select().single()
  if (error) return internalError(error); if (!data) return notFound('GRN tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('grn_customer_item').delete().eq('grn_customer_id', id)
    const now = new Date().toISOString()
    const items = body.items.map((i: { barang_id: string; jumlah: number; nama_barang?: string; kode_barang?: string; satuan?: string; urutan?: number; keterangan?: string }, idx: number) => ({
      grn_customer_id: id, barang_id: i.barang_id, jumlah: i.jumlah,
      nama_barang: i.nama_barang ?? null, kode_barang: i.kode_barang ?? null, satuan: i.satuan ?? null,
      urutan: i.urutan ?? idx + 1, keterangan: i.keterangan ?? null, created_at: now, updated_at: now,
    }))
    const { error: ie } = await supabaseAdmin.from('grn_customer_item').insert(items)
    if (ie) return internalError(ie)
  }

  // Auto-create stok_mutasi when status becomes completed
  if (body.status === 'completed' && data.status !== 'completed') {
    if (!data.gudang_id) return badRequest('Gudang harus diisi sebelum menyelesaikan Retur Barang (GRN)')
    const { data: itemsData } = await supabaseAdmin.from('grn_customer_item').select('*, barang!barang_id(nama)').eq('grn_customer_id', id)
    let returNomor = ''
    if (data.retur_penjualan_id) {
      const { data: retur } = await supabaseAdmin.from('retur_penjualan').select('nomor').eq('id', data.retur_penjualan_id).maybeSingle()
      if (retur) returNomor = retur.nomor
    }
    const gudangId = data.gudang_id
    if (itemsData) {
      for (const item of itemsData) {
        const { data: existingStok } = await supabaseAdmin.from('stok').select('id, jumlah').eq('barang_id', item.barang_id).eq('gudang_id', gudangId).maybeSingle()
        const saldoSebelum = existingStok?.jumlah ?? 0
        const saldoSesudah = saldoSebelum + item.jumlah

        await supabaseAdmin.from('stok_mutasi').insert({
          barang_id: item.barang_id, gudang_id: gudangId, tipe: 'masuk', jumlah: item.jumlah,
          saldo_sebelum: saldoSebelum, saldo_sesudah: saldoSesudah,
          ref_jenis: 'grn_customer', ref_id: id,
          keterangan: `Retur Barang (GRN) ${data.nomor}${returNomor ? ` (Retur: ${returNomor})` : ''} - ${item.barang?.nama ?? ''}`,
          created_at: new Date().toISOString(),
        })

        if (existingStok) {
          await supabaseAdmin.from('stok').update({ jumlah: saldoSesudah, last_mutasi: new Date().toISOString() }).eq('id', existingStok.id)
        } else {
          await supabaseAdmin.from('stok').insert({
            barang_id: item.barang_id, gudang_id: gudangId, jumlah: saldoSesudah,
            last_mutasi: new Date().toISOString(),
          })
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
  await supabaseAdmin.from('grn_customer_item').delete().eq('grn_customer_id', id)
  const { error } = await supabaseAdmin.from('grn_customer').delete().eq('id', id)
  if (error) return internalError(error)
  return new NextResponse(null, { status: 204 })
}
