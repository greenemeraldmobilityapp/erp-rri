import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { badRequest, internalError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const supplierId = searchParams.get('supplier_id')
  let query = supabaseAdmin.from('supplier_payment').select('*, supplier!supplier_id(nama)').order('created_at', { ascending: false })
  if (supplierId) query = query.eq('supplier_id', supplierId)
  const { data, error } = await query
  if (error) return internalError(error.message)
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const body = await request.json()
  if (!body.purchaseOrderId || !body.supplierId || !body.nominal || !body.tanggalBayar) {
    return badRequest('PO, supplier, nominal, dan tanggal bayar wajib diisi')
  }

  const { data, error } = await supabaseAdmin.from('supplier_payment').insert({
    purchase_order_id: body.purchaseOrderId,
    supplier_id: body.supplierId,
    nominal: body.nominal,
    tanggal_bayar: body.tanggalBayar,
    metode: body.metode ?? 'transfer',
    bukti_transfer: body.buktiTransfer ?? null,
    keterangan: body.keterangan ?? null,
  }).select().single()
  if (error) return internalError(error.message)
  return NextResponse.json({ data })
}
