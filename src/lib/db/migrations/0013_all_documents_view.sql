CREATE OR REPLACE VIEW all_documents AS
SELECT
  d.id,
  d.file_name AS "fileName",
  d.file_url AS "fileUrl",
  d.drive_file_id AS "driveFileId",
  d.uploaded_at AS "uploadedAt",
  'RFQ Customer' AS modul,
  p.nomor AS "nomorDokumen",
  p.customer_id AS "customerId",
  c.nama AS "customerNama"
FROM rfq_customer_document d
JOIN rfq_customer p ON p.id = d.rfq_customer_id
JOIN customer c ON c.id = p.customer_id

UNION ALL

SELECT
  d.id,
  d.file_name,
  d.file_url,
  d.drive_file_id,
  d.uploaded_at,
  'Quotation',
  p.nomor,
  p.customer_id,
  c.nama
FROM quotation_document d
JOIN quotation p ON p.id = d.quotation_id
JOIN customer c ON c.id = p.customer_id

UNION ALL

SELECT
  d.id,
  d.file_name,
  d.file_url,
  d.drive_file_id,
  d.uploaded_at,
  'Customer PO',
  p.nomor,
  p.customer_id,
  c.nama
FROM customer_po_document d
JOIN customer_po p ON p.id = d.customer_po_id
JOIN customer c ON c.id = p.customer_id

UNION ALL

SELECT
  d.id,
  d.file_name,
  d.file_url,
  d.drive_file_id,
  d.uploaded_at,
  'DI',
  p.nomor,
  p.customer_id,
  c.nama
FROM di_document d
JOIN di p ON p.id = d.di_id
JOIN customer c ON c.id = p.customer_id

UNION ALL

SELECT
  d.id,
  d.file_name,
  d.file_url,
  d.drive_file_id,
  d.uploaded_at,
  'Invoice',
  p.nomor,
  p.customer_id,
  c.nama
FROM invoice_document d
JOIN invoice p ON p.id = d.invoice_id
JOIN customer c ON c.id = p.customer_id

UNION ALL

SELECT
  d.id,
  d.file_name,
  d.file_url,
  d.drive_file_id,
  d.uploaded_at,
  'Retur Penjualan',
  p.nomor,
  p.customer_id,
  c.nama
FROM retur_penjualan_document d
JOIN retur_penjualan p ON p.id = d.retur_penjualan_id
JOIN customer c ON c.id = p.customer_id

UNION ALL

SELECT
  d.id,
  d.file_name,
  d.file_url,
  d.drive_file_id,
  d.uploaded_at,
  'Kontrak',
  COALESCE(p.nomor_kontrak, ''),
  p.customer_id,
  c.nama
FROM kontrak_file d
JOIN kontrak p ON p.id = d.kontrak_id
JOIN customer c ON c.id = p.customer_id;
