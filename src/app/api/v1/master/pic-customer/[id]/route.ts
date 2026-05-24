import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

const schema = z.object({
  customer_id: z.string().optional(),
  nama: z.string().min(1, 'Nama PIC harus diisi').optional(),
  jabatan: z.string().optional(),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  no_telp: z.string().optional(),
  keterangan: z.string().optional(),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('customer_pic').select('*, customer!customer_id(nama)').eq('id', id).single()
  if (error) return internalError(error)
  if (!data) return notFound('PIC Customer tidak ditemukan')
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
  const { data, error } = await supabaseAdmin.from('customer_pic').update({ ...parsed.data, updated_at: new Date().toISOString() }).eq('id', id).select('*, customer!customer_id(nama)').single()
  if (error) return internalError(error)
  if (!data) return notFound('PIC Customer tidak ditemukan')
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const { error } = await supabaseAdmin.from('customer_pic').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
