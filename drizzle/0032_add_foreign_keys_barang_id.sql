-- Clean up orphaned rfq_customer_item records with null barang_id
DELETE FROM rfq_customer_item WHERE barang_id IS NULL;

-- Add FK: sales_order_item.barang_id → barang.id
ALTER TABLE sales_order_item
  ADD CONSTRAINT fk_sales_order_item_barang_id
  FOREIGN KEY (barang_id) REFERENCES barang(id);

-- Add FK: rfq_supplier_item.barang_id → barang.id
ALTER TABLE rfq_supplier_item
  ADD CONSTRAINT fk_rfq_supplier_item_barang_id
  FOREIGN KEY (barang_id) REFERENCES barang(id);

-- Add FK: delivery_order_item.barang_id → barang.id
ALTER TABLE delivery_order_item
  ADD CONSTRAINT fk_delivery_order_item_barang_id
  FOREIGN KEY (barang_id) REFERENCES barang(id);

-- Add FK: di_item.barang_id → barang.id
ALTER TABLE di_item
  ADD CONSTRAINT fk_di_item_barang_id
  FOREIGN KEY (barang_id) REFERENCES barang(id);

-- Add FK: grn_item.barang_id → barang.id
ALTER TABLE grn_item
  ADD CONSTRAINT fk_grn_item_barang_id
  FOREIGN KEY (barang_id) REFERENCES barang(id);

-- Add FK: invoice_item.barang_id → barang.id
ALTER TABLE invoice_item
  ADD CONSTRAINT fk_invoice_item_barang_id
  FOREIGN KEY (barang_id) REFERENCES barang(id);

-- Add FK: purchase_order_item.barang_id → barang.id
ALTER TABLE purchase_order_item
  ADD CONSTRAINT fk_purchase_order_item_barang_id
  FOREIGN KEY (barang_id) REFERENCES barang(id);

-- Add FK: purchase_receiving_item.barang_id → barang.id
ALTER TABLE purchase_receiving_item
  ADD CONSTRAINT fk_purchase_receiving_item_barang_id
  FOREIGN KEY (barang_id) REFERENCES barang(id);

-- Add FK: purchase_request_item.barang_id → barang.id
ALTER TABLE purchase_request_item
  ADD CONSTRAINT fk_purchase_request_item_barang_id
  FOREIGN KEY (barang_id) REFERENCES barang(id);

-- Add FK: retur_pembelian_item.barang_id → barang.id
ALTER TABLE retur_pembelian_item
  ADD CONSTRAINT fk_retur_pembelian_item_barang_id
  FOREIGN KEY (barang_id) REFERENCES barang(id);

-- Add FK: retur_penjualan_item.barang_id → barang.id
ALTER TABLE retur_penjualan_item
  ADD CONSTRAINT fk_retur_penjualan_item_barang_id
  FOREIGN KEY (barang_id) REFERENCES barang(id);

-- Add FK: rfq_customer_item.barang_id → barang.id
ALTER TABLE rfq_customer_item
  ADD CONSTRAINT fk_rfq_customer_item_barang_id
  FOREIGN KEY (barang_id) REFERENCES barang(id);
