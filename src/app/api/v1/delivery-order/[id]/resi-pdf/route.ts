import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { notFound, internalError } from '@/lib/api/errors'
import { ResiPengirimanPDF } from '@/lib/pdf/resi-pengiriman'
import { parseHTML } from 'linkedom'
import JsBarcode from 'jsbarcode'

const COMPANY_KEYS = [
  'company_nama', 'company_bidang_usaha', 'company_alamat', 'company_logo_url',
] as const

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

function generateBarcodeSvg(value: string): string {
  const dom = parseHTML('')
  const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  JsBarcode(svg, value, {
    format: 'CODE128',
    width: 1.5,
    height: 30,
    displayValue: false,
    xmlDocument: dom.window.document,
  })
  return svg.outerHTML
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const dayName = DAY_NAMES[d.getDay()]
  return `${dayName} / ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawItem = any

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request)
  if (auth.error) return auth.error
  const { id } = await params

  const { data: sj, error } = await supabaseAdmin
    .from('delivery_order')
    .select('*, sales_order!sales_order_id(nomor, customer_po_id, di_id), kendaraan!kendaraan_id(nama, no_polisi)')
    .eq('id', id)
    .single()
  if (error) return internalError(error)
  if (!sj) return notFound('Delivery Order tidak ditemukan')
  const so = sj.sales_order as { nomor: string; customer_po_id: string | null; di_id: string | null } | null

  // Fetch company settings
  const { data: settingsRows } = await supabaseAdmin
    .from('site_settings')
    .select('key, value')
    .in('key', COMPANY_KEYS as unknown as string[])
  const company: Record<string, string> = {}
  if (settingsRows) {
    for (const row of settingsRows) company[row.key] = row.value
  }

  // Resolve customer name + address
  let customerNama = '-'
  let customerAlamat: string | null = null

  const resolveCustomer = async (customerId: string) => {
    const { data: c } = await supabaseAdmin
      .from('customer')
      .select('nama, alamat')
      .eq('id', customerId)
      .single()
    return c as { nama: string; alamat: string | null } | null
  }

  if (so?.customer_po_id) {
    const { data: po } = await supabaseAdmin
      .from('customer_po')
      .select('customer_id')
      .eq('id', so.customer_po_id)
      .single()
    const poData = po as { customer_id: string } | null
    if (poData?.customer_id) {
      const c = await resolveCustomer(poData.customer_id)
      if (c) { customerNama = c.nama; customerAlamat = c.alamat }
    }
  } else if (so?.di_id) {
    const { data: diRow } = await supabaseAdmin
      .from('di')
      .select('customer_id')
      .eq('id', so.di_id)
      .single()
    const diData = diRow as { customer_id: string } | null
    if (diData?.customer_id) {
      const c = await resolveCustomer(diData.customer_id)
      if (c) { customerNama = c.nama; customerAlamat = c.alamat }
    }
  }

  // Fetch items with packing_number, sorted by urutan
  const { data: rawItems } = await supabaseAdmin
    .from('delivery_order_item')
    .select('id, jumlah, packing_number, urutan, barang!barang_id(nama)')
    .eq('delivery_order_id', id)
    .order('urutan')

  const items: RawItem[] = rawItems ?? []
  if (!items.length) return internalError('Gagal memuat item')

  const kendaraan = sj.kendaraan as { nama: string; no_polisi: string } | null

  // Generate barcode SVG
  const barcodeSvg = generateBarcodeSvg(sj.nomor)

  // Group items by packing_number, using urutan from DB
  const hasPacking = items.some(i => i.packing_number != null)
  let packingGroups: { packingNumber: number; items: { nama: string; jumlah: number; urutan: number }[] }[]

  if (hasPacking) {
    const groups = new Map<number, { nama: string; jumlah: number; urutan: number }[]>()
    for (const item of items) {
      const pn = item.packing_number ?? 0
      if (!groups.has(pn)) groups.set(pn, [])
      groups.get(pn)!.push({
        nama: item.barang?.nama ?? '-',
        jumlah: item.jumlah,
        urutan: item.urutan,
      })
    }
    packingGroups = Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([packingNumber, groupItems]) => ({ packingNumber, items: groupItems }))
  } else {
    // Backward compatible: all items in one group
    packingGroups = [{
      packingNumber: 0,
      items: items.map(i => ({
        nama: i.barang?.nama ?? '-',
        jumlah: i.jumlah,
        urutan: i.urutan,
      })),
    }]
  }

  const pdfData = {
    nomor: sj.nomor,
    hariTanggal: formatDateFull(sj.tanggal),
    customerNama,
    customerAlamat,
    packingGroups,
    kendaraanNama: kendaraan?.nama ?? null,
    kendaraanNoPolisi: kendaraan?.no_polisi ?? null,
    pengirimNama: company.company_nama || 'PT. RIZQI RIDHO ILAHI',
    pengirimBidangUsaha: (company.company_bidang_usaha || '').replace(/\n/g, ', '),
    pengirimAlamat: company.company_alamat || 'Jerukwangi - Bangsri, Jepara',
    barcodeDataUri: barcodeSvg ? svgToDataUri(barcodeSvg) : null,
    logoUrl: company.company_logo_url ?? null,
    companyNama: company.company_nama || 'PT. RIZQI RIDHO ILAHI',
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(ResiPengirimanPDF({ data: pdfData }) as any).toBlob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="RESI-${sj.nomor}.pdf"`,
      },
    })
  } catch {
    return internalError('Gagal generate PDF')
  }
}
