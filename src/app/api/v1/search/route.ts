import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest } from '@/lib/api/errors'

const schema = z.object({ q: z.string().min(1) })

const routeMap: Record<string, string> = {
  barang: '/dashboard/master/barang',
  supplier: '/dashboard/master/supplier',
  customer: '/dashboard/master/customer',
  karyawan: '/dashboard/master/karyawan',
  purchase_order: '/dashboard/purchase-order',
  purchase_request: '/dashboard/purchase-request',
  invoice: '/dashboard/invoice',
  quotation: '/dashboard/quotation',
  rfq: '/dashboard/rfq',
  sales_order: '/dashboard/sales-order',
  delivery_order: '/dashboard/delivery-order',
  customer_po: '/dashboard/customer-po',
  di: '/dashboard/di',
  grn: '/dashboard/grn',
  faktur_pajak: '/dashboard/faktur-pajak',
  kwitansi: '/dashboard/kwitansi',
  jurnal: '/dashboard/jurnal',
  kontrak: '/dashboard/master/kontrak',
  retur_penjualan: '/dashboard/retur-penjualan',
  retur_pembelian: '/dashboard/retur-pembelian',
  purchase_receiving: '/dashboard/purchase-receiving',
  stock_opname: '/dashboard/inventory/stock-opname',
  supplier_payment: '/dashboard/procurement/supplier-payment',
  negoiasi: '/dashboard/negoiasi',
  absensi: '/dashboard/absensi',
  penggajian: '/dashboard/penggajian',
  coa: '/dashboard/master/coa',
  jabatan: '/dashboard/master/jabatan',
  kategori_barang: '/dashboard/master/kategori-barang',
  customer_pic: '/dashboard/master/pic-customer',
  gudang: '/dashboard/inventory/gudang',
}

const tableConfigs = [
  { table: 'barang', select: 'id, nama, kode', query: (q: string) => supabaseAdmin.from('barang').select('id, nama, kode').or(`nama.ilike.%${q}%,kode.ilike.%${q}%`).limit(5) },
  { table: 'supplier', select: 'id, nama', query: (q: string) => supabaseAdmin.from('supplier').select('id, nama').ilike('nama', `%${q}%`).limit(5) },
  { table: 'customer', select: 'id, nama', query: (q: string) => supabaseAdmin.from('customer').select('id, nama').ilike('nama', `%${q}%`).limit(5) },
  { table: 'karyawan', select: 'id, nama', query: (q: string) => supabaseAdmin.from('karyawan').select('id, nama').ilike('nama', `%${q}%`).limit(5) },
  { table: 'purchase_order', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('purchase_order').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'purchase_request', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('purchase_request').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'sales_order', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('sales_order').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'customer_po', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('customer_po').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'delivery_order', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('delivery_order').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'invoice', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('invoice').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'quotation', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('quotation').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'rfq_supplier', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('rfq_supplier').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'rfq_customer', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('rfq_customer').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'di', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('di').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'grn', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('grn').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'faktur_pajak', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('faktur_pajak').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'kwitansi', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('kwitansi').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'retur_penjualan', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('retur_penjualan').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'retur_pembelian', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('retur_pembelian').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'jurnal', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('jurnal').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'negosiasi', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('negosiasi').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'kontrak', select: 'id, nomor', query: (q: string) => supabaseAdmin.from('kontrak').select('id, nomor').ilike('nomor', `%${q}%`).limit(5) },
  { table: 'absensi', select: 'id, nama', query: (q: string) => supabaseAdmin.from('absensi').select('id, nama').ilike('nama', `%${q}%`).limit(5) },
  { table: 'coa', select: 'id, nama', query: (q: string) => supabaseAdmin.from('coa').select('id, nama').ilike('nama', `%${q}%`).limit(5) },
  { table: 'jabatan', select: 'id, nama', query: (q: string) => supabaseAdmin.from('jabatan').select('id, nama').ilike('nama', `%${q}%`).limit(5) },
  { table: 'kategori_barang', select: 'id, nama', query: (q: string) => supabaseAdmin.from('kategori_barang').select('id, nama').ilike('nama', `%${q}%`).limit(5) },
  { table: 'gudang', select: 'id, nama', query: (q: string) => supabaseAdmin.from('gudang').select('id, nama').ilike('nama', `%${q}%`).limit(5) },
  { table: 'customer_pic', select: 'id, nama', query: (q: string) => supabaseAdmin.from('customer_pic').select('id, nama').ilike('nama', `%${q}%`).limit(5) },
]

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest('Query harus diisi')

  const q = parsed.data.q
  const results: Array<{ table: string; id: string; label: string; href: string }> = []

  const queries = tableConfigs.map(cfg => cfg.query(q))
  const responses = await Promise.allSettled(queries)

  responses.forEach((res, i) => {
    if (res.status === 'fulfilled' && res.value.data) {
      const cfg = tableConfigs[i]
      for (const row of res.value.data) {
        const r = row as { id: string; nomor?: string; nama?: string }
        const label = r.nomor ?? r.nama ?? r.id
        const baseRoute = routeMap[cfg.table]
        if (baseRoute) {
          results.push({ table: cfg.table, id: row.id, label: `[${cfg.table.replace(/_/g, ' ').toUpperCase()}] ${label}`, href: `${baseRoute}/${row.id}` })
        }
      }
    }
  })

  return NextResponse.json({ data: results.slice(0, 30) })
}
