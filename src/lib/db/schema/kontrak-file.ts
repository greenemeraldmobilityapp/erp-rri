import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const kontrakFile = pgTable("kontrak_file", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 kontrakId: text("kontrak_id").notNull(),
 fileName: text("file_name").notNull(),
 fileUrl: text("file_url").notNull(),
 driveFileId: text("drive_file_id"),
 uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});