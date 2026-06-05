import { supabaseAdmin } from '@/lib/api/supabase-server'
import { sendWhatsapp, getOwnerWhatsapp } from '@/lib/utils/whatsapp'
import { formatDateWIB } from '@/lib/utils/timezone'

export interface SmartReminderInput {
  invoice_id: string
  reminder_type?: 'auto' | 'urgent' | 'final'
}

export interface SmartReminderResult {
  invoice_id: string
  customer_name: string
  no_hp?: string
  message: string
  reminder_type: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
  should_send: boolean
  alternative_action?: string
}

export async function generateSmartReminder(
  input: SmartReminderInput
): Promise<SmartReminderResult> {
  const { data: invoice } = await supabaseAdmin
    .from('invoice')
    .select('*, customer!customer_id(id, nama, telepon)')
    .eq('id', input.invoice_id)
    .single()

  if (!invoice) {
    throw new Error('Invoice tidak ditemukan')
  }

  const invoiceDate = new Date(invoice.tanggal)
  const topMatch = (invoice.top ?? '30 hari').match(/\d+/)
  const topDays = topMatch ? parseInt(topMatch[0]) : 30
  const dueDate = new Date(invoiceDate)
  dueDate.setDate(dueDate.getDate() + topDays)
  const today = new Date()
  const overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

  const { data: pics } = await supabaseAdmin
    .from('customer_pic')
    .select('nama, no_hp')
    .eq('customer_id', (invoice.customer as { id: string }).id)
    .eq('is_active', true)
    .limit(1)

  const pic = pics?.[0]

  const { data: paymentHistory } = await supabaseAdmin
    .from('invoice')
    .select('status, tanggal')
    .eq('customer_id', (invoice.customer as { id: string }).id)
    .order('tanggal', { ascending: false })
    .limit(5)

  const slowPayer = (paymentHistory ?? []).filter(
    (i: { status: string }) => i.status === 'overdue'
  ).length >= 2

  let reminderType = input.reminder_type ?? 'auto'
  if (overdueDays > 60) reminderType = 'final'
  else if (overdueDays > 30) reminderType = 'urgent'

  let priority: SmartReminderResult['priority'] = 'MEDIUM'
  let shouldSend = true
  let alternativeAction: string | undefined

  if (overdueDays > 90 && slowPayer) {
    priority = 'LOW'
    shouldSend = false
    alternativeAction = 'Direct visit atau legal action - reminder via WA tidak efektif'
  } else if (overdueDays > 60) {
    priority = 'HIGH'
  }

  let message: string
  if (reminderType === 'final') {
    message = `Yth. Bpk/Ibu ${pic?.nama ?? (invoice.customer as { nama: string }).nama},

Dengan ini kami sampaikan TAGIHAN AKHIR untuk invoice ${invoice.nomor}.

Total: Rp ${Number(invoice.total).toLocaleString('id-ID')}
Jatuh tempo: ${dueDate.toLocaleDateString('id-ID')}
Terlambat: ${overdueDays} hari

Mohon pembayaran dilakukan dalam 7 hari kerja untuk menghindari tindakan penagihan lebih lanjut.

Hormat kami,
RRI`
  } else if (reminderType === 'urgent') {
    message = `Yth. Bpk/Ibu ${pic?.nama ?? (invoice.customer as { nama: string }).nama},

Sehubungan dengan invoice ${invoice.nomor} yang sudah ${overdueDays} hari overdue, kami mengundang Bapak/Ibu untuk membahas penyelesaian pembayaran.

Total: Rp ${Number(invoice.total).toLocaleString('id-ID')}
Jatuh tempo: ${dueDate.toLocaleDateString('id-ID')}

Kami berharap dapat menemukan solusi yang baik untuk kedua belah pihak.

Hormat kami,
RRI`
  } else {
    message = `Yth. Bpk/Ibu ${pic?.nama ?? (invoice.customer as { nama: string }).nama},

Sehubungan dengan jadwal pembayaran, kami menyampaikan reminder untuk invoice:

Nomor: ${invoice.nomor}
Total: Rp ${Number(invoice.total).toLocaleString('id-ID')}
Jatuh tempo: ${dueDate.toLocaleDateString('id-ID')}
Terlambat: ${overdueDays} hari

Mohon dapat diproses pembayarannya. Terima kasih.

Hormat kami,
RRI`
  }

  return {
    invoice_id: input.invoice_id,
    customer_name: (invoice.customer as { nama: string }).nama,
    no_hp: pic?.no_hp,
    message,
    reminder_type: reminderType,
    priority,
    reason: `Overdue ${overdueDays} hari, reminder type: ${reminderType}`,
    should_send: shouldSend,
    alternative_action: alternativeAction,
  }
}

