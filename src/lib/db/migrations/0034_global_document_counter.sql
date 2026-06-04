-- Global Document Counter for Customer Transaction Chain
-- Migration: 0034_global_document_counter.sql
--
-- Replaces per-module counters (RFQC, SPH, CPO, DI, SO, SJ, INV, KWT, GRNC, RTJ, TT)
-- with a single global counter for customer document chain.
-- Only RFQC and DI generate new global numbers; all downstream copy suffix from parent.
-- Procurement modules (RFQ, PO, GRN, RP) and Kontrak remain unchanged.

-- Seed the global counter starting from 45 for current period
INSERT INTO document_counter (kode_dokumen, tahun, bulan, counter)
VALUES ('GLOBAL', 2026, 6, 45)
ON CONFLICT (kode_dokumen, tahun, bulan) DO NOTHING;

-- Function: Atomic increment of global counter
CREATE OR REPLACE FUNCTION increment_global_counter(
  p_tahun INTEGER,
  p_bulan INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_counter INTEGER;
BEGIN
  INSERT INTO document_counter (kode_dokumen, tahun, bulan, counter)
  VALUES ('GLOBAL', p_tahun, p_bulan, 1)
  ON CONFLICT (kode_dokumen, tahun, bulan)
  DO UPDATE SET counter = document_counter.counter + 1
  RETURNING counter INTO v_counter;

  RETURN v_counter;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON FUNCTION increment_global_counter IS 'Atomic increment for global customer document counter (shared across RFQC, DI chains)';

NOTIFY pgrst, 'reload schema';
