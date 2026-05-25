import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";

export const fakturPajak = pgTable("faktur_pajak", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nomor: text("nomor").notNull().unique(),
 invoiceId: text("invoice_id").notNull(),
 nomorFaktur: text("nomor_faktur").notNull(),
 tanggal: timestamp("tanggal").notNull(),
 status: text("status").notNull().default("draft"),
 dpp: real("dpp").notNull(),
 ppn: real("ppn").notNull(),
 pph: real("pph"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});