import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";

export const quotationItem = pgTable("quotation_item", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  quotationId: text("quotation_id").notNull(),
  barangId: text("barang_id"),
  specification: text("specification"),
  justification: text("justification"),
  imageUrl: text("image_url"),
  satuan: text("satuan"),
  hargaSatuan: real("harga_satuan").notNull(),
  diskon: real("diskon").default(0),
  ppnPerItem: real("ppn_per_item"),
  jumlah: integer("jumlah").notNull(),
  totalHarga: real("total_harga"),
  namaBarang: text("nama_barang"),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});