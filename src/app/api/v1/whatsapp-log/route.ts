import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { internalError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const cari = searchParams.get('cari')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('whatsapp_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (cari) query = query.ilike('recipient', `%${cari}%`)

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) return internalError(error)

  return NextResponse.json({
    data: {
      items: data ?? [],
      count: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
}
