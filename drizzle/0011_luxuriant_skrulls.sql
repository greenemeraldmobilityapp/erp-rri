CREATE TABLE "data_archive" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"source_table" text NOT NULL,
	"source_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"archived_at" timestamp DEFAULT now() NOT NULL,
	"archived_by" text
);
