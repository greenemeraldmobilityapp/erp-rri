import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean, real } from "drizzle-orm/pg-core";

export const kontrakItem = pgTable("kontrak_item", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 kontrakId: text("kontrak_id").notNull(),
 barangId: text("barang_id").notNull(),
 hargaSatuan: real("harga_satuan").notNull(),
 ppnInclude: boolean("ppn_include").notNull().default(true),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});