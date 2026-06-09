import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean, real, date, integer } from "drizzle-orm/pg-core";

export const quotation = pgTable("quotation", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  nomor: text("nomor").notNull().unique(),
  customerId: text("customer_id").notNull(),
  rfqId: text("rfq_id"),
  referensi: text("referensi"),
  lampiran: text("lampiran"),
  perihal: text("perihal").notNull().default("Penawaran Harga"),
  picCustomerId: text("pic_customer_id"),
  alamat: text("alamat"),
  tanggal: timestamp("tanggal").notNull(),
  masaBerlaku: text("masa_berlaku"),
  tanggalBerlakuSampai: date("tanggal_berlaku_sampai"),
  status: text("status").notNull().default("draft"),
  ppnRate: real("ppn_rate").notNull().default(0.11),
  ppnEnabled: boolean("ppn_enabled").notNull().default(true),
  totalHarga: real("total_harga"),
  revisi: integer("revisi").notNull().default(0),
  emailAccessToken: text("email_access_token"),
  emailAccessTokenExpiresAt: timestamp("email_access_token_expires_at"),
  keterangan: text("keterangan"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
