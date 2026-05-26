import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'

const schema = z.object({
  customer_id: z.string().min(1, 'Customer harus dipilih'),
  nomor_kontrak: z.string().optional(),
  nama: z.string().min(1, 'Nama kontrak harus diisi'),
  tanggal_mulai: z.string().optional(),
  tanggal_selesai: z.string().optional(),
  tanggal_tanda_tangan: z.string().optional(),
  penandatangan_rri_nama: z.string().optional(),
  penandatangan_rri_jabatan: z.string().optional(),
  penandatangan_customer_nama: z.string().optional(),
  penandatangan_customer_jabatan: z.string().optional(),
  catatan: z.string().optional(),
  is_active: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('kontrak')
    .select('*, customer!customer_id(nama)')
    .order('created_at', { ascending: false })
  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))
  const { data, error } = await supabaseAdmin.from('kontrak')
    .insert(parsed.data)
    .select('*, customer!customer_id(nama)')
    .single()
  if (error) return internalError(error)
  return NextResponse.json({ data }, { status: 201 })
}
