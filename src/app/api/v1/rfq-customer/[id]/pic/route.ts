import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'

const picSchema = z.object({
  customer_pic_id: z.string().min(1, 'PIC Customer harus dipilih'),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('rfq_customer_pic')
    .select('*, customer_pic!customer_pic_id(id, nama, jabatan, no_hp, email)')
    .eq('rfq_customer_id', id)
    .order('assigned_at', { ascending: false })

  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = picSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const { data, error } = await supabaseAdmin
    .from('rfq_customer_pic')
    .insert({
      rfq_customer_id: id,
      customer_pic_id: parsed.data.customer_pic_id,
    })
    .select()
    .single()

  if (error) return internalError(error)
  return NextResponse.json({ data }, { status: 201 })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const picId = searchParams.get('picId')
  if (!picId) return badRequest('picId diperlukan')

  const { error } = await supabaseAdmin
    .from('rfq_customer_pic')
    .delete()
    .eq('id', picId)
    .eq('rfq_customer_id', id)

  if (error) return internalError(error)
  return NextResponse.json({ message: 'PIC berhasil dihapus' })
}
