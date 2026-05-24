import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { notFound, internalError } from '@/lib/api/errors'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data, error } = await supabaseAdmin.from('supplier_payment').select('*, supplier!supplier_id(nama), purchase_order!purchase_order_id(nomor)').eq('id', id).single()
  if (error || !data) return notFound('Pembayaran tidak ditemukan')
  return NextResponse.json({ data })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}
  if (body.nominal) updates.nominal = body.nominal
  if (body.tanggalBayar) updates.tanggal_bayar = body.tanggalBayar
  if (body.metode) updates.metode = body.metode
  if (body.buktiTransfer !== undefined) updates.bukti_transfer = body.buktiTransfer
  if (body.keterangan !== undefined) updates.keterangan = body.keterangan

  const { data, error } = await supabaseAdmin.from('supplier_payment').update(updates).eq('id', id).select().single()
  if (error) return internalError(error.message)
  if (!data) return notFound('Pembayaran tidak ditemukan')
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const { error } = await supabaseAdmin.from('supplier_payment').delete().eq('id', id)
  if (error) return internalError(error.message)
  return NextResponse.json({ success: true })
}
