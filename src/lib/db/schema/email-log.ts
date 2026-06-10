import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const emailLog = pgTable("email_log", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 messageId: text("message_id"),
 fromEmail: text("from_email"),
 fromNama: text("from_nama"),
 toEmail: text("to_email").notNull(),
 toNama: text("to_nama"),
 cc: text("cc"),
 subject: text("subject").notNull(),
 body: text("body"),
 status: text("status").notNull().default("pending"),
 errorMessage: text("error_message"),
 hasAttachments: boolean("has_attachments").default(false),
 referenceType: text("reference_type"),
 referenceId: text("reference_id"),
 inbound: boolean("inbound").default(false),
  parentId: text("parent_id"),
  threadId: text("thread_id"),
  tags: text("tags"),
 bounceType: text("bounce_type"),
 deliveredAt: timestamp("delivered_at"),
 openedAt: timestamp("opened_at"),
 clickedAt: timestamp("clicked_at"),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
