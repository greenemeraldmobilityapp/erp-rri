import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";

export const rfqItem = pgTable("rfq_item", {
  id: text("id").primaryKey(),
  rfqId: text("rfq_id").notNull(),
  barangId: text("barang_id").notNull(),
  jumlah: integer("jumlah").notNull(),
  satuan: text("satuan"),
  hargaTarget: real("harga_target"),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
