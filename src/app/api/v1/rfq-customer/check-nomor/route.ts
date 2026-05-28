import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const value = searchParams.get('value')
  const excludeId = searchParams.get('excludeId')

  if (!value || value.trim() === '') {
    return badRequest('Parameter value diperlukan')
  }

  let query = supabaseAdmin
    .from('rfq_customer')
    .select('nomor')
    .eq('nomor_rfq_customer', value.trim())

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) return internalError(error)

  if (data) {
    return NextResponse.json({
      data: {
        available: false,
        usedBy: data.nomor,
      },
    })
  }

  return NextResponse.json({
    data: {
      available: true,
      usedBy: null,
    },
  })
}
