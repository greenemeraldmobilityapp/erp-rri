import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { notFound, internalError } from '@/lib/api/errors'
import { JurnalPDF } from '@/lib/pdf/jurnal'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data: jurnal, error } = await supabaseAdmin.from('jurnal').select('*').eq('id', id).single()
  if (error) return internalError(error)
  if (!jurnal) return notFound('Jurnal tidak ditemukan')

  const { data: items } = await supabaseAdmin.from('jurnal_item').select('*, akun_id!akun_id(kode, nama)').eq('jurnal_id', id)
  if (!items) return internalError('Gagal memuat item jurnal')

  const pdfData = {
    nomor: jurnal.nomor,
    tanggal: new Date(jurnal.tanggal).toLocaleDateString('id-ID'),
    keterangan: jurnal.keterangan,
    items: items.map(i => ({
      akun: (i.akun_id as { kode: string; nama: string }),
      debit: i.debit,
      credit: i.credit,
      keterangan: i.keterangan,
    })),
  }

  try {
    const blob = await pdf(JurnalPDF({ data: pdfData })).toBlob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="JURNAL-${jurnal.nomor}.pdf"`,
      },
    })
  } catch {
    return internalError('Gagal generate PDF')
  }
}
