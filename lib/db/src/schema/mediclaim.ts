import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mediclaimsTable = pgTable("mediclaims", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  admissionId: integer("admission_id"),
  insuranceProvider: text("insurance_provider").notNull(),
  policyNumber: text("policy_number").notNull(),
  tpaName: text("tpa_name"),
  sumInsured: numeric("sum_insured", { precision: 12, scale: 2 }),
  claimAmount: numeric("claim_amount", { precision: 12, scale: 2 }),
  claimStatus: text("claim_status").notNull().default("pending").$type<"pending" | "submitted" | "approved" | "rejected">(),
  preauthStatus: text("preauth_status").notNull().default("pending").$type<"pending" | "submitted" | "approved" | "rejected">(),
  preauthAmount: numeric("preauth_amount", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMediclaimSchema = createInsertSchema(mediclaimsTable).omit({ id: true, claimStatus: true, preauthStatus: true, createdAt: true, updatedAt: true });
export type InsertMediclaim = z.infer<typeof insertMediclaimSchema>;
export type Mediclaim = typeof mediclaimsTable.$inferSelect;
