import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";

export const purchaseOrderItem = pgTable("purchase_order_item", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 purchaseOrderId: text("purchase_order_id").notNull(),
 barangId: text("barang_id").notNull(),
 jumlah: integer("jumlah").notNull(),
 hargaSatuan: real("harga_satuan").notNull(),
 linkProduk: text("link_produk"),
 namaToko: text("nama_toko"),
 marketplace: text("marketplace"),
 noResi: text("no_resi"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});