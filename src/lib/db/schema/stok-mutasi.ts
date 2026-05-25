import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const stokMutasi = pgTable("stok_mutasi", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 barangId: text("barang_id").notNull(),
 gudangId: text("gudang_id"),
 tipe: text("tipe").notNull(),
 jumlah: integer("jumlah").notNull(),
 saldoSebelum: integer("saldo_sebelum").notNull().default(0),
 saldoSesudah: integer("saldo_sesudah").notNull().default(0),
 refJenis: text("ref_jenis"),
 refId: text("ref_id"),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 createdBy: text("created_by"),
});
