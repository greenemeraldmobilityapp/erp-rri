import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { customer } from "./customer";

export const rfqCustomer = pgTable("rfq_customer", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  nomor: text("nomor").notNull().unique(),
  customerId: text("customer_id").notNull().references(() => customer.id, { onDelete: "restrict" }),
  nomorRfqCustomer: text("nomor_rfq_customer"),
  tanggal: timestamp("tanggal").notNull(),
  picCustomerId: text("pic_customer_id"),
  perihal: text("perihal"),
  status: text("status").notNull().default("draft"),
  keterangan: text("keterangan"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
