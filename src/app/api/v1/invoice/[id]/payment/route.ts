import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'
import { generatePaymentJournal } from '@/lib/auto-jurnal'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request); if (auth.error) return auth.error
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('invoice_payment')
    .select('*')
    .eq('invoice_id', id)
    .order('created_at', { ascending: false })
  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  if (!body.amount || body.amount <= 0) return badRequest('Jumlah pembayaran harus lebih dari 0')
  if (!body.metode) return badRequest('Metode pembayaran harus diisi')

  const { data: inv } = await supabaseAdmin
    .from('invoice')
    .select('id, status, nomor')
    .eq('id', id)
    .single()
  if (!inv) return notFound('Invoice tidak ditemukan')

  const now = new Date().toISOString()
  const tanggal = body.tanggal ? new Date(body.tanggal).toISOString() : now

  const { data: payment, error: payErr } = await supabaseAdmin
    .from('invoice_payment')
    .insert({
      invoice_id: id,
      tanggal,
      amount: body.amount,
      metode: body.metode,
      keterangan: body.keterangan ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()
  if (payErr) return internalError(payErr)

  const { data: allPayments } = await supabaseAdmin
    .from('invoice_payment')
    .select('amount')
    .eq('invoice_id', id)
  const totalPaid = (allPayments ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)

  const { data: items } = await supabaseAdmin
    .from('invoice_item')
    .select('harga, jumlah, diskon, ppn, pph')
    .eq('invoice_id', id)
  const totalDpp = (items ?? []).reduce((s: number, i: { harga: number; jumlah: number; diskon: number | null }) => s + (i.harga * i.jumlah - (i.diskon ?? 0)), 0)
  const totalPPN = (items ?? []).reduce((s: number, i: { ppn: number | null }) => s + (i.ppn ?? 0), 0)
  const totalPPh = (items ?? []).reduce((s: number, i: { pph: number | null }) => s + (i.pph ?? 0), 0)
  const grandTotal = totalDpp + totalPPN - totalPPh

  let newStatus = inv.status
  if (totalPaid >= grandTotal) {
    newStatus = 'paid'
  } else if (totalPaid > 0) {
    newStatus = 'partial'
  }

  if (newStatus !== inv.status) {
    await supabaseAdmin.from('invoice').update({ status: newStatus, updated_at: now }).eq('id', id)
  }

  await generatePaymentJournal(id, payment.id, body.amount, tanggal)

  return NextResponse.json({ data: payment }, { status: 201 })
}
