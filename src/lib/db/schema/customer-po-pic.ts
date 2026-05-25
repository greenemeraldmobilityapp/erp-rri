import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const customerPoPic = pgTable("customer_po_pic", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 customerPoId: text("customer_po_id").notNull(),
 customerPicId: text("customer_pic_id").notNull(),
 assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});