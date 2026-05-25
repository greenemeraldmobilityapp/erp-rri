import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";

export const fakturPajakItem = pgTable("faktur_pajak_item", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 fakturPajakId: text("faktur_pajak_id").notNull(),
 invoiceItemId: text("invoice_item_id").notNull(),
 harga: real("harga").notNull(),
 dpp: real("dpp").notNull(),
 ppn: real("ppn").notNull(),
 pph: real("pph"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});