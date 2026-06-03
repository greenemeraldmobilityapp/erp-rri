-- Add missing document modules to all_documents view:
-- Retur Pembelian, RFQ Supplier, GRN (supplier-side)

DROP VIEW IF EXISTS all_documents CASCADE;

CREATE OR REPLACE VIEW all_documents AS

-- REAL uploaded documents

SELECT
  d.id,
  d.file_name AS filename,
  d.file_url AS fileurl,
  d.drive_file_id AS drivefileid,
  d.uploaded_at AS uploadedat,
  'RFQ Customer'::text AS modul,
  p.nomor AS nomordokumen,
  p.customer_id AS customerid,
  c.nama AS customernama,
  p.id AS recordid
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
  c.nama,
  p.id
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
  c.nama,
  p.id
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
  c.nama,
  p.id
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
  c.nama,
  p.id
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
  c.nama,
  p.id
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
  c.nama,
  p.id
FROM kontrak_file d
JOIN kontrak p ON p.id = d.kontrak_id
JOIN customer c ON c.id = p.customer_id

UNION ALL

SELECT
  d.id,
  d.file_name,
  d.file_url,
  d.drive_file_id,
  d.uploaded_at,
  'Delivery Order',
  p.nomor,
  COALESCE(cpo.customer_id, di_.customer_id),
  COALESCE(c1.nama, c2.nama),
  p.id
FROM delivery_order_document d
JOIN delivery_order p ON p.id = d.delivery_order_id
LEFT JOIN sales_order so ON so.id = p.sales_order_id
LEFT JOIN customer_po cpo ON cpo.id = so.customer_po_id
LEFT JOIN customer c1 ON c1.id = cpo.customer_id
LEFT JOIN di di_ ON di_.id = so.di_id
LEFT JOIN customer c2 ON c2.id = di_.customer_id

UNION ALL

SELECT
  'dslip-' || p.id,
  'Delivery Slip - ' || COALESCE(p.delivery_slip_nomor, p.nomor),
  p.delivery_slip_file_url,
  NULL,
  p.updated_at,
  'Delivery Slip',
  p.nomor,
  COALESCE(cpo.customer_id, di_.customer_id),
  COALESCE(c1.nama, c2.nama),
  p.id
FROM delivery_order p
LEFT JOIN sales_order so ON so.id = p.sales_order_id
LEFT JOIN customer_po cpo ON cpo.id = so.customer_po_id
LEFT JOIN customer c1 ON c1.id = cpo.customer_id
LEFT JOIN di di_ ON di_.id = so.di_id
LEFT JOIN customer c2 ON c2.id = di_.customer_id
WHERE p.delivery_slip_file_url IS NOT NULL

UNION ALL

SELECT
  d.id,
  d.file_name,
  d.file_url,
  d.drive_file_id,
  d.uploaded_at,
  'GRN Customer',
  p.nomor,
  p.customer_id,
  c.nama,
  p.id
FROM grn_customer_document d
JOIN grn_customer p ON p.id = d.grn_customer_id
JOIN customer c ON c.id = p.customer_id

UNION ALL

SELECT
  d.id,
  d.file_name,
  d.file_url,
  d.drive_file_id,
  d.uploaded_at,
  'Kwitansi',
  p.nomor,
  i.customer_id,
  c.nama,
  p.id
FROM kwitansi_document d
JOIN kwitansi p ON p.id = d.kwitansi_id
LEFT JOIN invoice i ON i.id = p.invoice_id
LEFT JOIN customer c ON c.id = i.customer_id

-- Retur Pembelian documents (customer resolved via PO → SO → PO/DI)

UNION ALL

SELECT
  d.id,
  d.file_name,
  d.file_url,
  d.drive_file_id,
  d.uploaded_at,
  'Retur Pembelian',
  p.nomor,
  COALESCE(cpo.customer_id, di_.customer_id),
  COALESCE(c1.nama, c2.nama),
  p.id
FROM retur_pembelian_document d
JOIN retur_pembelian p ON p.id = d.retur_pembelian_id
LEFT JOIN purchase_order po ON po.id = p.purchase_order_id
LEFT JOIN sales_order so ON so.id = po.sales_order_id
LEFT JOIN customer_po cpo ON cpo.id = so.customer_po_id
LEFT JOIN customer c1 ON c1.id = cpo.customer_id
LEFT JOIN di di_ ON di_.id = so.di_id
LEFT JOIN customer c2 ON c2.id = di_.customer_id

-- RFQ Supplier documents (customer resolved via SO → PO/DI)

UNION ALL

