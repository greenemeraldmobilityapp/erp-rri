CREATE TABLE IF NOT EXISTS "supplier_kontak" (
  "id" text PRIMARY KEY NOT NULL,
  "supplier_id" text NOT NULL,
  "nama" text NOT NULL,
  "jabatan" text,
  "no_hp" text,
  "email" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_supplier_kontak_supplier_id ON supplier_kontak(supplier_id);
