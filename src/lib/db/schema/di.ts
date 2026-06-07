import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const di = pgTable("di", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nomor: text("nomor").notNull().unique(),
 customerId: text("customer_id").notNull(),
 kontrakId: text("kontrak_id"),
 picCustomerId: text("pic_customer_id"),
 nomorDiCustomer: text("nomor_di_customer"),
  termsOfPayment: text("terms_of_payment"),
  paymentTermId: text("payment_term_id"),
  waktuPengiriman: integer("waktu_pengiriman"),
 tanggal: timestamp("tanggal").notNull(),
 status: text("status").notNull().default("draft"),
 keterangan: text("keterangan"),
 isActive: boolean("is_active").notNull().default(true),
 namaPenandatangan: text("nama_penandatangan"),
 jabatanPenandatangan: text("jabatan_penandatangan"),
 revisiKe: integer("revisi_ke").default(0),
 nomorKontrakCustomer: text("nomor_kontrak_customer"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
