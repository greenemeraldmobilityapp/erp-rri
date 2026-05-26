-- Rename existing supplier-facing RFQ tables
ALTER TABLE rfq RENAME TO rfq_supplier;
ALTER TABLE rfq_item RENAME TO rfq_supplier_item;
ALTER TABLE rfq_document RENAME TO rfq_supplier_document;

-- Drop obsolete rfq_pic (legacy Pre-Sales table, now replaced by rfq_customer_pic)
DROP TABLE IF EXISTS rfq_pic;

-- Create new customer-facing RFQ tables
CREATE TABLE IF NOT EXISTS rfq_customer (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nomor TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL,
  tanggal TIMESTAMP NOT NULL,
  pic_customer_id TEXT,
  perihal TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  keterangan TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfq_customer_item (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  rfq_customer_id TEXT NOT NULL,
  barang_id TEXT,
  nama_barang TEXT,
  jumlah INTEGER NOT NULL,
  satuan TEXT,
  keterangan TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfq_customer_document (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  rfq_customer_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  drive_file_id TEXT,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfq_customer_pic (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  rfq_customer_id TEXT NOT NULL,
  customer_pic_id TEXT NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW()
);
