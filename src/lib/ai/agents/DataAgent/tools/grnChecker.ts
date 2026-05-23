import { supabaseAdmin } from '@/lib/api/supabase-server'

export interface GRNCheckInput {
  grn_id: string
  delivery_order_id?: string
}

export interface GRNCheckResult {
  grn_id: string
  quality_status: 'PASS' | 'FAIL' | 'REVIEW_REQUIREED'
  stock_status: 'UPDATED' | 'PENDING' | 'ERROR'
  items_check: Array<{
    barang_id: string
    barang_nama: string
    expected_qty: number
    received_qty: number
    variance: number
    variance_percent: number
    status: 'OK' | 'SHORT' | 'OVER' | 'MISSING'
  }>
  quality_issues: string[]
  stock_update_result: {
    success: boolean
    updated_items: number
    error_message?: string
  }
  recommendations: string[]
  created_at: string
}

export async function checkGRN(input: GRNCheckInput): Promise<GRNCheckResult> {
  const { data: grn } = await supabaseAdmin
    .from('grn')
    .select('*')
    .eq('id', input.grn_id)
    .single()

  if (!grn) {
    throw new Error('GRN tidak ditemukan')
  }

  const { data: grnItems } = await supabaseAdmin
    .from('grn_item')
    .select('*, barang!barang_id(id, nama, kode, stok_minimum)')
    .eq('grn_id', input.grn_id)

  const itemsCheck: GRNCheckResult['items_check'] = []
  const qualityIssues: string[] = []

  for (const item of grnItems ?? []) {
    const expected = (item as { jumlah_dipesan?: number }).jumlah_dipesan ?? (item as { jumlah: number }).jumlah
    const received = (item as { jumlah_diterima: number }).jumlah_diterima
    const variance = received - expected
    const variancePercent = expected > 0 ? Math.abs(variance / expected) * 100 : 0

    let status: 'OK' | 'SHORT' | 'OVER' | 'MISSING'
    if (variance === 0) {
      status = 'OK'
    } else if (variance < 0) {
      status = 'SHORT'
      qualityIssues.push(`Kurang ${Math.abs(variance)} unit ${(item.barang as { nama: string }).nama}`)
    } else {
      status = 'OVER'
      qualityIssues.push(`Kelebihan ${variance} unit ${(item.barang as { nama: string }).nama}`)
    }

    if (variancePercent > 20) {
      qualityIssues.push(`Variance >20% untuk ${(item.barang as { nama: string }).nama} - perlu review`)
    }

    itemsCheck.push({
      barang_id: (item.barang as { id: string }).id,
      barang_nama: (item.barang as { nama: string }).nama,
      expected_qty: expected,
      received_qty: received,
      variance,
      variance_percent: Math.round(variancePercent * 100) / 100,
      status,
    })
  }

  let qualityStatus: 'PASS' | 'FAIL' | 'REVIEW_REQUIREED' = 'PASS'
  if (qualityIssues.some(i => i.includes('MISSING'))) {
    qualityStatus = 'FAIL'
  } else if (qualityIssues.length > 0) {
    qualityStatus = 'REVIEW_REQUIRED'
  }

  let stockUpdated = false
  let stockError: string | undefined

  if (qualityStatus !== 'FAIL') {
    try {
      for (const item of itemsCheck) {
        if (item.status === 'MISSING') continue

        const { data: currentStok } = await supabaseAdmin
          .from('stok')
          .select('jumlah')
          .eq('barang_id', item.barang_id)
        .single()

        if (currentStok) {
          await supabaseAdmin
            .from('stok')
            .update({
              jumlah: (currentStok.jumlah ?? 0) + item.received_qty,
              last_mutasi: new Date().toISOString(),
            })
            .eq('barang_id', item.barang_id)
        } else {
          await supabaseAdmin.from('stok').insert({
            barang_id: item.barang_id,
            gudang_id: (grn as { gudang_id?: string }).gudang_id,
            jumlah: item.received_qty,
          })
        }

        await supabaseAdmin.from('stok_mutasi').insert({
          barang_id: item.barang_id,
          gudang_id: (grn as { gudang_id?: string }).gudang_id,
          tipe: 'masuk',
          jumlah: item.received_qty,
          ref_jenis: 'grn',
          ref_id: input.grn_id,
          keterangan: `GRN Receipt - variance ${item.variance >= 0 ? '+' : ''}${item.variance}`,
        })
      }
      stockUpdated = true
    } catch (err) {
      stockError = err instanceof Error ? err.message : 'Unknown error'
    }
  }

  const recommendations: string[] = []
  if (qualityStatus === 'REVIEW_REQUIREED') {
    recommendations.push('Quality review diperlukan sebelum proceed')
  }
  if (qualityStatus === 'FAIL') {
    recommendations.push('HOLD shipment - contact supplier untuk retur')
    recommendations.push('Document shortage untuk claim')
  }
  if (stockUpdated) {
    recommendations.push('Stock berhasil di-update')
    recommendations.push('Verify stock levels di inventory')
  }
  if (itemsCheck.some(i => i.status === 'SHORT')) {
    recommendations.push('Initiate short shipment claim ke supplier')
  }

  return {
    grn_id: input.grn_id,
    quality_status: qualityStatus,
    stock_status: stockUpdated ? 'UPDATED' : stockError ? 'ERROR' : 'PENDING',
    items_check: itemsCheck,
    quality_issues: qualityIssues,
    stock_update_result: {
      success: stockUpdated,
      updated_items: stockUpdated ? itemsCheck.filter(i => i.status !== 'MISSING').length : 0,
      error_message: stockError,
    },
    recommendations,
    created_at: new Date().toISOString(),
  }
}