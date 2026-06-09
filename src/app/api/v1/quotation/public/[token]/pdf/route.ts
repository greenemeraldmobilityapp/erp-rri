import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { internalError } from '@/lib/api/errors'
import { generateQuotationPdfBlob } from '@/lib/pdf/generate-quotation-pdf'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const { data: qtn } = await supabaseAdmin
    .from('quotation')
    .select('id, nomor, revisi, email_access_token_expires_at')
    .eq('email_access_token', token)
    .maybeSingle()

  if (!qtn) {
    return NextResponse.json({ error: 'Tautan tidak valid' }, { status: 404 })
  }

  if (qtn.email_access_token_expires_at && new Date(qtn.email_access_token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Tautan telah kedaluwarsa. Silakan hubungi kami untuk mendapatkan akses kembali.' }, { status: 410 })
  }

  const blob = await generateQuotationPdfBlob(qtn.id)
  if (!blob) return internalError('Gagal generate PDF')

  const pdfNomor = `${qtn.nomor}${(qtn.revisi ?? 0) > 0 ? `-R${qtn.revisi}` : ''}`
  const isDownload = _request.nextUrl.searchParams.get('download') === '1'
  const disposition = isDownload ? 'attachment' : 'inline'

  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(blob.size),
      'Content-Disposition': `${disposition}; filename="${pdfNomor}.pdf"`,
    },
  })
}
