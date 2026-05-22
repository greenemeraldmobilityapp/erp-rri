import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const returPenjualan = pgTable("retur_penjualan", {
  id: text("id").primaryKey(),
  nomor: text("nomor").notNull().unique(),
  deliveryOrderId: text("delivery_order_id"),
  customerId: text("customer_id").notNull(),
  tanggal: timestamp("tanggal").notNull(),
  status: text("status").notNull().default("draft"),
  keterangan: text("keterangan"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});