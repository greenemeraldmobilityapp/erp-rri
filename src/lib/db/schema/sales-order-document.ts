import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { salesOrder } from "./sales-order";

export const salesOrderDocument = pgTable("sales_order_document", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 salesOrderId: text("sales_order_id").notNull().references(() => salesOrder.id, { onDelete: "cascade" }),
 fileName: text("file_name").notNull(),
 fileUrl: text("file_url").notNull(),
 driveFileId: text("drive_file_id"),
 uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});
