import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { sendWhatsapp, getOwnerWhatsapp } from '@/lib/utils/whatsapp'
import { formatDateWIB } from '@/lib/utils/timezone'

function parseTopDays(top: string): number {
  const match = top.match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

function daysBetween(dueDate: Date, today: Date): number {
  const ms = dueDate.getTime() - today.getTime()
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

  // Fetch invoices with customer name via Supabase join
  const { data: invoices, error } = await supabaseAdmin
    .from('invoice')
    .select(`
      id, 
      nomor, 
      customer_id, 
      tanggal, 
      top, 
      status, 
      customer!customer_id(nama)
    `)
    .neq('status', 'paid')
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch invoice items separately (no FK constraint in DB)
  const invoiceIds = invoices?.map(inv => inv.id) ?? []
  const { data: items } = await supabaseAdmin
    .from('invoice_item')
    .select('invoice_id, harga, jumlah, diskon')
    .in('invoice_id', invoiceIds)

  // Build a map of invoice_id -> total
  const totalMap: Record<string, number> = {}
  for (const item of items ?? []) {
    const harga = Number(item.harga ?? 0)
    const jumlah = Number(item.jumlah ?? 1)
    const diskon = Number(item.diskon ?? 0)
    totalMap[item.invoice_id] = (totalMap[item.invoice_id] ?? 0) + (harga * jumlah) - diskon
  }

  const invoicesWithTotal = invoices?.map(inv => ({
    ...inv,
    total: totalMap[inv.id] ?? 0,
  })) ?? []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sent: string[] = []

  for (const inv of invoicesWithTotal) {
    const invDate = new Date(inv.tanggal)
    const topDays = parseTopDays(inv.top)
    const dueDate = new Date(invDate)
    dueDate.setDate(dueDate.getDate() + topDays)
    dueDate.setHours(0, 0, 0, 0)

    const daysDiff = daysBetween(dueDate, today)

    // Send reminder on: H-3, H-1, H, H+1, H+2, ... H+30
    // Stop after H+30 or if paid
    let shouldSend = false
    let reminderType = ''

    if (daysDiff === 3) {
      shouldSend = true
      reminderType = 'H-3'
    } else if (daysDiff === 1) {
      shouldSend = true
      reminderType = 'H-1'
    } else if (daysDiff === 0) {
      shouldSend = true
      reminderType = 'H'
    } else if (daysDiff <= -1 && daysDiff >= -30) {
      shouldSend = true
      reminderType = `H+${Math.abs(daysDiff)}`
    }

    if (shouldSend) {
      const customerArr = inv.customer as unknown as { nama: string }[]
      const customerNama = customerArr?.[0]?.nama ?? 'Customer'
      const total = inv.total ?? 0
      let message: string

      if (daysDiff === 3) {
        message = `📅 JATUH TEMPO SEGERA - H-3

Faktur *${inv.nomor}* - ${customerNama}
💰 Total: Rp ${Number(total).toLocaleString('id-ID')},-
📆 Jatuh Tempo: ${formatDateWIB(dueDate)} (3 hari lagi)

Mohon persiapkan pembayaran.

- ERP RRI`
      } else if (daysDiff === 1) {
        message = `⏰ JATUH TEMPO BESOK - H-1

Faktur *${inv.nomor}* - ${customerNama}
💰 Total: Rp ${Number(total).toLocaleString('id-ID')},-
📆 Jatuh Tempo: ${formatDateWIB(dueDate)} (besok)

Harap segera lakukan pembayaran.

- ERP RRI`
      } else if (daysDiff === 0) {
        message = `🔔 JATUH TEMPO HARI INI

Faktur *${inv.nomor}* - ${customerNama}
💰 Total: Rp ${Number(total).toLocaleString('id-ID')},-
📆 Jatuh Tempo: HARI INI (${formatDateWIB(dueDate)})

Mohon lakukan pembayaran hari ini.

- ERP RRI`
      } else {
        message = `⚠️ BELUM DIBAYAR - ${reminderType}

Faktur *${inv.nomor}* - ${customerNama}
💰 Total: Rp ${Number(total).toLocaleString('id-ID')},-
📆 Jatuh Tempo: ${formatDateWIB(dueDate)}
⏰ Belum diterima pembayaran: ${Math.abs(daysDiff)} hari setelah jatuh tempo

Mohon segera lakukan pembayaran untuk menghindari tindakan lebih lanjut.

- ERP RRI`
      }

      const ownerHps = await getOwnerWhatsapp()
      for (const hp of ownerHps) {
        const result = await sendWhatsapp(hp, message)
        sent.push(`${inv.nomor} (${reminderType}) -> ${hp.slice(0, 5)}...: ${result.success ? 'OK' : 'FAILED'}`)
      }
      if (!ownerHps.length) {
        console.log(`Invoice reminder ${inv.nomor}: owner_whatsapp not configured, skipping`)
      }
    }
  }

  return NextResponse.json({
    invoices_checked: invoices?.length ?? 0,
    reminders_sent: sent.length,
    details: sent,
  })
}
