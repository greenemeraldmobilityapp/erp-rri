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
    await logWhatsapp(recipient, message, 'failed', userId, undefined, 'FONNTE_API_KEY not configured')
    return { success: false, error: 'FONNTE_API_KEY not configured' }
  }

  try {
    const res = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target: recipient, message }),
    })

    const data = await res.json()

    if (data.status === true) {
      await logWhatsapp(recipient, message, 'sent', userId, data.id)
      return { success: true, fonnteId: data.id }
    }

    const errorReason = data.reason || data.message || 'Unknown error from Fonnte'
    await logWhatsapp(recipient, message, 'failed', userId, undefined, errorReason)
    return { success: false, error: errorReason }
  } catch (err) {
    const errorReason = err instanceof Error ? err.message : 'Network error'
    await logWhatsapp(recipient, message, 'failed', userId, undefined, errorReason)
    return { success: false, error: errorReason }
  }
}

export async function getOwnerWhatsapp(): Promise<string[]> {
  try {
    const { data } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'owner_whatsapp')
      .single()
    if (!data?.value) return []
    return data.value.split(',').map((s: string) => s.trim()).filter(Boolean)
  } catch {
    return []
  }
}

async function logWhatsapp(
  recipient: string,
  message: string,
  status: string,
  userId?: string,
  fonnteId?: string,
  errorReason?: string
) {
  try {
    await supabaseAdmin.from('whatsapp_log').insert({
      id: fonnteId || crypto.randomUUID(),
      user_id: userId || null,
      recipient,
      message,
      status,
      error_reason: errorReason || null,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    })
  } catch {
    // silently fail - logging should not break the main flow
  }
}
