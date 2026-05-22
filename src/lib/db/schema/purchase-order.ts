import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const purchaseOrder = pgTable("purchase_order", {
  id: text("id").primaryKey(),
  nomor: text("nomor").notNull().unique(),
  supplierId: text("supplier_id").notNull(),
  purchaseRequestId: text("purchase_request_id"),
  tanggal: timestamp("tanggal").notNull(),
  status: text("status").notNull().default("draft"),
  termsOfPayment: text("terms_of_payment"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
