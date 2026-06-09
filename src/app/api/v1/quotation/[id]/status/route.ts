import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'
import { logAudit } from '@/lib/audit'
import { sendEmail } from '@/lib/utils/email'
import { fetchCompanySettings } from '@/lib/email/templates'
import { quotationEmailHtml } from '@/lib/email/templates/quotation'

const VALID_STATUSES = ['draft', 'sent', 'proses_negosiasi', 'approved', 'rejected', 'closed'] as const

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent', 'rejected'],
  sent: ['approved', 'rejected', 'proses_negosiasi'],
  proses_negosiasi: ['approved', 'rejected'],
  approved: ['sent', 'closed'],
  rejected: ['draft'],
  closed: [],
}

function isValidTransition(from: string, to: string): boolean {
  if (from === to) return true
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

const schema = z.object({
  status: z.enum(VALID_STATUSES, { message: 'Status tidak valid' }),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const { data: current } = await supabaseAdmin
    .from('quotation')
    .select('status')
    .eq('id', id)
    .single()

  if (!current) return notFound('Quotation tidak ditemukan')

  if (!isValidTransition(current.status, parsed.data.status)) {
    return badRequest(
      `Status tidak bisa diubah dari '${current.status}' ke '${parsed.data.status}'`
    )
  }

  const updateData: Record<string, unknown> = {
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }

  if (parsed.data.status === 'sent') {
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    updateData.email_access_token = token
    updateData.email_access_token_expires_at = expiresAt
  }

  const { data, error } = await supabaseAdmin
    .from('quotation')
    .update(updateData)
    .eq('id', id)
    .select('*, customer!customer_id(id, nama, kode)')
    .single()

  if (error) return internalError(error)
  if (!data) return notFound('Quotation tidak ditemukan')

  await logAudit({
    userId: auth.user?.id,
    action: 'UPDATE',
    tableName: 'quotation',
    recordId: id,
    changes: { status: { old: current.status, new: parsed.data.status } },
  })

  let emailMessage: string | null = null

  if (parsed.data.status === 'sent') {
    try {
      if (!data.pic_customer_id) {
        emailMessage = 'PIC customer tidak ditemukan'
      } else {
        const { data: pic } = await supabaseAdmin
          .from('customer_pic')
          .select('nama, email')
          .eq('id', data.pic_customer_id)
          .maybeSingle()

        if (!pic?.email) {
          emailMessage = 'PIC customer belum memiliki alamat email'
        } else {
          const company = await fetchCompanySettings()

          const origin = new URL(request.url).origin
          const pdfUrl = `${origin}/api/v1/quotation/public/${data.email_access_token}/pdf`

          const html = quotationEmailHtml({
            nomor: data.nomor,
            referensi: data.referensi,
            perihal: data.perihal,
            tanggal: new Date(data.tanggal).toLocaleDateString('id-ID'),
            customerNama: data.customer?.nama ?? '',
            pdfUrl,
          }, company, pic.nama)

          await sendEmail({
            to: pic.email,
            toNama: pic.nama,
            subject: `Quotation: ${data.nomor} - ${data.perihal}`,
            html,
            referenceType: 'quotation',
            referenceId: id,
          })
          emailMessage = `Email terkirim ke ${pic.nama} (${pic.email})`
        }
      }
    } catch (err) {
      emailMessage = `Email gagal: ${err instanceof Error ? err.message : 'Unknown error'}`
    }
  }

  return NextResponse.json({
    data,
    ...(emailMessage ? { message: emailMessage } : {}),
  })
}
