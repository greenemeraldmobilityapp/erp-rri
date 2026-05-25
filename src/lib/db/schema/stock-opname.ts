import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const stockOpname = pgTable("stock_opname", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nomor: text("nomor").notNull().unique(),
 gudangId: text("gudang_id"),
 petugas: text("petugas").notNull(),
 status: text("status").notNull().default("draft"),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
