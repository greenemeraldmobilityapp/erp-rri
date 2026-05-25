import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const rfqDocument = pgTable("rfq_document", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 rfqId: text("rfq_id").notNull(),
 fileName: text("file_name").notNull(),
 fileUrl: text("file_url").notNull(),
 driveFileId: text("drive_file_id"),
 uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});
