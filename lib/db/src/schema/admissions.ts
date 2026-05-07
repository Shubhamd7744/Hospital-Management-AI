import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const admissionsTable = pgTable("admissions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  bedId: integer("bed_id").notNull(),
  doctorId: integer("doctor_id"),
  admissionType: text("admission_type").notNull().$type<"cash" | "mediclaim">(),
  status: text("status").notNull().default("admitted").$type<"admitted" | "discharged">(),
  admissionDate: timestamp("admission_date", { withTimezone: true }).notNull().defaultNow(),
  dischargeDate: timestamp("discharge_date", { withTimezone: true }),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdmissionSchema = createInsertSchema(admissionsTable).omit({ id: true, status: true, admissionDate: true, dischargeDate: true, createdAt: true });
export type InsertAdmission = z.infer<typeof insertAdmissionSchema>;
export type Admission = typeof admissionsTable.$inferSelect;
