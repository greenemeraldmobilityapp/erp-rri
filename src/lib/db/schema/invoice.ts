import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean, numeric } from "drizzle-orm/pg-core";

export const invoice = pgTable("invoice", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nomor: text("nomor").notNull().unique(),
 salesOrderId: text("sales_order_id").notNull(),
  customerId: text("customer_id").notNull(),
  tanggal: timestamp("tanggal").notNull(),
  top: text("top").notNull(),
 ppnRate: numeric("ppn_rate", { precision: 5, scale: 4 }).notNull().default("0.11").$type<number>(),
  pphRate: numeric("pph_rate", { precision: 5, scale: 4 }).$type<number>(),
  grnCustomerNomor: text("grn_customer_nomor"),
  nomorTandaTerima: text("nomor_tanda_terima"),
  keteranganInvoice: text("keterangan_invoice"),
  status: text("status").notNull().default("draft"),
 isActive: boolean("is_active").notNull().default(true),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});