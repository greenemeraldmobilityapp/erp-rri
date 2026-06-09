import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/api/supabase-server"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const secret = process.env.EMAIL_INBOUND_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { messageId, fromEmail, fromNama, toEmail, subject, body: emailBody, hasAttachments } = body

    if (!fromEmail || !subject) {
      return NextResponse.json({ error: "fromEmail and subject are required" }, { status: 400 })
    }

    const now = new Date().toISOString()
    const defaultTo = process.env.BREVO_SENDER_EMAIL || 'marzuqi@pt-rri.com'
    const { data, error } = await supabaseAdmin.from("email_log").insert({
      message_id: messageId ?? null,
      from_email: fromEmail,
      from_nama: fromNama ?? null,
      to_email: toEmail || defaultTo,
      subject,
      body: emailBody ?? null,
      has_attachments: hasAttachments ?? false,
      inbound: true,
      status: "delivered",
      created_at: now,
      updated_at: now,
    }).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process inbound email"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
