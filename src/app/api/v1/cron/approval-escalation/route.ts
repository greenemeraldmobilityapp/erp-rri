import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { sendWhatsapp, getOwnerWhatsapp } from '@/lib/utils/whatsapp'
import { formatDateWIB } from '@/lib/utils/timezone'

export async function GET(req: Request) {
  const cronToken = process.env.CRON_SECRET_TOKEN
  if (cronToken) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const escalationHours = 24 // Default hardcoded to 24 hours
  const threshold = new Date(Date.now() - escalationHours * 60 * 60 * 1000).toISOString()
  const escalated: string[] = []

  // Check Purchase Requests pending > 24h
  const { data: pendingPRs } = await supabaseAdmin
    .from('purchase_request')
    .select('id, nomor, created_at, status')
    .in('status', ['draft', 'pending'])
    .lt('created_at', threshold)
    .limit(20)

  const ownerHps = await getOwnerWhatsapp()

  for (const pr of pendingPRs ?? []) {
    if (!ownerHps.length) {
      console.log('Approval escalation: owner_whatsapp not configured, skipping')
      break
    }
      const msg = `⚠️ ESCALATION - Persetujuan Tertunda

PR No. *${pr.nomor}* telah menunggu persetujuan lebih dari 24 jam.

📅 Dibuat: ${formatDateWIB(new Date(pr.created_at))}
⏰ Status: ${pr.status}

Mohon segera ditindaklanjuti.

- ERP RRI`
      for (const hp of ownerHps) {
        const result = await sendWhatsapp(hp, msg)
        escalated.push(`PR ${pr.nomor} -> ${hp.slice(0, 5)}...: ${result.success ? 'OK' : 'FAILED'}`)
      }

    await supabaseAdmin.from('audit_log').insert({
      id: crypto.randomUUID(),
      table_name: 'purchase_request',
      record_id: pr.id,
      action: 'escalation',
      changes: { note: 'Auto-escalation: pending > 24 hours' },
      created_at: new Date().toISOString(),
    })
  }

  // Check Purchase Orders pending > 24h
  const { data: pendingPOs } = await supabaseAdmin
    .from('purchase_order')
    .select('id, nomor, created_at, status')
    .in('status', ['draft', 'pending'])
    .lt('created_at', threshold)
    .limit(20)

  for (const po of pendingPOs ?? []) {
    if (!ownerHps.length) {
      break
    }
      const msg = `⚠️ ESCALATION - Persetujuan Tertunda

PO No. *${po.nomor}* telah menunggu persetujuan lebih dari 24 jam.

📅 Dibuat: ${formatDateWIB(new Date(po.created_at))}
⏰ Status: ${po.status}

Mohon segera ditindaklanjuti.

- ERP RRI`
      for (const hp of ownerHps) {
        const result = await sendWhatsapp(hp, msg)
        escalated.push(`PO ${po.nomor} -> ${hp.slice(0, 5)}...: ${result.success ? 'OK' : 'FAILED'}`)
      }

    await supabaseAdmin.from('audit_log').insert({
      id: crypto.randomUUID(),
      table_name: 'purchase_order',
      record_id: po.id,
      action: 'escalation',
      changes: { note: 'Auto-escalation: pending > 24 hours' },
      created_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({
    checked_at: new Date().toISOString(),
    escalated_count: escalated.length,
    details: escalated,
  })
}
