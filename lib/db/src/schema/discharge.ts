import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dischargeSummariesTable = pgTable("discharge_summaries", {
  id: serial("id").primaryKey(),
  admissionId: integer("admission_id").notNull().unique(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id"),
  admissionDate: timestamp("admission_date", { withTimezone: true }).notNull(),
  dischargeDate: timestamp("discharge_date", { withTimezone: true }).notNull(),
  finalDiagnosis: text("final_diagnosis"),
  treatmentSummary: text("treatment_summary"),
  procedures: text("procedures"),
  medications: text("medications"),
  followUpAdvice: text("follow_up_advice"),
  condition: text("condition").notNull().$type<"stable" | "improved" | "critical" | "expired">(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDischargeSummarySchema = createInsertSchema(dischargeSummariesTable).omit({ id: true, createdAt: true });
export type InsertDischargeSummary = z.infer<typeof insertDischargeSummarySchema>;
export type DischargeSummary = typeof dischargeSummariesTable.$inferSelect;
