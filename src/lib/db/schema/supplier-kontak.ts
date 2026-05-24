import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const supplierKontak = pgTable("supplier_kontak", {
  id: text("id").primaryKey(),
  supplierId: text("supplier_id").notNull(),
  nama: text("nama").notNull(),
  jabatan: text("jabatan"),
  noHp: text("no_hp"),
  email: text("email"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
