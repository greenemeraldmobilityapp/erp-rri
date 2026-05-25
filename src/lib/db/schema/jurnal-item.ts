import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";

export const jurnalItem = pgTable("jurnal_item", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 jurnalId: text("jurnal_id").notNull(),
 akunId: text("akun_id").notNull(),
 debit: real("debit").notNull().default(0),
 credit: real("credit").notNull().default(0),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});