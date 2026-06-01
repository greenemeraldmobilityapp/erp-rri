import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const deliveryOrderItem = pgTable("delivery_order_item", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 deliveryOrderId: text("delivery_order_id").notNull(),
 barangId: text("barang_id").notNull(),
 jumlah: integer("jumlah").notNull(),
 keterangan: text("keterangan"),
  scannedAt: timestamp("scanned_at"),
  packingNumber: integer("packing_number"),
  urutan: integer("urutan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});