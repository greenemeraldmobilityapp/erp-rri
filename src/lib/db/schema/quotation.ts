import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean, real } from "drizzle-orm/pg-core";

export const quotation = pgTable("quotation", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nomor: text("nomor").notNull().unique(),
 customerId: text("customer_id").notNull(),
 tanggal: timestamp("tanggal").notNull(),
 status: text("status").notNull().default("draft"),
 ppnRate: real("ppn_rate").notNull().default(0.11),
 isActive: boolean("is_active").notNull().default(true),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
