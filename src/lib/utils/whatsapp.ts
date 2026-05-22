import { supabaseAdmin } from '@/lib/api/supabase-server'

const FONNTE_API_URL = 'https://api.fonnte.com/send'

type SendResult = {
  success: boolean
  fonnteId?: string
  error?: string
}

export async function sendWhatsapp(
  recipient: string,
  message: string,
  userId?: string
): Promise<SendResult> {
  const apiKey = process.env.FONNTE_API_KEY
  if (!apiKey) {
    await logWhatsapp(recipient, message, 'failed', userId)
    return { success: false, error: 'FONNTE_API_KEY not configured' }
  }

  try {
    const res = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target: recipient, message }),
    })

    const data = await res.json()

    if (data.status) {
      await logWhatsapp(recipient, message, 'sent', userId, data.id)
      return { success: true, fonnteId: data.id }
    }

    await logWhatsapp(recipient, message, 'failed', userId)
    return { success: false, error: data.reason || 'Unknown error' }
  } catch (err) {
    await logWhatsapp(recipient, message, 'failed', userId)
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

async function logWhatsapp(
  recipient: string,
  message: string,
  status: string,
  userId?: string,
  fonnteId?: string
) {
  try {
    await supabaseAdmin.from('whatsapp_log').insert({
      id: fonnteId || crypto.randomUUID(),
      user_id: userId || null,
      recipient,
      message,
      status,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    })
  } catch {
    // silently fail - logging should not break the main flow
  }
}
