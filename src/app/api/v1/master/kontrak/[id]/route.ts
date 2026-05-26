import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

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
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('kontrak')
    .select('*, customer!customer_id(nama)')
    .eq('id', id)
    .single()
  if (error) return internalError(error)
  if (!data) return notFound('Kontrak tidak ditemukan')
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
  const { data, error } = await supabaseAdmin.from('kontrak')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, customer!customer_id(nama)')
    .single()
  if (error) return internalError(error)
  if (!data) return notFound('Kontrak tidak ditemukan')
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const { error } = await supabaseAdmin.from('kontrak').delete().eq('id', id)
  if (error) return internalError(error)
  return NextResponse.json({ message: 'Berhasil dihapus' })
}
