import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";

export const diItem = pgTable("di_item", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 diId: text("di_id").notNull(),
 barangId: text("barang_id").notNull(),
 jumlah: integer("jumlah").notNull(),
 hargaSatuan: real("harga_satuan").notNull(),
 namaBarang: text("nama_barang"),
 kodeBarang: text("kode_barang"),
 satuan: text("satuan"),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});