import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const aiOcrHistory = pgTable("ai_ocr_history", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 userId: text("user_id").notNull(),
 fileName: text("file_name").notNull(),
 fileUrl: text("file_url").notNull(),
 extractedAt: timestamp("extracted_at").notNull().defaultNow(),
 keterangan: text("keterangan"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
});