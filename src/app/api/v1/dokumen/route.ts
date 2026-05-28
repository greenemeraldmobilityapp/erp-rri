import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { internalError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customerId')
  const modul = searchParams.get('modul')
  const search = searchParams.get('search')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  let query = supabaseAdmin
    .from('all_documents')
    .select('*', { count: 'exact' })

  if (customerId) {
    query = query.eq('customerId', customerId)
  }

  if (modul) {
    query = query.eq('modul', modul)
  }

  if (search) {
    query = query.ilike('fileName', `%${search}%`)
  }

  if (startDate) {
    query = query.gte('uploadedAt', startDate)
  }

  if (endDate) {
    query = query.lte('uploadedAt', `${endDate}T23:59:59.999Z`)
  }

  query = query.order('uploadedAt', { ascending: false })

  const { data, error, count } = await query

  if (error) return internalError(error)

  return NextResponse.json({
    data: data ?? [],
    count: count ?? 0,
  })
}
