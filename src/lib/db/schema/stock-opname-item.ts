import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const stockOpnameItem = pgTable("stock_opname_item", {
  id: text("id").primaryKey(),
  stockOpnameId: text("stock_opname_id").notNull(),
  barangId: text("barang_id").notNull(),
  stokSistem: integer("stok_sistem").notNull().default(0),
  stokFisik: integer("stok_fisik"),
  selisih: integer("selisih").notNull().default(0),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
