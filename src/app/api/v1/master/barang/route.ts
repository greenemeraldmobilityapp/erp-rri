import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'

const schema = z.object({
  nama: z.string().min(1, 'Nama barang harus diisi'),
  kode: z.string().min(1, 'Kode barang harus diisi'),
  kategori_id: z.string().min(1, 'Kategori harus dipilih'),
  satuan: z.string().min(1, 'Satuan harus diisi'),
  spesifikasi: z.string().optional(),
  justification: z.string().optional(),
  image_url: z.string().optional(),
  harga_beli_default: z.coerce.number().nonnegative().optional(),
  harga_jual_default: z.coerce.number().nonnegative().optional(),
  stok_minimum: z.coerce.number().nonnegative().default(0),
  barcode: z.string().optional(),
  is_active: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '20')))
  const search = searchParams.get('search') ?? ''
  const kategoriId = searchParams.get('kategori_id') ?? ''
  const status = searchParams.get('status') ?? 'all'
  const kontrak = searchParams.get('kontrak') ?? 'all'
  const satuanFilter = searchParams.get('satuan') ?? ''
  const namaKontrak = searchParams.get('nama_kontrak') ?? ''

  const offset = (page - 1) * limit

  let query = supabaseAdmin.from('barang').select('*, kategori_barang!kategori_id(nama)', { count: 'exact' })

  if (search) {
    query = query.or(`nama.ilike.%${search}%,kode.ilike.%${search}%`)
  }

  if (kategoriId && kategoriId !== '__all__') {
    query = query.eq('kategori_id', kategoriId)
  }

  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'non-active') {
    query = query.eq('is_active', false)
  }

  if (kontrak === 'has') {
    query = query.not('kontrak_id', 'is', null)
  } else if (kontrak === 'none') {
    query = query.is('kontrak_id', null)
  }

  if (satuanFilter && satuanFilter !== '__all__') {
    query = query.eq('satuan', satuanFilter)
  }

  if (namaKontrak && namaKontrak !== '__all__') {
    const { data: kiIds } = await supabaseAdmin
      .from('kontrak_item')
      .select('barang_id')
      .eq('nama_kontrak', namaKontrak)

    const { data: kinaIds } = await supabaseAdmin
      .from('kontrak_item_not_approve')
      .select('barang_id')
      .eq('nama_kontrak', namaKontrak)

    const ids = [
      ...(kiIds?.map(r => r.barang_id).filter(Boolean) ?? []),
      ...(kinaIds?.map(r => r.barang_id).filter(Boolean) ?? []),
    ]

    if (ids.length > 0) {
      query = query.in('id', ids)
    } else {
      return NextResponse.json({
        data: { items: [], count: 0, page, totalPages: 0, filterOptions: {} }
      })
    }
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data: items, error, count } = await query

  if (error) return internalError(error)

  const totalPages = Math.ceil((count ?? 0) / limit)

  const { data: categories } = await supabaseAdmin
    .from('kategori_barang')
    .select('id, nama')
    .order('nama')

  const { data: satuanRows } = await supabaseAdmin
    .from('barang')
    .select('satuan')
    .not('satuan', 'is', null)
    .order('satuan')

  const satuanList = [...new Set(satuanRows?.map(r => r.satuan).filter(Boolean) as string[])]

  const { data: kiNama } = await supabaseAdmin
    .from('kontrak_item')
    .select('nama_kontrak')
    .not('nama_kontrak', 'is', null)
    .order('nama_kontrak')

  const { data: kinaNama } = await supabaseAdmin
    .from('kontrak_item_not_approve')
    .select('nama_kontrak')
    .not('nama_kontrak', 'is', null)
    .order('nama_kontrak')

  const namaKontrakList = [
    ...new Set([
      ...(kiNama?.map(r => r.nama_kontrak).filter(Boolean) as string[] ?? []),
      ...(kinaNama?.map(r => r.nama_kontrak).filter(Boolean) as string[] ?? []),
    ]),
  ]

  return NextResponse.json({
    data: {
      items: items ?? [],
      count: count ?? 0,
      page,
      totalPages,
      filterOptions: {
        categories: categories ?? [],
        satuanList,
        namaKontrakList,
      },
    },
  })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON body')

  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const { data, error } = await supabaseAdmin.from('barang').insert(parsed.data).select('*, kategori_barang!kategori_id(nama)').single()
  if (error) return internalError(error)
  return NextResponse.json({ data }, { status: 201 })
}
