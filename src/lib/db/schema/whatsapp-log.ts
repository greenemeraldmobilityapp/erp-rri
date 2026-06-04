import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const whatsappLog = pgTable("whatsapp_log", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  userId: text("user_id"),
  recipient: text("recipient").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull(), // sent, failed, delivered
  errorReason: text("error_reason"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});