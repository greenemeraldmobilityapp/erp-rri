import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'
import { storageService } from '@/lib/storage'

const TYPES = ['barang_diterima', 'surat_jalan'] as const

const schema = z.object({
  type: z.enum(TYPES),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params

  const { data: doDoc } = await supabaseAdmin
    .from('delivery_order')
    .select('id, nomor, status, foto_barang_diterima_url, foto_surat_jalan_url')
    .eq('id', id)
    .single()
  if (!doDoc) return notFound('Delivery Order tidak ditemukan')
  if (doDoc.status !== 'awaiting_pickup') return badRequest('Status DO harus Siap Kirim (awaiting_pickup)')

  const formData = await request.formData().catch(() => null)
  if (!formData) return badRequest('Invalid form data')

  const file = formData.get('file') as File | null
  if (!file) return badRequest('File harus diupload')

  const type = formData.get('type') as string | null
  const parsed = schema.safeParse({ type })
  if (!parsed.success) return badRequest('Tipe foto harus barang_diterima atau surat_jalan')

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) return badRequest('Ukuran file maksimal 5MB')

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) return badRequest('Gambar harus JPG, PNG, atau WebP')

  const existingUrl = parsed.data.type === 'barang_diterima'
    ? doDoc.foto_barang_diterima_url
    : doDoc.foto_surat_jalan_url

  if (existingUrl) {
    const match = existingUrl.match(/\/public\/dokumen\/(.+)/)
    if (match) {
      await storageService.delete(match[1]).catch(() => {})
    }
  }

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `dokumen/delivery-order/${id}/${parsed.data.type}-${timestamp}-${safeName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  let uploadResult
  try {
    uploadResult = await storageService.upload(buffer, filePath, file.type)
  } catch (err) {
    return internalError('Gagal upload file: ' + (err instanceof Error ? err.message : 'unknown error'))
  }

  const column = parsed.data.type === 'barang_diterima' ? 'foto_barang_diterima_url' : 'foto_surat_jalan_url'
  await supabaseAdmin
    .from('delivery_order')
    .update({ [column]: uploadResult.webViewLink, updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ data: { fileUrl: uploadResult.webViewLink } })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const type = request.nextUrl.searchParams.get('type')
  if (!type || !TYPES.includes(type as typeof TYPES[number])) {
    return badRequest('Query parameter type harus barang_diterima atau surat_jalan')
  }

  const { data: doDoc } = await supabaseAdmin
    .from('delivery_order')
    .select('id, foto_barang_diterima_url, foto_surat_jalan_url')
    .eq('id', id)
    .single()
  if (!doDoc) return notFound('Delivery Order tidak ditemukan')

  const url = type === 'barang_diterima' ? doDoc.foto_barang_diterima_url : doDoc.foto_surat_jalan_url
  if (!url) return NextResponse.json({ data: { message: 'Tidak ada foto untuk dihapus' } })

  const match = url.match(/\/public\/dokumen\/(.+)/)
  if (match) {
    await storageService.delete(match[1]).catch(() => {})
  }

  const column = type === 'barang_diterima' ? 'foto_barang_diterima_url' : 'foto_surat_jalan_url'
  await supabaseAdmin
    .from('delivery_order')
    .update({ [column]: null, updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ data: { message: 'Foto berhasil dihapus' } })
}
