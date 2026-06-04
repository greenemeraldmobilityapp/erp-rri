import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/api/supabase-server'

function formatNumber(kodeDokumen: string, tahun: number, bulan: number, counter: number): string {
  const yy = tahun.toString().slice(-2)
  const mm = bulan.toString().padStart(2, '0')
  const padded = String(counter).padStart(4, '0')
  return `RRI-${kodeDokumen}-${yy}-${mm}-${padded}`
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const kode = searchParams.get('kode')
  if (!kode) {
    return NextResponse.json({ error: 'Parameter "kode" wajib diisi' }, { status: 400 })
  }

  const now = new Date()
  const tahun = now.getFullYear()
  const bulan = now.getMonth() + 1

  const { data } = await supabaseAdmin
    .from('document_counter')
    .select('counter')
    .eq('kode_dokumen', 'GLOBAL')
    .eq('tahun', tahun)
    .eq('bulan', bulan)
    .maybeSingle()

  const nextCounter = data ? data.counter + 1 : 1
  const nomor = formatNumber(kode, tahun, bulan, nextCounter)

  return NextResponse.json({ nomor })
}
