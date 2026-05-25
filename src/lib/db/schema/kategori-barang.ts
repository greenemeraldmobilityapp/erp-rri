import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const kategoriBarang = pgTable("kategori_barang", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nama: text("nama").notNull(),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});