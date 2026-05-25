import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const customerPic = pgTable("customer_pic", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 customerId: text("customer_id").notNull(),
 nama: text("nama").notNull(),
 jabatan: text("jabatan"),
 noHp: text("no_hp"),
 email: text("email"),
 isActive: boolean("is_active").notNull().default(true),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});