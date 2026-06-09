import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api/auth'
import { BrevoClient } from '@getbrevo/brevo'

function getClient() {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('BREVO_API_KEY not set')
  return new BrevoClient({ apiKey })
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    const client = getClient()

    if (templateId) {
      const template = await client.transactionalEmails.getSmtpTemplate({ templateId: parseInt(templateId) })
      return NextResponse.json({ data: template })
    }

    const { searchParams: sp } = new URL(request.url)
    const limit = parseInt(sp.get('limit') ?? '50')
    const offset = parseInt(sp.get('offset') ?? '0')

    const result = await client.transactionalEmails.getSmtpTemplates({ limit, offset })
    return NextResponse.json({ data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch templates'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
