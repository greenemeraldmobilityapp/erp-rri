CREATE TABLE IF NOT EXISTS "stock_opname" (
  "id" text PRIMARY KEY NOT NULL,
  "nomor" text NOT NULL UNIQUE,
  "gudang_id" text,
  "petugas" text NOT NULL,
  "status" text NOT NULL DEFAULT 'draft',
  "keterangan" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "stock_opname_item" (
  "id" text PRIMARY KEY NOT NULL,
  "stock_opname_id" text NOT NULL,
  "barang_id" text NOT NULL,
  "stok_sistem" integer NOT NULL DEFAULT 0,
  "stok_fisik" integer,
  "selisih" integer NOT NULL DEFAULT 0,
  "keterangan" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "supplier_payment" (
  "id" text PRIMARY KEY NOT NULL,
  "purchase_order_id" text NOT NULL,
  "supplier_id" text NOT NULL,
  "nominal" real NOT NULL,
  "tanggal_bayar" timestamp NOT NULL,
  "metode" text NOT NULL DEFAULT 'transfer',
  "bukti_transfer" text,
  "keterangan" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
