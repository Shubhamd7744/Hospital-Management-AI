import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const opdTokensTable = pgTable("opd_tokens", {
  id: serial("id").primaryKey(),
  tokenNumber: integer("token_number").notNull(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id"),
  visitType: text("visit_type").notNull().default("cash").$type<"cash" | "mediclaim">(),
  status: text("status").notNull().default("waiting").$type<"waiting" | "in_consultation" | "completed" | "cancelled">(),
  consultationId: integer("consultation_id"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOpdTokenSchema = createInsertSchema(opdTokensTable).omit({ id: true, tokenNumber: true, date: true, createdAt: true });
export type InsertOpdToken = z.infer<typeof insertOpdTokenSchema>;
export type OpdToken = typeof opdTokensTable.$inferSelect;
