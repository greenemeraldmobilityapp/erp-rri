import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { searchMarketplacePlaywright, getMockResults, saveSearchResults, SearchResult } from '@/lib/ai/search-harga'

const schema = z.object({ query: z.string().min(1, 'Query harus diisi') })

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  let results: SearchResult[] = []
  try {
    results = await searchMarketplacePlaywright(parsed.data.query)
  } catch { /* fallback to mock */ }

  if (results.length === 0) {
    results = getMockResults(parsed.data.query)
  }

  try {
    const historyId = await saveSearchResults(auth.user!.id, parsed.data.query, results)
    return NextResponse.json({ data: { history_id: historyId, query: parsed.data.query, results } })
  } catch (err) {
    return internalError(err instanceof Error ? err.message : 'Gagal menyimpan')
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { data, error } = await supabaseAdmin.from('ai_search_history')
    .select('*, ai_search_result(*)').eq('user_id', auth.user!.id).order('created_at', { ascending: false }).limit(20)
  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}
