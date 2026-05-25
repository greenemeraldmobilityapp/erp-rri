import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const aiSearchHistory = pgTable("ai_search_history", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 userId: text("user_id").notNull(),
 query: text("query").notNull(),
 createdAt: timestamp("created_at").notNull().defaultNow(),
});