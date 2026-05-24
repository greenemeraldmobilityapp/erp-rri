import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";

export const supplierPayment = pgTable("supplier_payment", {
  id: text("id").primaryKey(),
  purchaseOrderId: text("purchase_order_id").notNull(),
  supplierId: text("supplier_id").notNull(),
  nominal: real("nominal").notNull(),
  tanggalBayar: timestamp("tanggal_bayar").notNull(),
  metode: text("metode").notNull().default("transfer"),
  buktiTransfer: text("bukti_transfer"),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
