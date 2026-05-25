import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const purchaseReceivingItem = pgTable("purchase_receiving_item", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 purchaseReceivingId: text("purchase_receiving_id").notNull(),
 barangId: text("barang_id").notNull(),
 jumlah: integer("jumlah").notNull(),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});