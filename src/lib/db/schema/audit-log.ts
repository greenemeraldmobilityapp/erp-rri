import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, jsonb, inet } from "drizzle-orm/pg-core";
import { users } from "./users";

export const auditLog = pgTable("audit_log", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
 action: text("action").notNull(), // e.g., CREATE, UPDATE, DELETE
 tableName: text("table_name").notNull(),
 recordId: text("record_id").notNull(),
 changes: jsonb("changes"),
 ipAddress: inet("ip_address"),
 userAgent: text("user_agent"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
});