import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { getUnmappedRfqItems } from '@/lib/utils/barang-auto-create'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request); if (auth.error) return auth.error
  const { id } = await params

  const items = await getUnmappedRfqItems(id)

  const { data: kategori } = await supabaseAdmin
    .from('kategori_barang')
    .select('id, nama')
    .eq('is_active', true)
    .order('nama')

  return NextResponse.json({
    data: {
      has_unmapped: items.length > 0,
      items,
      kategori_options: (kategori ?? []).map((k: { id: string; nama: string }) => ({ value: k.id, label: k.nama })),
    },
  })
}
