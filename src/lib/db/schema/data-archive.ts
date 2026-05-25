import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const dataArchive = pgTable("data_archive", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  sourceTable: text("source_table").notNull(),
  sourceId: text("source_id").notNull(),
  data: jsonb("data").notNull(),
  archivedAt: timestamp("archived_at").notNull().defaultNow(),
  archivedBy: text("archived_by"),
});
