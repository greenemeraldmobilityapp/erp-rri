import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { kwitansi } from "./kwitansi";

export const kwitansiDocument = pgTable("kwitansi_document", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 kwitansiId: text("kwitansi_id").notNull().references(() => kwitansi.id, { onDelete: "cascade" }),
 fileName: text("file_name").notNull(),
 fileUrl: text("file_url").notNull(),
 driveFileId: text("drive_file_id"),
 uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});
