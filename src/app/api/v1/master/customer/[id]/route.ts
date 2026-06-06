import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

const schema = z.object({
  nama: z.string().min(1, 'Nama customer harus diisi').optional(),
  kode: z.string().min(1, 'Kode customer harus diisi').optional(),
  alamat: z.string().optional(),
  kontak: z.string().optional(),
  terms_of_payment: z.string().optional(),
  payment_term_id: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
  customer_tops: z.array(z.string()).optional(),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request); if (auth.error) return auth.error
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('customer').select('*').eq('id', id).single()
  if (error) return internalError(error)
  if (!data) return notFound('Customer tidak ditemukan')
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
  const { customer_tops, ...updateData } = parsed.data
  const { data, error } = await supabaseAdmin.from('customer').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return internalError(error)
  if (!data) return notFound('Customer tidak ditemukan')

  if (customer_tops) {
    await supabaseAdmin.from('customer_top').delete().eq('customer_id', id)
    const tops = customer_tops.map(top => ({
      id: crypto.randomUUID(),
      customer_id: id,
      top,
    }))
    if (tops.length > 0) {
      const { error: topsError } = await supabaseAdmin.from('customer_top').insert(tops)
      if (topsError) console.error('Failed to sync customer_tops:', topsError)
    }
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const { error } = await supabaseAdmin.from('customer').delete().eq('id', id)
  if (error) return internalError(error)
  return new NextResponse(null, { status: 204 })
}
