import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError, notFound } from '@/lib/api/errors'
import { storageService } from '@/lib/storage'
import { supabaseAdmin } from '@/lib/api/supabase-server'

function extractStoragePath(url: string): string | null {
  const r2Match = url.match(/^https:\/\/files\.erp\.pt-rri\.com\/(.+)/)
  if (r2Match) return r2Match[1]
  const supabaseMatch = url.match(/\/public\/dokumen\/(.+)/)
  if (supabaseMatch) return supabaseMatch[1]
  return null
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params

  const { data: barang } = await supabaseAdmin
    .from('barang').select('id, image_url').eq('id', id).single()
  if (!barang) return notFound('Barang tidak ditemukan')

  const formData = await request.formData().catch(() => null)
  if (!formData) return badRequest('Invalid form data')

  const file = formData.get('file') as File | null
  if (!file) return badRequest('File harus diupload')

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) return badRequest('Ukuran file maksimal 5MB')

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) return badRequest('Gambar harus JPG, PNG, atau WebP')

  if (barang.image_url) {
    const path = extractStoragePath(barang.image_url)
    if (path) {
      await storageService.delete(path).catch(() => {})
    }
  }

  const timestamp = Date.now()
  const filePath = `barang/${id}/${timestamp}-foto-1.webp`
  const buffer = Buffer.from(await file.arrayBuffer())

  let uploadResult
  try {
    uploadResult = await storageService.upload(buffer, filePath, 'image/webp')
  } catch (err) {
    return internalError('Gagal upload file: ' + (err instanceof Error ? err.message : 'unknown error'))
  }

  await supabaseAdmin
    .from('barang')
    .update({ image_url: uploadResult.webViewLink, updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ data: { fileUrl: uploadResult.webViewLink } })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params

  const { data: barang } = await supabaseAdmin
    .from('barang').select('id, image_url').eq('id', id).single()
  if (!barang) return notFound('Barang tidak ditemukan')

  if (barang.image_url) {
    const path = extractStoragePath(barang.image_url)
    if (path) {
      await storageService.delete(path)
    }
  }

  await supabaseAdmin
    .from('barang')
    .update({ image_url: null, updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ data: { message: 'Gambar berhasil dihapus' } })
}
