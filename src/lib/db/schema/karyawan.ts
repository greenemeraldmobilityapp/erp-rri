import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean, real } from "drizzle-orm/pg-core";

export const karyawan = pgTable("karyawan", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nik: text("nik").notNull().unique(),
 nama: text("nama").notNull(),
 email: text("email").notNull().unique(),
 noHp: text("no_hp"),
 jabatanId: text("jabatan_id").notNull(),
 gajiPokok: real("gaji_pokok"),
 tanggalMasuk: timestamp("tanggal_masuk"),
 isActive: boolean("is_active").notNull().default(true),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});