-- Migration: Add signatory fields to customer_po
-- Description: Stores PO signatory information (nama_penandatangan, jabatan_penandatangan) from signature block
ALTER TABLE customer_po ADD COLUMN IF NOT EXISTS nama_penandatangan TEXT;
ALTER TABLE customer_po ADD COLUMN IF NOT EXISTS jabatan_penandatangan TEXT;