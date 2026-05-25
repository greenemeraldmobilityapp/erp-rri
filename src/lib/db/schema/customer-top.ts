import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const customerTop = pgTable("customer_top", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 customerId: text("customer_id").notNull(),
 top: text("top").notNull(), // Net 30, Net 60, Cash, Custom
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});