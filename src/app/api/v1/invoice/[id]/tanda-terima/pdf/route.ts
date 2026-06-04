import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { notFound, internalError } from '@/lib/api/errors'
import { generateGlobalDocumentNumber } from '@/lib/utils/document-number'
import { TandaTerimaPDF } from '@/lib/pdf/tanda-terima'

const COMPANY_KEYS = [
  'company_nama', 'company_bidang_usaha', 'company_alamat',
  'company_no_hp', 'company_email', 'company_logo_url',
  'penandatangan_nama', 'penandatangan_jabatan', 'penandatangan_no_hp',
  'tanda_tangan_stempel_url',
] as const

interface DokumenRow {
  nama: string
  nomor: string
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data: inv, error } = await supabaseAdmin
    .from('invoice')
    .select('nomor, sales_order_id, customer!customer_id(nama), nomor_tanda_terima, grn_customer_nomor')
    .eq('id', id)
    .single()
  if (error) return internalError(error)
  if (!inv) return notFound('Invoice tidak ditemukan')

  const customer = inv.customer as unknown as { nama: string } | null

  let referensiJenis: string | null = null
  let referensiNomor: string | null = null
  let rfqNomor: string | null = null
  let quotationNomor: string | null = null
  let poNomor: string | null = null
  let kontrakNomor: string | null = null
  let diNomor: string | null = null
  let doNomor: string | null = null
  let deliverySlipNomor: string | null = null
  let kwitansiNomor: string | null = null

  if (inv.sales_order_id) {
    const { data: so } = await supabaseAdmin
      .from('sales_order')
      .select('nomor, customer_po_id, di_id')
      .eq('id', inv.sales_order_id)
      .single()

    if (so) {
      if (so.customer_po_id) {
        const { data: po } = await supabaseAdmin
          .from('customer_po')
          .select('nomor_po_customer, quotation_id')
          .eq('id', so.customer_po_id)
          .single()
        if (po) {
          poNomor = po.nomor_po_customer
          referensiJenis = 'PO'
          referensiNomor = po.nomor_po_customer

          if (po.quotation_id) {
            const { data: q } = await supabaseAdmin
              .from('quotation')
              .select('nomor, rfq_id')
              .eq('id', po.quotation_id)
              .single()
            if (q) {
              quotationNomor = q.nomor
              if (q.rfq_id) {
                const { data: rfq } = await supabaseAdmin
                  .from('rfq_customer')
                  .select('nomor')
                  .eq('id', q.rfq_id)
                  .single()
                if (rfq) rfqNomor = rfq.nomor
              }
            }
          }
        }
      }

      if (so.di_id) {
        const { data: diDoc } = await supabaseAdmin
          .from('di')
          .select('nomor_di_customer, kontrak_id')
          .eq('id', so.di_id)
          .single()
        if (diDoc) {
          diNomor = diDoc.nomor_di_customer
          referensiJenis = 'DI'
          referensiNomor = diDoc.nomor_di_customer

          if (diDoc.kontrak_id) {
            const { data: k } = await supabaseAdmin
              .from('kontrak')
              .select('nomor_kontrak')
              .eq('id', diDoc.kontrak_id)
              .single()
            if (k) kontrakNomor = k.nomor_kontrak
          }
        }
      }
    }

    const { data: doDocs } = await supabaseAdmin
      .from('delivery_order')
      .select('nomor, delivery_slip_nomor')
      .eq('sales_order_id', inv.sales_order_id)
      .limit(1)
    if (doDocs && doDocs.length > 0) {
      doNomor = doDocs[0].nomor
      deliverySlipNomor = doDocs[0].delivery_slip_nomor
    }
  }

  const { data: kwitansiDocs } = await supabaseAdmin
    .from('kwitansi')
    .select('nomor')
    .eq('invoice_id', id)
    .limit(1)
  if (kwitansiDocs && kwitansiDocs.length > 0) {
    kwitansiNomor = kwitansiDocs[0].nomor
  }

  const { data: settingsRows } = await supabaseAdmin
    .from('site_settings')
    .select('key, value')
    .in('key', COMPANY_KEYS as unknown as string[])
  const company: Record<string, string> = {}
  if (settingsRows) {
    for (const row of settingsRows) {
      company[row.key] = row.value
    }
  }

  let nomor = inv.nomor_tanda_terima
  if (!nomor) {
    nomor = await generateGlobalDocumentNumber('TT')
    await supabaseAdmin.from('invoice').update({ nomor_tanda_terima: nomor }).eq('id', id)
  }

  const now = new Date()
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const tanggalStr = `Jepara, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`

  const dash = '-'

  const dokumenList: DokumenRow[] = [
    { nama: 'Tanda Terima', nomor: nomor },
    { nama: 'RFQ', nomor: rfqNomor ?? dash },
    { nama: 'SPH', nomor: quotationNomor ?? dash },
    { nama: 'PO', nomor: poNomor ?? dash },
    { nama: 'Kontrak', nomor: kontrakNomor ?? dash },
    { nama: 'DI', nomor: diNomor ?? dash },
    { nama: 'Delivery Slip', nomor: deliverySlipNomor ?? dash },
    { nama: 'Surat Jalan', nomor: doNomor ?? dash },
    { nama: 'GRN', nomor: inv.grn_customer_nomor ?? dash },
    { nama: 'Invoice', nomor: inv.nomor },
    { nama: 'Kwitansi', nomor: kwitansiNomor ?? dash },
  ]

  const pdfData = {
    nomor,
    nomorInvoice: inv.nomor,
    referensiJenis,
    referensiNomor,
    tanggal: tanggalStr,
    customerNama: customer?.nama ?? '-',
    company: {
      company_nama: company.company_nama ?? null,
      company_bidang_usaha: company.company_bidang_usaha ?? null,
      company_alamat: company.company_alamat ?? null,
      company_no_hp: company.company_no_hp ?? null,
      company_email: company.company_email ?? null,
      company_logo_url: company.company_logo_url ?? null,
      penandatangan_nama: company.penandatangan_nama ?? null,
      penandatangan_jabatan: company.penandatangan_jabatan ?? null,
      penandatangan_no_hp: company.penandatangan_no_hp ?? null,
      tanda_tangan_stempel_url: company.tanda_tangan_stempel_url ?? null,
    },
    dokumenList,
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(TandaTerimaPDF({ data: pdfData }) as any).toBlob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(blob.size),
        'Content-Disposition': `inline; filename="${nomor}.pdf"`,
      },
    })
  } catch (e) {
    console.error('PDF generation error:', e)
    const msg = e instanceof Error ? e.message : 'Gagal generate PDF'
    return NextResponse.json({ error: msg, code: 'PDF_GENERATION_ERROR' }, { status: 500 })
  }
}
