import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const rfqSupplier = pgTable("rfq_supplier", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nomor: text("nomor").notNull().unique(),
 supplierId: text("supplier_id").notNull(),
 tanggal: timestamp("tanggal").notNull(),
 status: text("status").notNull().default("draft"),
 keterangan: text("keterangan"),
 isActive: boolean("is_active").notNull().default(true),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
