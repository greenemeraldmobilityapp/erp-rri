import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { internalError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('kontrak_item')
    .select('*, barang!barang_id(kode, nama, satuan)')
    .eq('kontrak_id', id)
    .order('created_at', { ascending: true })
  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}
