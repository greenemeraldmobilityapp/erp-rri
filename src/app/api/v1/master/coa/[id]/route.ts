import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

const schema = z.object({
  kode: z.string().min(1, 'Kode COA harus diisi').optional(),
  nama: z.string().min(1, 'Nama COA harus diisi').optional(),
  jenis: z.enum(['Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban'], { message: 'Jenis tidak valid' }).optional(),
  induk_id: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('coa').select('*, coa!induk_id(nama)').eq('id', id).single()
  if (error) return internalError(error)
  if (!data) return notFound('COA tidak ditemukan')
  return NextResponse.json({ data: { ...data, induk: data.coa?.[0] || null, coa: undefined } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))
  const { data, error } = await supabaseAdmin.from('coa').update({ ...parsed.data, updated_at: new Date().toISOString() }).eq('id', id).select('*, coa!induk_id(nama)').single()
  if (error) return internalError(error)
  if (!data) return notFound('COA tidak ditemukan')
  return NextResponse.json({ data: { ...data, induk: data.coa?.[0] || null, coa: undefined } })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const { error } = await supabaseAdmin.from('coa').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
