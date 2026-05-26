import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound } from '@/lib/api/errors'

const importItemSchema = z.object({
  kode: z.string().min(1, 'Kode barang harus diisi'),
  nama: z.string().min(1, 'Nama barang harus diisi'),
  satuan: z.string().min(1, 'Satuan harus diisi'),
  harga: z.number().nonnegative('Harga harus >= 0'),
})

const schema = z.object({
  kontrakId: z.string().min(1, 'Kontrak harus dipilih'),
  kategoriId: z.string().min(1, 'Kategori harus dipilih'),
  items: z.array(importItemSchema).min(1, 'Minimal 1 item'),
})

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const { kontrakId, kategoriId, items } = parsed.data

  const { error: kontrakError } = await supabaseAdmin
    .from('kontrak')
    .select('id, nama')
    .eq('id', kontrakId)
    .single()

  if (kontrakError) return notFound('Kontrak tidak ditemukan')

  const imported: Array<{ kode: string; barangId: string; kontrakItemId: string }> = []
  const errors: Array<{ kode: string; error: string }> = []

  for (const item of items) {
    try {
      const { data: existing } = await supabaseAdmin
        .from('barang')
        .select('id')
        .eq('kode', item.kode)
        .eq('kontrak_id', kontrakId)
        .maybeSingle()

      if (existing) {
        errors.push({ kode: item.kode, error: 'Kode barang sudah ada di kontrak ini' })
        continue
      }

      const { data: newBarang, error: barangError } = await supabaseAdmin
        .from('barang')
        .insert({
          kode: item.kode,
          nama: item.nama,
          satuan: item.satuan,
          kategori_id: kategoriId,
          harga_jual_default: item.harga,
          stok_minimum: 0,
          is_active: true,
          kontrak_id: kontrakId,
        })
        .select()
        .single()

      if (barangError || !newBarang) {
        errors.push({ kode: item.kode, error: barangError?.message || 'Gagal membuat barang' })
        continue
      }

      const { data: kontrakItem, error: itemError } = await supabaseAdmin
        .from('kontrak_item')
        .insert({
          kontrak_id: kontrakId,
          barang_id: newBarang.id,
          kode_barang: item.kode,
          nama_barang: item.nama,
          satuan: item.satuan,
          harga_satuan: item.harga,
          ppn_include: true,
        })
        .select()
        .single()

      if (itemError) {
        errors.push({ kode: item.kode, error: 'Barang tersimpan tapi gagal membuat item kontrak: ' + itemError.message })
        continue
      }

      imported.push({ kode: item.kode, barangId: newBarang.id, kontrakItemId: kontrakItem.id })
    } catch (err) {
      errors.push({ kode: item.kode, error: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  return NextResponse.json({
    data: {
      success: errors.length === 0,
      imported: imported.length,
      items: imported,
      errors: errors.length > 0 ? errors : undefined,
    },
  })
}
