import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const rfqPic = pgTable("rfq_pic", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 rfqId: text("rfq_id").notNull(),
 customerPicId: text("customer_pic_id").notNull(),
 assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});