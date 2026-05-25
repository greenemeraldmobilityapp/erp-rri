import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const quotationPic = pgTable("quotation_pic", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 quotationId: text("quotation_id").notNull(),
 customerPicId: text("customer_pic_id").notNull(),
 assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});