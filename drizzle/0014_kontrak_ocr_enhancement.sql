ALTER TABLE "kontrak" ALTER COLUMN "tanggal_mulai" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "kontrak" ALTER COLUMN "tanggal_selesai" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "kontrak_item" ALTER COLUMN "barang_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "kontrak" ADD COLUMN "nomor_kontrak" text;--> statement-breakpoint
ALTER TABLE "kontrak" ADD COLUMN "tanggal_tanda_tangan" date;--> statement-breakpoint
ALTER TABLE "kontrak" ADD COLUMN "penandatangan_rri_nama" text;--> statement-breakpoint
ALTER TABLE "kontrak" ADD COLUMN "penandatangan_rri_jabatan" text;--> statement-breakpoint
ALTER TABLE "kontrak" ADD COLUMN "penandatangan_customer_nama" text;--> statement-breakpoint
ALTER TABLE "kontrak" ADD COLUMN "penandatangan_customer_jabatan" text;--> statement-breakpoint
ALTER TABLE "kontrak" ADD COLUMN "catatan" text;--> statement-breakpoint
ALTER TABLE "kontrak_file" ADD COLUMN "jenis_dokumen" text DEFAULT 'kontrak' NOT NULL;--> statement-breakpoint
ALTER TABLE "kontrak_item" ADD COLUMN "kode_barang" text;--> statement-breakpoint
ALTER TABLE "kontrak_item" ADD COLUMN "nama_barang" text;--> statement-breakpoint
ALTER TABLE "kontrak_item" ADD COLUMN "satuan" text;
