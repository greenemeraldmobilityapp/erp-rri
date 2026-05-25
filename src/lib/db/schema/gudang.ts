import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const gudang = pgTable("gudang", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nama: text("nama").notNull(),
 lokasi: text("lokasi"),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});