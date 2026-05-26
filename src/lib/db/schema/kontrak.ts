import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean, date } from "drizzle-orm/pg-core";

export const kontrak = pgTable("kontrak", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 customerId: text("customer_id").notNull(),
 nomorKontrak: text("nomor_kontrak"),
 nama: text("nama").notNull(),
 tanggalMulai: date("tanggal_mulai"),
 tanggalSelesai: date("tanggal_selesai"),
 tanggalTandaTangan: date("tanggal_tanda_tangan"),
 penandatanganRriNama: text("penandatangan_rri_nama"),
 penandatanganRriJabatan: text("penandatangan_rri_jabatan"),
 penandatanganCustomerNama: text("penandatangan_customer_nama"),
 penandatanganCustomerJabatan: text("penandatangan_customer_jabatan"),
 catatan: text("catatan"),
 isActive: boolean("is_active").notNull().default(true),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
