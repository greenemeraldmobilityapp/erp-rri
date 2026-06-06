import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/api/supabase-server'
import { verifyAuth } from '@/lib/api/auth'
import { internalError, notFound } from '@/lib/api/errors'

const modulTableMap: Record<string, string> = {
  'RFQ Customer': 'rfq_customer_document',
  'RFQ Supplier': 'rfq_supplier_document',
  'Quotation': 'quotation_document',
  'Customer PO': 'customer_po_document',
  'DI': 'di_document',
  'Delivery Order': 'delivery_order_document',
  'Invoice': 'invoice_document',
  'Kwitansi': 'kwitansi_document',
  'Tanda Terima': 'invoice_document',
  'Retur Penjualan': 'retur_penjualan_document',
  'Retur Pembelian': 'retur_pembelian_document',
  'GRN': 'grn_document',
  'Retur Barang (GRN)': 'grn_customer_document',
  'Kontrak': 'kontrak_file',
  'Sales Order': 'sales_order_document',
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth.error

  const { id } = await params

  if (!id || id.startsWith('pdf-')) {
    return notFound('Document not found')
  }

  const { data: doc, error: fetchError } = await supabaseAdmin
    .from('all_documents')
    .select('id, modul, filename, fileurl, recordid')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !doc) {
    return notFound('Document not found')
  }

  const tableName = modulTableMap[doc.modul]
  if (!tableName) {
    return internalError(new Error(`Unknown modul: ${doc.modul}`))
  }

  const { error: deleteDbError } = await supabaseAdmin
    .from(tableName)
    .delete()
    .eq('id', id)

  if (deleteDbError) {
    return internalError(deleteDbError)
  }

  const fileUrl = doc.fileurl
  if (fileUrl && !fileUrl.startsWith('/api/')) {
    const url = new URL(fileUrl)
    const path = url.pathname.split('/').slice(-3).join('/')
    const bucket = 'dokumen'
    
    const { error: storageError } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path])

    if (storageError) {
      console.error('Failed to delete file from storage:', storageError)
    }
  }

  return NextResponse.json({ success: true })
}