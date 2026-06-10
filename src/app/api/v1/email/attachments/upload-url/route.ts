import { NextRequest, NextResponse } from 'next/server'
import { getPresignedUrl } from '@/lib/email/r2-client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fileName = searchParams.get('fileName')
  const contentType = searchParams.get('contentType') ?? 'application/octet-stream'
  const emailId = searchParams.get('emailId')

  if (!fileName) {
    return NextResponse.json({ error: 'fileName is required' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const key = emailId
    ? `email-attachments/${emailId}/${id}-${fileName}`
    : `temp/attachments/${id}-${fileName}`

  try {
    const presignedUrl = await getPresignedUrl(key, contentType)

    return NextResponse.json({
      data: {
        presignedUrl,
        key,
        id,
        fileName,
      },
    })
  } catch (err) {
    console.error('Failed to generate presigned URL:', err)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}