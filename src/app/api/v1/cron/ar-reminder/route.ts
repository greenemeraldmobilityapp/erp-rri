import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { sendWhatsapp } from '@/lib/utils/whatsapp'

function parseTopDays(top: string): number {
  const match = top.match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

function daysBetween(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export async function GET(req: Request) {
  const cronToken = process.env.CRON_SECRET_TOKEN
  if (cronToken) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  const { data: invoices, error } = await supabaseAdmin
    .from('invoice')
    .select('id, nomor, customer_id, tanggal, top, status, is_active')
    .in('status', ['sent', 'overdue'])
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sent: string[] = []

  for (const inv of invoices ?? []) {
    const invDate = new Date(inv.tanggal)
    const topDays = parseTopDays(inv.top)
    const dueDate = new Date(invDate)
    dueDate.setDate(dueDate.getDate() + topDays)
    dueDate.setHours(0, 0, 0, 0)

    const diff = daysBetween(dueDate, today)

    let reminderType: string | null = null
    let message: string | null = null

    if (diff === -7) {
      reminderType = 'H-7'
      message = `Yth. Customer RRI,\n\nKami ingatkan bahwa faktur *${inv.nomor}* akan jatuh tempo dalam 7 hari (${dueDate.toLocaleDateString('id-ID')}).\n\nHarap persiapkan pembayaran.\n\nTerima kasih.`
    } else if (diff === -3) {
      reminderType = 'H-3'
      message = `Yth. Customer RRI,\n\nKami ingatkan bahwa faktur *${inv.nomor}* akan jatuh tempo dalam 3 hari (${dueDate.toLocaleDateString('id-ID')}).\n\nHarap segera lakukan pembayaran.\n\nTerima kasih.`
    } else if (diff === 1) {
      reminderType = 'H+1'
      message = `Yth. Customer RRI,\n\nFaktur *${inv.nomor}* telah melewati jatuh tempo (${dueDate.toLocaleDateString('id-ID')}).\n\nMohon segera dilakukan pembayaran.\n\nTerima kasih.`
    } else if (diff === 7) {
      reminderType = 'H+7'
      message = `Yth. Customer RRI,\n\nFaktur *${inv.nomor}* telah melewati jatuh tempo 7 hari yang lalu (${dueDate.toLocaleDateString('id-ID')}).\n\nMohon segera dilakukan pembayaran untuk menghindari tindakan lebih lanjut.\n\nTerima kasih.`
    }

    if (reminderType && message) {
      const { data: pics } = await supabaseAdmin
        .from('customer_pic')
        .select('no_hp, nama')
        .eq('customer_id', inv.customer_id)
        .eq('is_active', true)
        .limit(1)

      const pic = pics?.[0]
      if (pic?.no_hp) {
        const result = await sendWhatsapp(pic.no_hp, message)
        sent.push(`${inv.nomor} (${reminderType}): ${result.success ? 'OK' : 'FAILED'}`)
      }
    }
  }

  return NextResponse.json({
    invoices_checked: invoices?.length ?? 0,
    reminders_sent: sent.length,
    details: sent,
  })
}
