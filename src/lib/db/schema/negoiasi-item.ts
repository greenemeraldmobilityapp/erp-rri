import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";

export const negoiasiItem = pgTable("negoiasi_item", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 negoiasiId: text("negoiasi_id").notNull(),
 quotationItemId: text("quotation_item_id").notNull(),
 hargaSatuanBaru: real("harga_satuan_baru").notNull(),
 diskonBaru: real("diskon_baru").default(0),
 alasan: text("alasan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});