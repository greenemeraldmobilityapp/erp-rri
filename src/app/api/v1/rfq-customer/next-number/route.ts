import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { internalError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const now = new Date()
  const tahun = now.getFullYear()
  const bulan = now.getMonth() + 1
  const yy = tahun.toString().slice(-2)
  const mm = bulan.toString().padStart(2, '0')

  const { data, error } = await supabaseAdmin
    .from('document_counter')
    .select('counter')
    .eq('kode_dokumen', 'RFQC')
    .eq('tahun', tahun)
    .eq('bulan', bulan)
    .maybeSingle()

  if (error) return internalError(error)

  const counter = ((data?.counter ?? 0) + 1).toString().padStart(4, '0')
  const nomor = `RRI-RFQC-${yy}-${mm}-${counter}`

  return NextResponse.json({ data: { nomor } })
}
