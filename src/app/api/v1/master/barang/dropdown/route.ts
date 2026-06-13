import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { internalError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { data, error } = await supabaseAdmin
    .from('barang')
    .select('id, nama, kode, satuan')
    .eq('is_active', true)
    .order('nama', { ascending: true })

  if (error) return internalError(error)

  return NextResponse.json({ data: data ?? [] })
}
