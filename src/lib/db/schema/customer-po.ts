import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const customerPo = pgTable("customer_po", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nomor: text("nomor").notNull().unique(),
 customerId: text("customer_id").notNull(),
 quotationId: text("quotation_id"),
 tanggal: timestamp("tanggal").notNull(),
  nomorPoCustomer: text("nomor_po_customer"),
  nomorQuotationRri: text("nomor_quotation_rri"),
 status: text("status").notNull().default("draft"),
  termsOfPayment: text("terms_of_payment"),
  paymentTermId: text("payment_term_id"),
  waktuPengiriman: integer("waktu_pengiriman"),
picCustomerId: text("pic_customer_id"),
  isActive: boolean("is_active").notNull().default(true),
  namaPenandatangan: text("nama_penandatangan"),
  jabatanPenandatangan: text("jabatan_penandatangan"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
