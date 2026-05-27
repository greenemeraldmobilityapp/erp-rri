import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api/auth'
import { badRequest, internalError } from '@/lib/api/errors'
import { storageService } from '@/lib/storage'

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const formData = await request.formData().catch(() => null)
  if (!formData) return badRequest('Invalid form data')

  const file = formData.get('file') as File | null
  const customerName = formData.get('customerName') as string | null
  const nomorRfqCustomer = formData.get('nomorRfqCustomer') as string | null
  const type = formData.get('type') as string | null

  if (!file) return badRequest('File harus diupload')
  if (!customerName || !nomorRfqCustomer) return badRequest('customerName dan nomorRfqCustomer diperlukan')
  if (!type || !['rfq', 'gambar'].includes(type)) return badRequest('type harus rfq atau gambar')

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) return badRequest('Ukuran file maksimal 10MB')

  if (type === 'gambar') {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedImageTypes.includes(file.type)) return badRequest('Gambar harus JPG, PNG, atau WebP')
  } else {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) return badRequest('Tipe file tidak didukung')
  }

  const sanitizedCustomer = customerName.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_')
  const sanitizedRef = nomorRfqCustomer.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_')

  const folder = type === 'gambar' ? 'Gambar-Barang' : 'RFQ'
  const filePath = `dokumen/${sanitizedCustomer}/RFQ/${sanitizedRef}/${folder}/${file.name}`

  const buffer = Buffer.from(await file.arrayBuffer())

  let uploadResult
  try {
    uploadResult = await storageService.upload(buffer, filePath, file.type)
  } catch (err) {
    return internalError('Gagal upload file: ' + (err instanceof Error ? err.message : 'unknown error'))
  }

  return NextResponse.json({
    data: {
      fileId: uploadResult.fileId,
      fileName: file.name,
      fileUrl: uploadResult.webViewLink,
    },
  }, { status: 201 })
}
