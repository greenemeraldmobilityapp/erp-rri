import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const jurnal = pgTable("jurnal", {
  id: text("id").primaryKey(),
  nomor: text("nomor").notNull().unique(),
  tanggal: timestamp("tanggal").notNull(),
  status: text("status").notNull().default("draft"),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});