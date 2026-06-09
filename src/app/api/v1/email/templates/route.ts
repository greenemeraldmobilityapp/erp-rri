import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'

const createSchema = z.object({
  name: z.string().min(1, 'Nama template harus diisi'),
  description: z.string().optional(),
  htmlBody: z.string().min(1, 'Body template harus diisi'),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  try {
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: data ?? [] })
  } catch (err) {
    return internalError(err)
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest(parsed.error.issues.map(e => e.message).join(', '))
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .insert({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        html_body: parsed.data.htmlBody,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    return internalError(err)
  }
}
