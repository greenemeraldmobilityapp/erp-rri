import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'

const itemSchema = z.object({
  barang_id: z.string().optional().nullable(),
  nama_barang: z.string().optional().nullable(),
  jumlah: z.coerce.number().int().positive('Jumlah harus > 0'),
  satuan: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('rfq_customer_item')
    .select('*, barang!barang_id(id, nama, kode, satuan)')
    .eq('rfq_customer_id', id)
    .order('created_at', { ascending: true })

  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = itemSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const now = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('rfq_customer_item')
    .insert({
      rfq_customer_id: id,
      barang_id: parsed.data.barang_id ?? null,
      nama_barang: parsed.data.nama_barang ?? null,
      jumlah: parsed.data.jumlah,
      satuan: parsed.data.satuan ?? null,
      keterangan: parsed.data.keterangan ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) return internalError(error)
  return NextResponse.json({ data }, { status: 201 })
}
