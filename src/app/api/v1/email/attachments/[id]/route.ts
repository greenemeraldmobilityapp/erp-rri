import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { getFile } from '@/lib/email/r2-client'
import { internalError, notFound } from '@/lib/api/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params

  try {
    const { data: attachment, error } = await supabaseAdmin
      .from('email_attachments')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !attachment) {
      return notFound('Attachment not found')
    }

    let key = attachment.file_url
    // Handle both raw R2 key ("email-attachments/...") and full URL ("https://...")
    if (key.includes('://')) {
      try {
        const url = new URL(key)
        key = url.pathname.replace(/^\//, '')
      } catch {
        key = attachment.file_url.replace(`${process.env.R2_ENDPOINT ?? ''}/`, '').replace(/^\//, '')
      }
    }

    const { body, contentType } = await getFile(key)
    const blob = new Blob([new Uint8Array(body)], { type: contentType })

    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(body.byteLength),
        'Content-Disposition': `attachment; filename="${attachment.file_name}"`,
      },
    })
  } catch (err) {
    return internalError(err)
  }
}