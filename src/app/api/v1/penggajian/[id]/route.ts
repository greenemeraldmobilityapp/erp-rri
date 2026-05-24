import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('penggajian').select('*, karyawan!karyawan_id(nama, nik, jabatan_id, gaji_pokok)').eq('id', id).single()
  if (error) return internalError(error)
  if (!data) return notFound()
  return NextResponse.json({ data })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const upd: Record<string, unknown> = {}
  if (body.status) upd.status = body.status
  if (body.gaji_pokok !== undefined) { upd.gaji_pokok = body.gaji_pokok; upd.gaji_bersih = Number(body.gaji_pokok) + Number(body.tunjangan ?? 0) - Number(body.potongan ?? 0) }
  if (body.tunjangan !== undefined) { upd.tunjangan = body.tunjangan; upd.gaji_bersih = Number(body.gaji_pokok ?? 0) + Number(body.tunjangan) - Number(body.potongan ?? 0) }
  if (body.potongan !== undefined) { upd.potongan = body.potongan; upd.gaji_bersih = Number(body.gaji_pokok ?? 0) + Number(body.tunjangan ?? 0) - Number(body.potongan) }
  if (body.keterangan !== undefined) upd.keterangan = body.keterangan
  if (body.tanggal_pembayaran !== undefined) upd.tanggal_pembayaran = body.tanggal_pembayaran
  upd.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin.from('penggajian').update(upd).eq('id', id).select().single()
  if (error) return internalError(error)
  if (!data) return notFound()
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const { error } = await supabaseAdmin.from('penggajian').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
