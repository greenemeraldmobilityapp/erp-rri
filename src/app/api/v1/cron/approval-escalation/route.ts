import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { sendWhatsapp } from '@/lib/utils/whatsapp'

export async function GET(req: Request) {
  const cronToken = process.env.CRON_SECRET_TOKEN
  if (cronToken) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const escalated: string[] = []

  // Check Purchase Requests pending > 24h
  const { data: pendingPRs } = await supabaseAdmin
    .from('purchase_request')
    .select('id, nomor, created_at')
    .in('status', ['draft', 'pending'])
    .lt('created_at', twentyFourHoursAgo)
    .limit(20)

  for (const pr of pendingPRs ?? []) {
    const { data: managerUsers } = await supabaseAdmin.from('users').select('email').eq('role', 'manager').eq('is_active', true).limit(3)
    if (managerUsers?.length) {
      const { data: karyawanList } = await supabaseAdmin.from('karyawan').select('no_hp').in('email', managerUsers.map(u => u.email)).not('no_hp', 'is', null).limit(3)
      const msg = `[ESCALATION] PR No. *${pr.nomor}* telah menunggu persetujuan lebih dari 24 jam.\n\nMohon segera ditindaklanjuti.\n\n- ERP RRI`
      for (const k of karyawanList ?? []) {
        if (k.no_hp) {
          await sendWhatsapp(k.no_hp, msg)
        }
      }
    }

    await supabaseAdmin.from('audit_log').insert({
      id: crypto.randomUUID(),
      table_name: 'purchase_request',
      record_id: pr.id,
      action: 'escalation',
      changes: { note: 'Auto-escalation: pending > 24 hours' },
      created_at: new Date().toISOString(),
    })
    escalated.push(`PR ${pr.nomor}`)
  }

  // Check Purchase Orders pending > 24h
  const { data: pendingPOs } = await supabaseAdmin
    .from('purchase_order')
    .select('id, nomor, created_at')
    .in('status', ['draft', 'pending'])
    .lt('created_at', twentyFourHoursAgo)
    .limit(20)

  for (const po of pendingPOs ?? []) {
    const { data: managerUsers } = await supabaseAdmin.from('users').select('email').eq('role', 'manager').eq('is_active', true).limit(3)
    if (managerUsers?.length) {
      const { data: karyawanList } = await supabaseAdmin.from('karyawan').select('no_hp').in('email', managerUsers.map(u => u.email)).not('no_hp', 'is', null).limit(3)
      const msg = `[ESCALATION] PO No. *${po.nomor}* telah menunggu persetujuan lebih dari 24 jam.\n\nMohon segera ditindaklanjuti.\n\n- ERP RRI`
      for (const k of karyawanList ?? []) {
        if (k.no_hp) {
          await sendWhatsapp(k.no_hp, msg)
        }
      }
    }

    await supabaseAdmin.from('audit_log').insert({
      id: crypto.randomUUID(),
      table_name: 'purchase_order',
      record_id: po.id,
      action: 'escalation',
      changes: { note: 'Auto-escalation: pending > 24 hours' },
      created_at: new Date().toISOString(),
    })
    escalated.push(`PO ${po.nomor}`)
  }

  return NextResponse.json({
    checked_at: new Date().toISOString(),
    escalated_count: escalated.length,
    details: escalated,
  })
}
