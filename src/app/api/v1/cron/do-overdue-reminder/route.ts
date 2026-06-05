import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { sendWhatsapp, getOwnerWhatsapp } from '@/lib/utils/whatsapp'
import { formatDateWIB } from '@/lib/utils/timezone'

interface SalesOrderWithCustomer {
  customer_po?: { customer?: { nama: string } }
  di?: { customer?: { nama: string } }
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

  const { data: dos, error } = await supabaseAdmin
    .from('delivery_order')
    .select(`
      id,
      nomor,
      tanggal,
      waktu_pengiriman,
      status,
      sales_order!sales_order_id(
        customer_po!customer_po_id(
          customer!customer_id(nama)
        ),
        di!di_id(
          customer!customer_id(nama)
        )
      )
    `)
    .in('status', ['draft', 'awaiting_pickup', 'dikirim'])
    .not('waktu_pengiriman', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sent: string[] = []

  for (const do_ of dos ?? []) {
    const doDate = new Date(do_.tanggal)
    const deliveryDays = Number(do_.waktu_pengiriman ?? 0)
    const dueDate = new Date(doDate)
    dueDate.setDate(dueDate.getDate() + deliveryDays)
    dueDate.setHours(0, 0, 0, 0)

    const daysDiff = daysBetween(dueDate, today)

    let shouldSend = false
    let reminderType = ''

    if (daysDiff === 7) {
      shouldSend = true
      reminderType = 'H-7'
    } else if (daysDiff === 3) {
      shouldSend = true
      reminderType = 'H-3'
    } else if (daysDiff === 1) {
      shouldSend = true
      reminderType = 'H-1'
    } else if (daysDiff === 0) {
      shouldSend = true
      reminderType = 'H'
    }

    if (shouldSend) {
      const so = do_.sales_order as SalesOrderWithCustomer
      const customerNama = so?.customer_po?.customer?.nama ?? so?.di?.customer?.nama ?? 'Customer'

      let message: string

      if (daysDiff === 7) {
        message = `📦 PENGIRIMAN H-7

DO No. *${do_.nomor}* - ${customerNama}
📅 Jadwal Kirim: ${formatDateWIB(dueDate)} (7 hari lagi)

Mohon persiapkan pengiriman.

- ERP RRI`
      } else if (daysDiff === 3) {
        message = `📦 PENGIRIMAN H-3

DO No. *${do_.nomor}* - ${customerNama}
📅 Jadwal Kirim: ${formatDateWIB(dueDate)} (3 hari lagi)

Mohon persiapkan pengiriman.

- ERP RRI`
      } else if (daysDiff === 1) {
        message = `📦 PENGIRIMAN BESOK - H-1

DO No. *${do_.nomor}* - ${customerNama}
📅 Jadwal Kirim: ${formatDateWIB(dueDate)} (besok)

Harap segera lakukan pengiriman.

- ERP RRI`
      } else {
        message = `📦 PENGIRIMAN HARI INI

DO No. *${do_.nomor}* - ${customerNama}
📅 Jadwal Kirim: HARI INI (${formatDateWIB(dueDate)})

Segera lakukan pengiriman hari ini.

- ERP RRI`
      }

      const ownerHps = await getOwnerWhatsapp()
      for (const hp of ownerHps) {
        const result = await sendWhatsapp(hp, message)
        sent.push(`${do_.nomor} (${reminderType}) -> ${hp.slice(0, 5)}...: ${result.success ? 'OK' : 'FAILED'}`)
      }
      if (!ownerHps.length) {
        console.log(`DO reminder ${do_.nomor}: owner_whatsapp not configured, skipping`)
      }
    }
  }

  return NextResponse.json({
    dos_checked: dos?.length ?? 0,
    reminders_sent: sent.length,
    details: sent,
  })
}
