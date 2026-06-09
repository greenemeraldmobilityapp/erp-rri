import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

const updateSchema = z.object({
  name: z.string().min(1, 'Nama template harus diisi').optional(),
  description: z.string().optional(),
  htmlBody: z.string().min(1, 'Body template harus diisi').optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest(parsed.error.issues.map(e => e.message).join(', '))
  }

  try {
    const updateData: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.htmlBody !== undefined) updateData.html_body = parsed.data.htmlBody
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return notFound('Template tidak ditemukan')
      throw error
    }

    if (!data) return notFound('Template tidak ditemukan')

    return NextResponse.json({ data })
  } catch (err) {
    return internalError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params

  try {
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return notFound('Template tidak ditemukan')
      throw error
    }

    if (!data) return notFound('Template tidak ditemukan')

    return NextResponse.json({ data: { id } })
  } catch (err) {
    return internalError(err)
  }
}