SELECT
  d.id,
  d.file_name,
  d.file_url,
  d.drive_file_id,
  d.uploaded_at,
  'RFQ Supplier',
  p.nomor,
  COALESCE(cpo.customer_id, di_.customer_id),
  COALESCE(c1.nama, c2.nama),
  p.id
FROM rfq_supplier_document d
JOIN rfq_supplier p ON p.id = d.rfq_supplier_id
LEFT JOIN sales_order so ON so.id = p.sales_order_id
LEFT JOIN customer_po cpo ON cpo.id = so.customer_po_id
LEFT JOIN customer c1 ON c1.id = cpo.customer_id
LEFT JOIN di di_ ON di_.id = so.di_id
LEFT JOIN customer c2 ON c2.id = di_.customer_id

-- GRN documents (customer resolved via DI if set)

UNION ALL

SELECT
  d.id,
  d.file_name,
  d.file_url,
  d.drive_file_id,
  d.uploaded_at,
  'GRN',
  COALESCE(p.nomor, p.id::text),
  di_.customer_id,
  c.nama,
  p.id
FROM grn_document d
JOIN grn p ON p.id = d.grn_id
LEFT JOIN di di_ ON di_.id = p.di_id
LEFT JOIN customer c ON c.id = di_.customer_id

-- VIRTUAL PDF entries

UNION ALL

SELECT
  'pdf-quotation-' || p.id,
  'Quotation - ' || p.nomor || '.pdf',
  '/api/v1/quotation/' || p.id || '/pdf',
  NULL,
  p.updated_at,
  'Quotation',
  p.nomor,
  p.customer_id,
  c.nama,
  p.id
FROM quotation p
JOIN customer c ON c.id = p.customer_id

UNION ALL

SELECT
  'pdf-do-' || p.id,
  'Surat Jalan - ' || p.nomor || '.pdf',
  '/api/v1/delivery-order/' || p.id || '/pdf',
  NULL,
  p.updated_at,
  'Delivery Order',
  p.nomor,
  COALESCE(cpo.customer_id, di_.customer_id),
  COALESCE(c1.nama, c2.nama),
  p.id
FROM delivery_order p
LEFT JOIN sales_order so ON so.id = p.sales_order_id
LEFT JOIN customer_po cpo ON cpo.id = so.customer_po_id
LEFT JOIN customer c1 ON c1.id = cpo.customer_id
LEFT JOIN di di_ ON di_.id = so.di_id
LEFT JOIN customer c2 ON c2.id = di_.customer_id

UNION ALL

SELECT
  'pdf-invoice-' || p.id,
  'Invoice - ' || p.nomor || '.pdf',
  '/api/v1/invoice/' || p.id || '/pdf',
  NULL,
  p.updated_at,
  'Invoice',
  p.nomor,
  p.customer_id,
  c.nama,
  p.id
FROM invoice p
JOIN customer c ON c.id = p.customer_id

UNION ALL

SELECT
  'pdf-tanda-terima-' || p.id,
  'Tanda Terima - ' || p.nomor || '.pdf',
  '/api/v1/invoice/' || p.id || '/tanda-terima/pdf',
  NULL,
  p.updated_at,
  'Tanda Terima',
  p.nomor,
  p.customer_id,
  c.nama,
  p.id
FROM invoice p
JOIN customer c ON c.id = p.customer_id

UNION ALL

SELECT
  'pdf-kwitansi-' || p.id,
  'Kwitansi - ' || p.nomor || '.pdf',
  '/api/v1/kwitansi/' || p.id || '/pdf',
  NULL,
  p.updated_at,
  'Kwitansi',
  p.nomor,
  i.customer_id,
  c.nama,
  p.id
FROM kwitansi p
LEFT JOIN invoice i ON i.id = p.invoice_id
LEFT JOIN customer c ON c.id = i.customer_id

UNION ALL

SELECT
  'pdf-resi-' || p.id,
  'Resi Pengiriman - ' || p.nomor || '.pdf',
  '/api/v1/delivery-order/' || p.id || '/resi-pdf',
  NULL,
  p.updated_at,
  'Resi Pengiriman',
  p.nomor,
  COALESCE(cpo.customer_id, di_.customer_id),
  COALESCE(c1.nama, c2.nama),
  p.id
FROM delivery_order p
LEFT JOIN sales_order so ON so.id = p.sales_order_id
LEFT JOIN customer_po cpo ON cpo.id = so.customer_po_id
LEFT JOIN customer c1 ON c1.id = cpo.customer_id
LEFT JOIN di di_ ON di_.id = so.di_id
LEFT JOIN customer c2 ON c2.id = di_.customer_id;
