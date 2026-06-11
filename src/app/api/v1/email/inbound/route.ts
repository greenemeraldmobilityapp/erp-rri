import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/api/supabase-server"
import { z } from "zod"

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024 // 25MB

function normalizeSubject(subject: string): string {
  return subject.replace(/^(Re|Fwd|Aw|Fw)\s*:\s*/gi, '').trim().toLowerCase()
}

function escapeForSupabase(value: string): string {
  return value.replace(/'/g, "''")
}

function decodeQuotedPrintable(text: string): string {
  return text
    .replace(/=\r\n/g, '')
    .replace(/=\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function decodeQpIfPresent(text: string): string {
  if (!text) return text
  if (text.includes('=') && /=[0-9A-Fa-f]{2}/.test(text)) {
    return decodeQuotedPrintable(text)
  }
  return text
}

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
  cc: z.string().optional().nullable(),
  inReplyTo: z.string().optional().nullable(),
  references: z.string().optional().nullable(),
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

    const { messageId, fromEmail, fromNama, toEmail, cc, inReplyTo, references, subject, body: emailBody, hasAttachments, attachments } = parsed.data

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

    // Resolve thread_id
    let threadId: string | null = null
    const refToCheck = references || inReplyTo || ''
    if (refToCheck) {
      const refIds = refToCheck
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(r => r.replace(/^<|>$/g, ''))
        .filter(Boolean)
      if (refIds.length > 0) {
        const { data: parent } = await supabaseAdmin
          .from("email_log")
          .select("thread_id")
          .in("message_id", refIds)
          .not("thread_id", "is", null)
          .maybeSingle()
        if (parent?.thread_id) threadId = parent.thread_id
      }
    }
    // Fallback: subject-based + participant overlap
    if (!threadId) {
      const normSubj = normalizeSubject(subject)
      if (normSubj) {
        const { data: existing } = await supabaseAdmin
          .from("email_log")
          .select("thread_id")
          .or(`from_email.eq.${escapeForSupabase(fromEmail)},to_email.eq.${escapeForSupabase(fromEmail)},from_email.eq.${escapeForSupabase(toEmail)},to_email.eq.${escapeForSupabase(toEmail)}`)
          .ilike("subject", `%${normSubj}%`)
          .not("thread_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existing?.thread_id) {
          threadId = existing.thread_id
        }
      }
    }

    if (!threadId) {
      threadId = crypto.randomUUID()
    }

    // Fallback: resolve from_nama dari customer_pic jika null
    let resolvedFromNama = fromNama ?? null
    if (!resolvedFromNama && fromEmail) {
      const { data: pic } = await supabaseAdmin
        .from("customer_pic")
        .select("nama")
        .eq("email", fromEmail)
        .maybeSingle()
      if (pic?.nama) resolvedFromNama = pic.nama
    }

    // Insert into email_log
    const decodedBody = emailBody ? decodeQpIfPresent(emailBody) : null
    const { data, error } = await supabaseAdmin
      .from("email_log")
      .insert({
        message_id: messageId ?? null,
        thread_id: threadId,
        from_email: fromEmail,
        from_nama: resolvedFromNama,
        to_email: toEmail || defaultTo,
        cc: cc ?? null,
        subject,
        body: decodedBody,
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