export async function generateBulkReminders(
  overdueDaysThreshold: number = 7,
  options?: { sendNotification?: boolean }
): Promise<SmartReminderResult[]> {
  const { data: overdueInvoices } = await supabaseAdmin
    .from('invoice')
    .select('id, tanggal, top, total, status, customer_id, customer:nama')
    .eq('status', 'overdue')
    .eq('is_active', true)

  const reminders: SmartReminderResult[] = []

  for (const inv of overdueInvoices ?? []) {
    const dueDate = new Date(inv.tanggal)
    const topMatch = (inv.top ?? '30 hari').match(/\d+/)
    const topDays = topMatch ? parseInt(topMatch[0]) : 30
    dueDate.setDate(dueDate.getDate() + topDays)
    const today = new Date()
    const overdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    if (overdue >= overdueDaysThreshold) {
      try {
        const reminder = await generateSmartReminder({
          invoice_id: inv.id,
          reminder_type: overdue > 60 ? 'final' : overdue > 30 ? 'urgent' : 'auto',
        })
        if (reminder.should_send) {
          reminders.push(reminder)
        }
      } catch (err) {
        console.error(`Failed to generate reminder for invoice ${inv.id}:`, err)
      }
    }
  }

  return reminders
}

export async function sendBulkReminderNotifications(reminders: SmartReminderResult[]): Promise<void> {
  if (reminders.length === 0) {
    console.log('Bulk reminders: No reminders to send')
    return
  }

  const ownerHps = await getOwnerWhatsapp()
  if (!ownerHps.length) {
    console.log('Bulk reminders: owner_whatsapp not configured in site_settings, skipping notification')
    return
  }

  console.log('Bulk reminders: Sending WhatsApp with', reminders.length, 'reminders')

  const urgent = reminders.filter(r => r.priority === 'HIGH' || r.reminder_type === 'urgent' || r.reminder_type === 'final')
  const normal = reminders.filter(r => r.priority !== 'HIGH' && r.reminder_type !== 'urgent' && r.reminder_type !== 'final')

  const lines: string[] = [
    '💰 Ringkasan Reminder Piutang RRI',
    `Tanggal: ${formatDateWIB(new Date())}`,
    '',
    `Total Invoice Jatuh Tempo: ${reminders.length}`,
    `⚠️ Mendesak: ${urgent.length}`,
    `📋 Normal: ${normal.length}`,
    '',
  ]

  if (urgent.length > 0) {
    lines.push('--- MENDESAK (>30 hari overdue) ---')
    for (const r of urgent.slice(0, 5)) {
      lines.push(`• ${r.customer_name} - ${r.reminder_type.toUpperCase()} - Prioritas: ${r.priority}`)
    }
    if (urgent.length > 5) lines.push(`... dan ${urgent.length - 5} lainnya`)
    lines.push('')
  }

  if (normal.length > 0) {
    lines.push('--- NORMAL (<30 hari overdue) ---')
    for (const r of normal.slice(0, 5)) {
      lines.push(`• ${r.customer_name} - Prioritas: ${r.priority}`)
    }
    if (normal.length > 5) lines.push(`... dan ${normal.length - 5} lainnya`)
  }

  lines.push('')
  lines.push('Mohon tinjau dan lakukan follow up dengan customer.')

  for (const hp of ownerHps) {
    await sendWhatsapp(hp, lines.join('\n'))
  }
}