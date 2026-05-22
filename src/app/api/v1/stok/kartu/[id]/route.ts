import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: barang, error: brgErr } = await supabaseAdmin.from('barang').select('id, nama, kode, satuan').eq('id', id).single()
  if (brgErr || !barang) return notFound('Barang tidak ditemukan')
  const { data: mutasi, error: mutErr } = await supabaseAdmin
    .from('stok_mutasi')
    .select('*')
    .eq('barang_id', id)
    .order('created_at', { ascending: false })
  if (mutErr) return internalError(mutErr)
  const { data: stokNow } = await supabaseAdmin.from('stok').select('jumlah').eq('barang_id', id).maybeSingle()
  return NextResponse.json({ data: { barang, stokSaatIni: stokNow?.jumlah ?? 0, mutasi: mutasi ?? [] } })
}
