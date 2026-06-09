import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api/auth'
import { notFound } from '@/lib/api/errors'
import { generateQuotationPdfBlob } from '@/lib/pdf/generate-quotation-pdf'
import { supabaseAdmin } from '@/lib/api/supabase-server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error
  const { id } = await params

  const blob = await generateQuotationPdfBlob(id)
  if (!blob) return notFound('Quotation tidak ditemukan atau gagal generate PDF')

  const { data: qtn } = await supabaseAdmin
    .from('quotation')
    .select('nomor, revisi')
    .eq('id', id)
    .single()

  const pdfNomor = qtn ? `${qtn.nomor}${(qtn.revisi ?? 0) > 0 ? `-R${qtn.revisi}` : ''}` : 'quotation'

  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(blob.size),
      'Content-Disposition': `inline; filename="${pdfNomor}.pdf"`,
    },
  })
}
