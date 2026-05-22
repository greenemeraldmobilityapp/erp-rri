CREATE TABLE IF NOT EXISTS stok_mutasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barang_id UUID NOT NULL REFERENCES barang(id) ON DELETE RESTRICT,
  gudang_id UUID REFERENCES gudang(id) ON DELETE SET NULL,
  tipe TEXT NOT NULL CHECK (tipe IN ('masuk', 'keluar', 'opname')),
  jumlah INTEGER NOT NULL,
  saldo_sebelum INTEGER NOT NULL DEFAULT 0,
  saldo_sesudah INTEGER NOT NULL DEFAULT 0,
  ref_jenis TEXT,
  ref_id TEXT,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX idx_stok_mutasi_barang_id ON stok_mutasi(barang_id);
CREATE INDEX idx_stok_mutasi_gudang_id ON stok_mutasi(gudang_id);
CREATE INDEX idx_stok_mutasi_created_at ON stok_mutasi(created_at);
