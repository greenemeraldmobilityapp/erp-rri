import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";

export const invoicePayment = pgTable("invoice_payment", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 invoiceId: text("invoice_id").notNull(),
 tanggal: timestamp("tanggal").notNull(),
 amount: real("amount").notNull(),
 metode: text("metode").notNull().default("transfer"),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
