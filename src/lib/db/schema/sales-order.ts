import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const salesOrder = pgTable("sales_order", {
  id: text("id").primaryKey(),
  nomor: text("nomor").notNull().unique(),
  customerPoId: text("customer_po_id"),
  diId: text("di_id"),
  tanggal: timestamp("tanggal").notNull(),
  status: text("status").notNull().default("draft"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
