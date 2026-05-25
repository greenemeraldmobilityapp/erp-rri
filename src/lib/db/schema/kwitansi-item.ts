import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";

export const kwitansiItem = pgTable("kwitansi_item", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 kwitansiId: text("kwitansi_id").notNull(),
 invoiceItemId: text("invoice_item_id").notNull(),
 jumlah: real("jumlah").notNull(),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});