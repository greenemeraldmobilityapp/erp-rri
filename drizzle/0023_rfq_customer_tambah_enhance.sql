ALTER TABLE rfq_customer ADD COLUMN IF NOT EXISTS nomor_rfq_customer text;
ALTER TABLE rfq_customer_item ADD COLUMN IF NOT EXISTS image_url text;
