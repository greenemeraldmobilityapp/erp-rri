import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";

export const penggajian = pgTable("penggajian", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nomor: text("nomor").notNull().unique(),
 karyawanId: text("karyawan_id").notNull(),
 bulan: integer("bulan").notNull(),
 tahun: integer("tahun").notNull(),
 gajiPokok: real("gaji_pokok").notNull(),
 tunjangan: real("tunjangan").default(0),
 potongan: real("potongan").default(0),
 gajiBersih: real("gaji_bersih").notNull(),
 status: text("status").notNull().default("draft"),
 tanggalPembayaran: timestamp("tanggal_pembayaran"),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});