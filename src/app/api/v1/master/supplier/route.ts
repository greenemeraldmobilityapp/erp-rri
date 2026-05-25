import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'

const schema = z.object({
  nama: z.string().min(1, 'Nama supplier harus diisi'),
  kode: z.string().min(1, 'Kode supplier harus diisi'),
  nama_toko: z.string().optional(),
  link_toko: z.string().optional(),
  no_rekening: z.string().optional(),
  kontak: z.string().optional(),
  terms_of_payment: z.string().optional(),
  is_marketplace: z.boolean().default(false),
  is_active: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('supplier').select('*').order('nama')
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
  const { data, error } = await supabaseAdmin.from('supplier').insert(parsed.data).select().single()
  if (error) return internalError(error)
  return NextResponse.json({ data }, { status: 201 })
}
