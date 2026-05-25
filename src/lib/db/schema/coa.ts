import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const coa = pgTable("coa", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 kode: text("kode").notNull().unique(),
 nama: text("nama").notNull(),
 tipe: text("tipe").notNull(), // e.g., Asset, Liability, Equity, Revenue, Expense
 indukId: text("induk_id"), // for hierarchical structure
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});