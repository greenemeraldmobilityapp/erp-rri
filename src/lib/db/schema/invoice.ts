import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean, real } from "drizzle-orm/pg-core";

export const invoice = pgTable("invoice", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nomor: text("nomor").notNull().unique(),
 salesOrderId: text("sales_order_id").notNull(),
 customerId: text("customer_id").notNull(),
  tanggal: timestamp("tanggal").notNull(),
  nomorGrn: text("nomor_grn"),
  top: text("top").notNull(),
 ppnRate: real("ppn_rate").notNull().default(0.11),
 pphRate: real("pph_rate"),
 status: text("status").notNull().default("draft"),
 isActive: boolean("is_active").notNull().default(true),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});