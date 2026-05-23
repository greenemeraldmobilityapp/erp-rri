import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, notFound, internalError } from '@/lib/api/errors'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(req)
  if (auth.error) return auth.error
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('rfq_document')
    .select('*')
    .eq('rfq_id', id)
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

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) return badRequest('Ukuran file maksimal 10MB')

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
  if (!allowedTypes.includes(file.type)) return badRequest('Tipe file tidak didukung. Gunakan PDF, JPG, PNG, WebP, atau Excel')

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = `dokumen/rfq/${id}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabaseAdmin.storage.from('dokumen').upload(fileName, buffer, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) return internalError('Gagal upload file: ' + uploadError.message)

  const { data: { publicUrl } } = supabaseAdmin.storage.from('dokumen').getPublicUrl(fileName)

  const { data: doc, error: dbError } = await supabaseAdmin
    .from('rfq_document')
    .insert({
      id: crypto.randomUUID(),
      rfq_id: id,
      file_name: file.name,
      file_url: publicUrl,
    })
    .select()
    .single()

  if (dbError) {
    await supabaseAdmin.storage.from('dokumen').remove([fileName])
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
    .from('rfq_document')
    .select('*')
    .eq('id', docId)
    .eq('rfq_id', id)
    .single()

  if (findError || !doc) return notFound('Dokumen tidak ditemukan')

  const filePath = doc.file_url.replace(/^.+\/(dokumen\/rfq\/.+)$/, '$1')

  await supabaseAdmin.storage.from('dokumen').remove([filePath])

  const { error: delError } = await supabaseAdmin
    .from('rfq_document')
    .delete()
    .eq('id', docId)

  if (delError) return internalError(delError)
  return NextResponse.json({ message: 'Dokumen berhasil dihapus' })
}
