/**
 * @openapi
 * /api/v1/retur-penjualan/{id}:
 *   get:
 *     tags: [Retur]
 *     summary: Detail retur penjualan
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retur penjualan detail
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   put:
 *     tags: [Retur]
 *     summary: Update retur penjualan
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Retur penjualan updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     tags: [Retur]
 *     summary: Hapus retur penjualan
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Retur penjualan deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'
import { formatChildNumber } from '@/lib/utils/document-number'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(_request); if (auth.error) return auth.error
  const { id } = await params
  const { data: retur, error } = await supabaseAdmin.from('retur_penjualan').select('*, customer!customer_id(nama, kode)').eq('id', id).single()
  if (error) return internalError(error)
  if (!retur) return notFound('Retur tidak ditemukan')
  const { data: items } = await supabaseAdmin.from('retur_penjualan_item').select('*, barang!barang_id(nama, kode, satuan)').eq('retur_penjualan_id', id)
  return NextResponse.json({ data: { ...retur, items: items ?? [] } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const upd: Record<string, unknown> = {}
  if (body.status) upd.status = body.status; if (body.keterangan !== undefined) upd.keterangan = body.keterangan
  upd.updated_at = new Date().toISOString()
  const { data, error } = await supabaseAdmin.from('retur_penjualan').update(upd).eq('id', id).select('*, customer!customer_id(nama, kode)').single()
  if (error) return internalError(error); if (!data) return notFound('Retur tidak ditemukan')

  if (body.items) {
    await supabaseAdmin.from('retur_penjualan_item').delete().eq('retur_penjualan_id', id)
    const now = new Date().toISOString()
    const barangIds = [...new Set(body.items.map((i: { barang_id: string }) => i.barang_id))]
    const { data: barangList } = await supabaseAdmin.from('barang').select('id, nama, kode, satuan').in('id', barangIds)
    const barangMap = new Map((barangList ?? []).map((b: { id: string; nama: string; kode: string; satuan: string }) => [b.id, b]))
    const items = body.items.map((i: { barang_id: string; jumlah: number; keterangan?: string }) => {
      const b = barangMap.get(i.barang_id)
      return {
        retur_penjualan_id: id, barang_id: i.barang_id, jumlah: i.jumlah,
        nama_barang: b?.nama ?? null, kode_barang: b?.kode ?? null, satuan: b?.satuan ?? null,
        keterangan: i.keterangan ?? null, created_at: now, updated_at: now,
      }
    })
    const { error: ie } = await supabaseAdmin.from('retur_penjualan_item').insert(items)
    if (ie) return internalError(ie)
  }

  // Auto-generate GRN Customer draft when retur penjualan is closed
  if (body.status === 'closed') {
    // Idempotency check: skip if GRNC already exists for this retur
    const { data: existingGrn } = await supabaseAdmin.from('grn_customer').select('id').eq('retur_penjualan_id', id).maybeSingle()
    if (!existingGrn) {
      const { data: items } = await supabaseAdmin.from('retur_penjualan_item').select('*').eq('retur_penjualan_id', id)
      if (items && items.length > 0) {
        const nomor = formatChildNumber(data.nomor, 'GRNC')
        const now = new Date().toISOString()

        // Look up gudang from the DO linked to this retur; fallback ke null
        let gudangId: string | null = null
        if (data.delivery_order_id) {
          const { data: doDoc } = await supabaseAdmin.from('delivery_order').select('gudang_id').eq('id', data.delivery_order_id).single()
          if (doDoc) gudangId = doDoc.gudang_id
        }

        const { data: grn } = await supabaseAdmin.from('grn_customer').insert({
          nomor, retur_penjualan_id: id, customer_id: data.customer_id, gudang_id: gudangId,
          tanggal: new Date().toISOString(), status: 'draft',
          keterangan: `Auto-generated from Retur Penjualan ${data.nomor}`,
          created_at: now, updated_at: now,
        }).select().single()

        if (grn) {
          // Get barang master for snapshot fields fallback
          const barangIds = [...new Set(items.map(i => i.barang_id))]
          const { data: barangList } = await supabaseAdmin.from('barang').select('id, nama, kode, satuan').in('id', barangIds)
          const barangMap = new Map((barangList ?? []).map(b => [b.id, b]))

          const grnItems = items.map((i: { barang_id: string; jumlah: number; nama_barang?: string | null; kode_barang?: string | null; satuan?: string | null }, idx: number) => {
            const b = barangMap.get(i.barang_id)
            return {
              grn_customer_id: grn.id, barang_id: i.barang_id, jumlah: i.jumlah,
              nama_barang: i.nama_barang ?? b?.nama ?? null,
              kode_barang: i.kode_barang ?? b?.kode ?? null,
              satuan: i.satuan ?? b?.satuan ?? null,
              urutan: idx + 1, created_at: now, updated_at: now,
            }
          })
          await supabaseAdmin.from('grn_customer_item').insert(grnItems)
        }
      }
    }
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error
  const { id } = await params
  await supabaseAdmin.from('retur_penjualan_item').delete().eq('retur_penjualan_id', id)
  const { error } = await supabaseAdmin.from('retur_penjualan').delete().eq('id', id)
  if (error) return internalError(error)
  return new NextResponse(null, { status: 204 })
}
