import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'
import { storageService } from '@/lib/storage'

const TABLE = 'customer_po_document'
const FK_COL = 'customer_po_id'
const STORAGE_PREFIX = 'dokumen/customer-po'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(req)
  if (auth.error) return auth.error
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('*')
    .eq(FK_COL, id)
    .order('uploaded_at', { ascending: false })

  if (error) return internalError(error)
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params

  const formData = await request.formData().catch(() => null)
  if (!formData) return badRequest('Invalid form data')

  const file = formData.get('file') as File | null
  if (!file) return badRequest('File harus diupload')

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) return badRequest('Ukuran file maksimal 10MB')

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) return badRequest('Tipe file tidak didukung')

  const buffer = Buffer.from(await file.arrayBuffer())
  const filePath = `${STORAGE_PREFIX}/${id}/${file.name}`

  let uploadResult
  try {
    uploadResult = await storageService.upload(buffer, filePath, file.type)
  } catch (err) {
    return internalError('Gagal upload file: ' + (err instanceof Error ? err.message : 'unknown error'))
  }

  const { data: doc, error: dbError } = await supabaseAdmin
    .from(TABLE)
    .insert({
      id: crypto.randomUUID(),
      [FK_COL]: id,
      file_name: file.name,
      file_url: uploadResult.webViewLink,
      drive_file_id: uploadResult.fileId,
    })
    .select()
    .single()

  if (dbError) {
    await storageService.delete(uploadResult.fileId).catch(() => {})
    return internalError('Gagal menyimpan: ' + dbError.message)
  }

  return NextResponse.json({ data: doc }, { status: 201 })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const docId = searchParams.get('docId')
  if (!docId) return badRequest('docId diperlukan')

  const { data: doc, error: findError } = await supabaseAdmin
    .from(TABLE)
    .select('*')
    .eq('id', docId)
    .eq(FK_COL, id)
    .single()

  if (findError || !doc) return notFound('Dokumen tidak ditemukan')

  if (doc.drive_file_id) {
    await storageService.delete(doc.drive_file_id).catch(() => {})
  }

  const { error: delError } = await supabaseAdmin
    .from(TABLE)
    .delete()
    .eq('id', docId)

  if (delError) return internalError(delError)
  return NextResponse.json({ message: 'Dokumen berhasil dihapus' })
}
