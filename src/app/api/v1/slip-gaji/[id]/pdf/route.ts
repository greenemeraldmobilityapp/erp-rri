import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { notFound, internalError } from '@/lib/api/errors'
import { SlipGajiPDF } from '@/lib/pdf/slip-gaji'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data: pg, error } = await supabaseAdmin.from('penggajian').select('*, karyawan!karyawan_id(nama, nik)').eq('id', id).single()
  if (error) return internalError(error)
  if (!pg) return notFound('Penggajian tidak ditemukan')
  const pdfData = {
    nomor: pg.nomor,
    karyawan_nama: (pg.karyawan as { nama: string })?.nama ?? '-',
    karyawan_nik: (pg.karyawan as { nik: string })?.nik ?? '-',
    bulan: pg.bulan,
    tahun: pg.tahun,
    gaji_pokok: pg.gaji_pokok,
    tunjangan: pg.tunjangan ?? 0,
    potongan: pg.potongan ?? 0,
    gaji_bersih: pg.gaji_bersih,
    tanggal_pembayaran: pg.tanggal_pembayaran ? new Date(pg.tanggal_pembayaran).toLocaleDateString('id-ID') : null,
  }

  try {
    const blob = await pdf(SlipGajiPDF({ data: pdfData })).toBlob()
    return new NextResponse(blob, {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="SLIP-GAJI-${pg.nomor}.pdf"` },
    })
  } catch { return internalError('Gagal generate PDF') }
}
