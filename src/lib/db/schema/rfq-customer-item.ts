import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const rfqCustomerItem = pgTable("rfq_customer_item", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  rfqCustomerId: text("rfq_customer_id").notNull(),
  barangId: text("barang_id"),
  namaBarang: text("nama_barang"),
  jumlah: integer("jumlah").notNull(),
  satuan: text("satuan"),
  imageUrl: text("image_url"),
  keterangan: text("keterangan"),
  justification: text("justification"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
