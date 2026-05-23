import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin
    .from('stok')
    .select('*, barang!barang_id(id, nama, kode, satuan, stok_minimum), gudang!gudang_id(nama)')
    .order('barang_id')
  if (error) return internalError(error)
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')
  const { tipe, barang_id, gudang_id, jumlah, keterangan } = body
  if (!tipe || !barang_id || !jumlah) return badRequest('tipe, barang_id, jumlah required')
  if (!['masuk', 'keluar'].includes(tipe)) return badRequest('tipe harus masuk/keluar')

  const { data: stokNow } = await supabaseAdmin.from('stok').select('jumlah').eq('barang_id', barang_id).maybeSingle()
  const saldoSebelum = stokNow?.jumlah ?? 0
  const saldoSesudah = tipe === 'masuk' ? saldoSebelum + Number(jumlah) : saldoSebelum - Number(jumlah)
  if (tipe === 'keluar' && saldoSesudah < 0) return badRequest('Stok tidak mencukupi')

  const mutasi = await supabaseAdmin.from('stok_mutasi').insert({
    barang_id, gudang_id: gudang_id ?? null, tipe, jumlah: Number(jumlah),
    saldo_sebelum: saldoSebelum, saldo_sesudah: saldoSesudah,
    keterangan: keterangan ?? '', ref_jenis: 'manual',
  }).select().single()
  if (mutasi.error) return internalError(mutasi.error)

  if (stokNow) {
    await supabaseAdmin.from('stok').update({ jumlah: saldoSesudah, last_mutasi: new Date().toISOString() }).eq('barang_id', barang_id)
  } else {
    await supabaseAdmin.from('stok').insert({ barang_id, gudang_id: gudang_id ?? null, jumlah: saldoSesudah })
  }

  return NextResponse.json({ data: mutasi.data })
}