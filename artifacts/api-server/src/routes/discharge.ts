import { Router } from "express";
import { db, dischargeSummariesTable, patientsTable, usersTable, admissionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function buildDischarge(d: typeof dischargeSummariesTable.$inferSelect) {
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, d.patientId)).limit(1);
  let doctorName: string | null = null;
  if (d.doctorId) {
    const [doc] = await db.select().from(usersTable).where(eq(usersTable.id, d.doctorId)).limit(1);
    doctorName = doc?.name ?? null;
  }
  return {
    id: d.id,
    admissionId: d.admissionId,
    patientId: d.patientId,
    patientName: patient?.name ?? "Unknown",
    doctorId: d.doctorId,
    doctorName,
    admissionDate: d.admissionDate,
    dischargeDate: d.dischargeDate,
    finalDiagnosis: d.finalDiagnosis,
    treatmentSummary: d.treatmentSummary,
    procedures: d.procedures,
    medications: d.medications,
    followUpAdvice: d.followUpAdvice,
    condition: d.condition,
    createdAt: d.createdAt,
  };
}

router.post("/discharge", async (req, res): Promise<void> => {
  const { admissionId, doctorId, dischargeDate, finalDiagnosis, treatmentSummary, procedures, medications, followUpAdvice, condition } = req.body;
  if (!admissionId || !dischargeDate || !condition) {
    res.status(400).json({ error: "admissionId, dischargeDate, condition required" });
    return;
  }

  const [admission] = await db.select().from(admissionsTable).where(eq(admissionsTable.id, admissionId)).limit(1);
  if (!admission) { res.status(404).json({ error: "Admission not found" }); return; }

  const [d] = await db.insert(dischargeSummariesTable).values({
    admissionId,
    patientId: admission.patientId,
    doctorId: doctorId ?? admission.doctorId ?? null,
    admissionDate: admission.admissionDate,
    dischargeDate: new Date(dischargeDate),
    finalDiagnosis: finalDiagnosis ?? null,
    treatmentSummary: treatmentSummary ?? null,
    procedures: procedures ?? null,
    medications: medications ?? null,
    followUpAdvice: followUpAdvice ?? null,
    condition,
  }).returning();

  // Mark admission as discharged
  await db.update(admissionsTable).set({ status: "discharged", dischargeDate: new Date(dischargeDate) }).where(eq(admissionsTable.id, admissionId));

  res.status(201).json(await buildDischarge(d));
});

router.get("/discharge/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [d] = await db.select().from(dischargeSummariesTable).where(eq(dischargeSummariesTable.id, id)).limit(1);
  if (!d) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await buildDischarge(d));
});

router.patch("/discharge/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const updates: Record<string, unknown> = {};
  const fields = ["finalDiagnosis", "treatmentSummary", "procedures", "medications", "followUpAdvice", "condition"];
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  const [d] = await db.update(dischargeSummariesTable).set(updates).where(eq(dischargeSummariesTable.id, id)).returning();
  if (!d) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await buildDischarge(d));
});

export default router;
