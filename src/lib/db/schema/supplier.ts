import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const supplier = pgTable("supplier", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nama: text("nama").notNull(),
 kode: text("kode").notNull().unique(),
 namaToko: text("nama_toko"), // for marketplace
 linkToko: text("link_toko"), // for marketplace
 noRekening: text("no_rekening"),
 kontak: text("kontak"),
 termsOfPayment: text("terms_of_payment"), // e.g., Net 30, Net 60, Cash, Custom
 isMarketplace: boolean("is_marketplace").notNull().default(false),
 isActive: boolean("is_active").notNull().default(true),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});