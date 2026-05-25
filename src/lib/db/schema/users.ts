import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
 id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
 email: text("email").notNull().unique(),
 name: text("name").notNull(),
 role: text("role").notNull(), // owner, admin, manager, sales, procurement, gudang, finance, hr
 isActive: boolean("is_active").notNull().default(true),
 onboardingDisabled: boolean("onboarding_disabled").default(false),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 updatedAt: timestamp("updated_at").notNull().defaultNow(),
});