import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuthWithRole } from '@/lib/api/role-guard'
import { badRequest } from '@/lib/api/errors'
import { ROLES } from '@/types/role'

const createUserSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  name: z.string().min(1, 'Nama wajib diisi'),
  role: z.enum(ROLES),
})

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     tags: [System]
 *     summary: Daftar semua user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar user
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     tags: [System]
 *     summary: Tambah user baru
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: User created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuthWithRole(request, ['owner', 'admin'])
  if (!auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: users })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuthWithRole(request, ['owner', 'admin'])
  if (!auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON')

  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map((e) => e.message).join(', '))

  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name, role: parsed.data.role },
    },
  })

  if (signUpError || !authData.user) {
    return NextResponse.json({ error: signUpError?.message ?? 'Gagal membuat user' }, { status: 400 })
  }

  const { error: insertError } = await supabaseAdmin.from('users').insert({
    id: authData.user.id,
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    is_active: true,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id: authData.user.id } }, { status: 201 })
}
