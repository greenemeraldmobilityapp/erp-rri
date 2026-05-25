import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const grnItem = pgTable("grn_item", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 grnId: text("grn_id").notNull(),
 barangId: text("barang_id").notNull(),
 jumlah: integer("jumlah").notNull(),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});