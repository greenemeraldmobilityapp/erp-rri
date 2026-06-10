import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/api/supabase-server"
import { z } from "zod"

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024 // 25MB

const attachmentSchema = z.object({
  key: z.string(),
  fileName: z.string(),
  fileSize: z.number().max(MAX_ATTACHMENT_SIZE, `Attachment exceeds ${MAX_ATTACHMENT_SIZE / 1024 / 1024}MB limit`),
  mimeType: z.string(),
})

const inboundBodySchema = z.object({
  messageId: z.string().optional(),
  fromEmail: z.string(),
  fromNama: z.string().optional().nullable(),
  toEmail: z.string(),
  subject: z.string(),
  body: z.string().optional(),
  hasAttachments: z.boolean().optional(),
  attachments: z.array(attachmentSchema).optional().default([]),
})

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const secret = process.env.EMAIL_INBOUND_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    // DEBUG: log what we received
    console.log('[INBOUND API] messageId:', body.messageId)
    console.log('[INBOUND API] hasAttachments:', body.hasAttachments)
    console.log('[INBOUND API] attachments count:', body.attachments?.length ?? 0)
    console.log('[INBOUND API] attachments:', JSON.stringify(body.attachments))

    const parsed = inboundBodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { messageId, fromEmail, fromNama, toEmail, subject, body: emailBody, hasAttachments, attachments } = parsed.data

    console.log('[INBOUND API] parsed hasAttachments:', hasAttachments)
    console.log('[INBOUND API] parsed attachments:', attachments)

    const now = new Date().toISOString()
    const defaultTo = process.env.BREVO_SENDER_EMAIL || 'marzuqi@pt-rri.com'

    if (!fromEmail || !subject) {
      return NextResponse.json({ error: "fromEmail and subject are required" }, { status: 400 })
    }

    // Check if messageId already exists (idempotent — first-received wins)
    if (messageId) {
      const existing = await supabaseAdmin
        .from("email_log")
        .select("id")
        .eq("message_id", messageId)
        .maybeSingle()

      if (existing.data) {
        // Email already received — return existing record (first-received wins)
        return NextResponse.json({
          data: { email: existing.data, isDuplicate: true },
        })
      }
    }

    // Insert into email_log
    const { data, error } = await supabaseAdmin
      .from("email_log")
      .insert({
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
      })
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation (race condition — another request inserted same messageId)
      if (error.code === '23505' && messageId) {
        const existing = await supabaseAdmin
          .from("email_log")
          .select("id")
          .eq("message_id", messageId)
          .maybeSingle()

        if (existing.data) {
          return NextResponse.json({
            data: { email: existing.data, isDuplicate: true },
          })
        }
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Insert attachments into email_attachments
    let savedAttachments: Array<{ id: string; fileName: string; fileUrl: string; fileSize: number; mimeType: string }> = []
    console.log('[INBOUND API] Checking attachments - count:', attachments?.length ?? 0)
    if (attachments && attachments.length > 0) {
      console.log('[INBOUND API] Inserting attachments, email_id:', data.id)
      const attRecords = attachments.map(att => ({
        email_id: data.id,
        file_name: att.fileName,
        file_url: att.key,
        file_size: att.fileSize,
        mime_type: att.mimeType,
      }))

      const { data: attData, error: attError } = await supabaseAdmin
        .from("email_attachments")
        .insert(attRecords)
        .select()

      if (attError) {
        // Cleanup: delete email_log record if attachment insert fails
        await supabaseAdmin.from("email_log").delete().eq('id', data.id)
        console.log('[INBOUND API] Attachment insert FAILED:', attError.message)
        return NextResponse.json({ error: `Failed to store attachments: ${attError.message}` }, { status: 500 })
      }

      console.log('[INBOUND API] Attachment insert SUCCESS, count:', attData.length)
      savedAttachments = attData.map(att => ({
        id: att.id,
        fileName: att.file_name,
        fileUrl: att.file_url,
        fileSize: att.file_size,
        mimeType: att.mime_type,
      }))
    } else {
      console.log('[INBOUND API] No attachments to insert')
    }

    return NextResponse.json({
      data: {
        email: data,
        attachments: savedAttachments,
        isDuplicate: false,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process inbound email"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}