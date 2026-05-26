CREATE TABLE "quotation_document" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"quotation_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"drive_file_id" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
