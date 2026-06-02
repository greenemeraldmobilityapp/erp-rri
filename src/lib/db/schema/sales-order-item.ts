import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";

export const salesOrderItem = pgTable("sales_order_item", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 salesOrderId: text("sales_order_id").notNull(),
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