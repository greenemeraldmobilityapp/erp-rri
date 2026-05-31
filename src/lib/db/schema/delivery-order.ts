import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const deliveryOrder = pgTable("delivery_order", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nomor: text("nomor").notNull().unique(),
 salesOrderId: text("sales_order_id").notNull(),
 tanggal: timestamp("tanggal").notNull(),
 status: text("status").notNull().default("draft"),
 keterangan: text("keterangan"),
 kodeBarcode: text("kode_barcode"),
 waktuPengiriman: integer("waktu_pengiriman"),
 fotoBarangDiterimaUrl: text("foto_barang_diterima_url"),
 fotoSuratJalanUrl: text("foto_surat_jalan_url"),
 alasanPenolakan: text("alasan_penolakan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
