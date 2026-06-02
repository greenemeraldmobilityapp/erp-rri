import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";

export const invoiceItem = pgTable("invoice_item", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 invoiceId: text("invoice_id").notNull(),
 barangId: text("barang_id").notNull(),
  hargaSatuan: numeric("harga_satuan", { precision: 18, scale: 2 }).notNull().$type<number>(),
 diskon: numeric("diskon", { precision: 18, scale: 2 }).default("0").$type<number>(),
 ppn: numeric("ppn", { precision: 18, scale: 2 }).$type<number>(),
 pph: numeric("pph", { precision: 18, scale: 2 }).$type<number>(),
  jumlah: integer("jumlah").notNull(),
  urutan: integer("urutan").notNull(),
 namaBarang: text("nama_barang"),
 kodeBarang: text("kode_barang"),
 satuan: text("satuan"),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});