ALTER TABLE customer_po ADD COLUMN waktu_pengiriman INTEGER;
ALTER TABLE customer_po ADD COLUMN pic_customer_id TEXT REFERENCES customer_pic(id);
ALTER TABLE sales_order ADD COLUMN waktu_pengiriman INTEGER;
ALTER TABLE delivery_order ADD COLUMN waktu_pengiriman INTEGER;
ALTER TABLE retur_penjualan ADD COLUMN waktu_pengiriman INTEGER;
