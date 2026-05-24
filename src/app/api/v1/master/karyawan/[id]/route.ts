import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

const schema = z.object({
  nik: z.string().optional(),
  nama: z.string().optional(),
  email: z.string().email('Email tidak valid').optional(),
  no_hp: z.string().optional(),
  jabatan_id: z.string().optional(),
  gaji_pokok: z.coerce.number().nonnegative().optional(),
  tanggal_masuk: z.string().optional(),
  is_active: z.boolean().optional(),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('karyawan').select('*, jabatan!jabatan_id(nama)').eq('id', id).single()
  if (error) return internalError(error)
  if (!data) return notFound('Karyawan tidak ditemukan')
  return NextResponse.json({ data })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))
  const { data, error } = await supabaseAdmin.from('karyawan').update({ ...parsed.data, updated_at: new Date().toISOString() }).eq('id', id).select('*, jabatan!jabatan_id(nama)').single()
  if (error) return internalError(error)
  if (!data) return notFound('Karyawan tidak ditemukan')
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const { error } = await supabaseAdmin.from('karyawan').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
