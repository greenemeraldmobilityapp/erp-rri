import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { notFound } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error

  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('customer_prompt_di')
    .select('customer_id, prompt_template, customer!inner(nama)')
    .eq('customer_id', id)
    .eq('is_active', true)
    .single()

  if (error || !data) return notFound('Prompt DI untuk customer ini belum tersedia')

  return NextResponse.json({
    data: {
      customer_id: data.customer_id,
      prompt_template: data.prompt_template,
      customer_nama: (data.customer as unknown as { nama: string }).nama,
    },
  })
}
