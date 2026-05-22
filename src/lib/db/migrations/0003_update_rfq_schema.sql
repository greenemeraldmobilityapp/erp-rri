-- Drop existing rfq tables (order matters for FK)
DROP TABLE IF EXISTS rfq_pic CASCADE;
DROP TABLE IF EXISTS rfq_item CASCADE;
DROP TABLE IF EXISTS rfq CASCADE;

-- Recreate rfq with supplier_id and document number
CREATE TABLE rfq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor VARCHAR(50) NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES supplier(id) ON DELETE RESTRICT,
  tanggal DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  keterangan TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rfq_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfq(id) ON DELETE CASCADE,
  barang_id UUID NOT NULL REFERENCES barang(id) ON DELETE RESTRICT,
  jumlah INTEGER NOT NULL,
  satuan VARCHAR(50),
  harga_target REAL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rfq_pic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfq(id) ON DELETE CASCADE,
  customer_pic_id UUID NOT NULL REFERENCES customer_pic(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
