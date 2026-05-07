import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bedsTable = pgTable("beds", {
  id: serial("id").primaryKey(),
  bedNumber: text("bed_number").notNull().unique(),
  roomType: text("room_type").notNull().$type<"general" | "semi_special" | "special">(),
  wardName: text("ward_name"),
  status: text("status").notNull().default("available").$type<"available" | "occupied">(),
  currentAdmissionId: integer("current_admission_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBedSchema = createInsertSchema(bedsTable).omit({ id: true, status: true, currentAdmissionId: true, createdAt: true });
export type InsertBed = z.infer<typeof insertBedSchema>;
export type Bed = typeof bedsTable.$inferSelect;
