CREATE TABLE invoice_payment (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id TEXT NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  tanggal TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  amount DOUBLE PRECISION NOT NULL,
  metode TEXT NOT NULL DEFAULT 'transfer',
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoice_payment_invoice_id ON invoice_payment(invoice_id);
