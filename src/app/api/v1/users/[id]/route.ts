import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuthWithRole } from '@/lib/api/role-guard'
import { badRequest, notFound } from '@/lib/api/errors'
import { ROLES } from '@/types/role'

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(ROLES).optional(),
  is_active: z.boolean().optional(),
})

/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     tags: [System]
 *     summary: Detail user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User detail
 *   put:
 *     tags: [System]
 *     summary: Update user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     tags: [System]
 *     summary: Nonaktifkan user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User dinonaktifkan
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuthWithRole(request, ['owner', 'admin'])
  if (!auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, is_active, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) return internalError(error)

  if (!user) return notFound('User tidak ditemukan')
  return NextResponse.json({ data: user })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuthWithRole(request, ['owner', 'admin'])
  if (!auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON')

  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map((e) => e.message).join(', '))

  const { error } = await supabaseAdmin
    .from('users')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: { id } })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuthWithRole(request, ['owner', 'admin'])
  if (!auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const { error } = await supabaseAdmin
    .from('users')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: { id, is_active: false } })
}
