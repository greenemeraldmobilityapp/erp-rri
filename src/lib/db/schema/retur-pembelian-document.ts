import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const returPembelianDocument = pgTable("retur_pembelian_document", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 returPembelianId: text("retur_pembelian_id").notNull(),
 fileName: text("file_name").notNull(),
 fileUrl: text("file_url").notNull(),
 uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});