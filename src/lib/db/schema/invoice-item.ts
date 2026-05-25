import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";

export const invoiceItem = pgTable("invoice_item", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 invoiceId: text("invoice_id").notNull(),
 barangId: text("barang_id").notNull(),
 harga: real("harga").notNull(),
 diskon: real("diskon").default(0),
 ppn: real("ppn"),
 pph: real("pph"),
 jumlah: integer("jumlah").notNull(),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});