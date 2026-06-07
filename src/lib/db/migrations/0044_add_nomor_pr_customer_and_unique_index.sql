-- Migration: Add nomor_pr_customer column and unique index on nomor_po_customer
-- Description: Stores customer PR number and prevents duplicate customer PO imports

ALTER TABLE customer_po ADD COLUMN IF NOT EXISTS nomor_pr_customer TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_po_nomor_po_customer_unique 
ON customer_po (lower(nomor_po_customer)) 
WHERE nomor_po_customer IS NOT NULL AND status != 'cancelled';
