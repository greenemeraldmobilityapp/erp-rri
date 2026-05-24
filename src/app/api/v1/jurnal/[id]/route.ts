import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: jurnal, error } = await supabaseAdmin.from('jurnal').select('*').eq('id', id).single()
  if (error) return internalError(error)
  if (!jurnal) return notFound('Jurnal tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('jurnal_item').select('*, akun_id!akun_id(id, kode, nama)').eq('jurnal_id', id)
  return NextResponse.json({ data: { ...jurnal, items: items ?? [] } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const upd: Record<string, unknown> = {}
  if (body.status) upd.status = body.status
  if (body.keterangan !== undefined) upd.keterangan = body.keterangan
  upd.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin.from('jurnal').update(upd).eq('id', id).select().single()
  if (error) return internalError(error)
  if (!data) return notFound('Jurnal tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('jurnal_item').delete().eq('jurnal_id', id)
    const now = new Date().toISOString()
    const items = body.items.map((item: { akun_id: string; debit: number; credit: number; keterangan?: string }) => ({
      jurnal_id: id, akun_id: item.akun_id, debit: item.debit, credit: item.credit,
      keterangan: item.keterangan ?? null, created_at: now, updated_at: now,
    }))
    const { error: itemsError } = await supabaseAdmin.from('jurnal_item').insert(items)
    if (itemsError) return internalError(itemsError)
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('jurnal_item').delete().eq('jurnal_id', id)
  const { error } = await supabaseAdmin.from('jurnal').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
