ALTER TABLE barang ADD COLUMN barcode text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_barang_barcode ON barang(barcode) WHERE barcode IS NOT NULL;
