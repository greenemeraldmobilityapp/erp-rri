ALTER TABLE "ai_ocr_history" ADD COLUMN "drive_file_id" text;--> statement-breakpoint
ALTER TABLE "invoice_document" ADD COLUMN "drive_file_id" text;--> statement-breakpoint
ALTER TABLE "kontrak_file" ADD COLUMN "drive_file_id" text;--> statement-breakpoint
ALTER TABLE "retur_pembelian_document" ADD COLUMN "drive_file_id" text;--> statement-breakpoint
ALTER TABLE "retur_penjualan_document" ADD COLUMN "drive_file_id" text;--> statement-breakpoint
ALTER TABLE "rfq_document" ADD COLUMN "drive_file_id" text;