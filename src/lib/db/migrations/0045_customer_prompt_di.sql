-- Migration 0045: Customer Prompt DI + DI Table Columns
-- Part of "Import dari DI" feature

-- 1. Create customer_prompt_di table
CREATE TABLE IF NOT EXISTS customer_prompt_di (
  customer_id UUID PRIMARY KEY REFERENCES customer(id) ON DELETE CASCADE,
  prompt_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE customer_prompt_di ENABLE ROW LEVEL SECURITY;
GRANT ALL ON customer_prompt_di TO authenticated, service_role;

-- 2. Add new columns to di table
ALTER TABLE di ADD COLUMN IF NOT EXISTS nama_penandatangan TEXT;
ALTER TABLE di ADD COLUMN IF NOT EXISTS jabatan_penandatangan TEXT;
ALTER TABLE di ADD COLUMN IF NOT EXISTS revisi_ke INTEGER DEFAULT 0;
ALTER TABLE di ADD COLUMN IF NOT EXISTS nomor_kontrak_customer TEXT;
