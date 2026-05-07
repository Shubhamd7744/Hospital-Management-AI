import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age"),
  dob: text("dob"),
  gender: text("gender").notNull().$type<"male" | "female" | "other">(),
  mobile: text("mobile").notNull(),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  aadhaar: text("aadhaar"),
  bloodGroup: text("blood_group"),
  lastVisitDate: timestamp("last_visit_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({ id: true, patientId: true, createdAt: true, lastVisitDate: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patientsTable.$inferSelect;
