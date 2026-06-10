import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/api/auth"
import { supabaseAdmin } from "@/lib/api/supabase-server"
import { sendEmail } from "@/lib/utils/email"
import { getFile } from "@/lib/email/r2-client"

const MAX_BREVO_ATTACHMENT_SIZE = 7 * 1024 * 1024 // 7MB

interface AttachmentInput {
  key: string
  id: string
  fileName: string
  fileSize: number
  mimeType: string
}

async function fetchAttachmentFromR2(key: string): Promise<Uint8Array> {
  const { body } = await getFile(key)
  return body
}

async function storeEmailAttachments(
  emailId: string,
  attachments: AttachmentInput[]
) {
  const records = attachments.map(att => ({
    id: att.id,
    email_id: emailId,
    file_name: att.fileName,
    file_url: att.key,
    file_size: att.fileSize,
    mime_type: att.mimeType,
  }))

  await supabaseAdmin.from("email_attachments").insert(records)
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 })

  try {
    const body = await request.json()
    const {
      toEmail,
      toNama,
      subject,
      body: htmlBody,
      cc,
      status,
      draftId,
      referenceType,
      referenceId,
      templateId,
      params,
      attachments,
    } = body

    if (status === "draft") {
      const now = new Date().toISOString()
      const draft = {
        from_email: auth.user?.email ?? null,
        to_email: toEmail,
        to_nama: toNama ?? null,
        cc: cc ?? null,
        subject: subject ?? "",
        body: htmlBody ?? null,
        status: "draft",
        updated_at: now,
      }

      if (draftId) {
        const { error: updateError } = await supabaseAdmin
          .from("email_log")
          .update(draft)
          .eq("id", draftId)

        if (updateError) throw updateError

        return NextResponse.json({ data: { id: draftId, status: "draft" } })
      }

      const { data: insertData, error: insertError } = await supabaseAdmin
        .from("email_log")
        .insert({ ...draft, created_at: now })
        .select("id")
        .single()

      if (insertError) throw insertError

      return NextResponse.json({ data: { id: insertData.id, status: "draft" } })
    }

    if (!toEmail) {
      return NextResponse.json({ error: "toEmail is required" }, { status: 400 })
    }
    if (!subject && !templateId) {
      return NextResponse.json({ error: "subject or templateId is required" }, { status: 400 })
    }

    // Process attachments from R2
    const processedAttachments: Array<{ filename: string; content: Buffer; contentType?: string }> = []
    let downloadLinksHtml = ""

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments as AttachmentInput[]) {
        if (att.fileSize <= MAX_BREVO_ATTACHMENT_SIZE) {
          // Fetch and include as Brevo attachment (base64)
          const data = await fetchAttachmentFromR2(att.key)
          processedAttachments.push({
            filename: att.fileName,
            content: Buffer.from(data),
            contentType: att.mimeType,
          })
        } else {
          // >7MB: generate download link
          const downloadUrl = `/api/v1/email/attachments/${att.id}`
          const sizeStr = att.fileSize > 1024 * 1024
            ? `${(att.fileSize / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(att.fileSize / 1024)} KB`
          downloadLinksHtml += `<p style="margin:8px 0;"><a href="${downloadUrl}" download="${att.fileName}">📎 ${att.fileName} (${sizeStr}) — Download</a></p>`
        }
      }

      // Inject download links into email body
      if (downloadLinksHtml) {
        const downloadSection = `
          <div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
            <p style="margin:0 0 8px;font-weight:600;color:#374151;">Lampiran (download manual):</p>
            ${downloadLinksHtml}
          </div>
        `
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(body as any).body = (htmlBody || "") + downloadSection
      }
    }

    const result = await sendEmail({
      to: toEmail,
      toNama: toNama || undefined,
      subject: subject || "",
      html: body.body || undefined,
      templateId: templateId || undefined,
      params: params || undefined,
      referenceType: referenceType || undefined,
      referenceId: referenceId || undefined,
      attachments: processedAttachments.length > 0 ? processedAttachments : undefined,
    })

    // Store attachment metadata after successful send
    if (attachments && Array.isArray(attachments) && attachments.length > 0 && result.emailLogId) {
      await storeEmailAttachments(result.emailLogId, attachments as AttachmentInput[])
    }

    return NextResponse.json({ data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
