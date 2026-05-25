import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const deliveryOrder = pgTable("delivery_order", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 nomor: text("nomor").notNull().unique(),
 salesOrderId: text("sales_order_id").notNull(),
 tanggal: timestamp("tanggal").notNull(),
 status: text("status").notNull().default("draft"),
 keterangan: text("keterangan"),
 kodeBarcode: text("kode_barcode"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
