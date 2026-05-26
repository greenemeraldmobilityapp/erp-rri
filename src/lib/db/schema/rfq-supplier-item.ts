import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";

export const rfqSupplierItem = pgTable("rfq_supplier_item", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 rfqSupplierId: text("rfq_supplier_id").notNull(),
 barangId: text("barang_id").notNull(),
 jumlah: integer("jumlah").notNull(),
 satuan: text("satuan"),
 hargaTarget: real("harga_target"),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
