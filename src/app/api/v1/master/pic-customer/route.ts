import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'

const schema = z.object({
  customer_id: z.string().min(1, 'Customer harus dipilih'),
  nama: z.string().min(1, 'Nama PIC harus diisi'),
  jenis_kelamin: z.enum(['L', 'P'], { message: 'Jenis kelamin harus dipilih' }),
  jabatan: z.string().optional(),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  no_telp: z.string().optional(),
  keterangan: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('customer_pic').select('*, customer!customer_id(nama)').order('nama')
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
  const { data, error } = await supabaseAdmin.from('customer_pic').insert(parsed.data).select('*, customer!customer_id(nama)').single()
  if (error) return internalError(error)
  return NextResponse.json({ data }, { status: 201 })
}
