import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const customer = pgTable("customer", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nama: text("nama").notNull(),
 kode: text("kode").notNull().unique(),
 alamat: text("alamat"),
 kontak: text("kontak"),
 termsOfPayment: text("terms_of_payment"), // e.g., Net 30, Net 60, Cash, Custom
 isActive: boolean("is_active").notNull().default(true),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});