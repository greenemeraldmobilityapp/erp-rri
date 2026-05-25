import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const customerPo = pgTable("customer_po", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nomor: text("nomor").notNull().unique(),
 customerId: text("customer_id").notNull(),
 quotationId: text("quotation_id"),
 tanggal: timestamp("tanggal").notNull(),
 nomorPoCustomer: text("nomor_po_customer"),
 status: text("status").notNull().default("draft"),
 termsOfPayment: text("terms_of_payment"),
 isActive: boolean("is_active").notNull().default(true),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
