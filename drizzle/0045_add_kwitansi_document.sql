CREATE TABLE IF NOT EXISTS "kwitansi_document" (
	"id" text PRIMARY KEY NOT NULL,
	"kwitansi_id" text NOT NULL REFERENCES "kwitansi"("id") ON DELETE CASCADE,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"drive_file_id" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
