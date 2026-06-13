import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean, real } from "drizzle-orm/pg-core";

export const kontrakItemNotApprove = pgTable("kontrak_item_not_approve", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  kontrakId: text("kontrak_id").notNull(),
  barangId: text("barang_id"),
  kodeBarang: text("kode_barang"),
  namaBarang: text("nama_barang"),
  namaKontrak: text("nama_kontrak"),
  satuan: text("satuan"),
  hargaSatuan: real("harga_satuan").notNull(),
  ppnInclude: boolean("ppn_include").notNull().default(false),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
