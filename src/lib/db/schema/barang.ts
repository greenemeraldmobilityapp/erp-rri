import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { kategoriBarang } from "./kategori-barang";

export const barang = pgTable("barang", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nama: text("nama").notNull(),
 kode: text("kode").notNull().unique(),
 kategoriId: text("kategori_id").notNull().references(() => kategoriBarang.id, { onDelete: "restrict" }),
 satuan: text("satuan").notNull(),
 spesifikasi: text("spesifikasi"),
 hargaBeliDefault: real("harga_beli_default"),
 hargaJualDefault: real("harga_jual_default"),
 stokMinimum: integer("stok_minimum").notNull().default(0),
 isActive: boolean("is_active").notNull().default(true),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});