import { Router } from "express";
import { db, consultationsTable, patientsTable, usersTable, opdTokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function buildConsultation(c: typeof consultationsTable.$inferSelect) {
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, c.patientId)).limit(1);
  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.id, c.doctorId)).limit(1);
  return {
    id: c.id,
    patientId: c.patientId,
    patientName: patient?.name ?? "Unknown",
    opdTokenId: c.opdTokenId,
    doctorId: c.doctorId,
    doctorName: doctor?.name ?? "Unknown",
    symptoms: c.symptoms,
    diagnosis: c.diagnosis,
    prescription: c.prescription,
    notes: c.notes,
    followUpDate: c.followUpDate,
    createdAt: c.createdAt,
  };
}

router.post("/consultations", async (req, res): Promise<void> => {
  const { patientId, opdTokenId, doctorId, symptoms, diagnosis, prescription, notes, followUpDate } = req.body;
  if (!patientId || !doctorId) {
    res.status(400).json({ error: "patientId and doctorId required" });
    return;
  }
  const [c] = await db.insert(consultationsTable).values({
    patientId, opdTokenId: opdTokenId ?? null, doctorId,
    symptoms: symptoms ?? null, diagnosis: diagnosis ?? null,
    prescription: prescription ?? null, notes: notes ?? null,
    followUpDate: followUpDate ?? null,
  }).returning();

  // Link consultation to OPD token and mark completed
  if (opdTokenId) {
    await db.update(opdTokensTable).set({ consultationId: c.id, status: "completed" }).where(eq(opdTokensTable.id, opdTokenId));
  }

  // Update patient last visit
  await db.update(patientsTable).set({ lastVisitDate: new Date() }).where(eq(patientsTable.id, patientId));

  res.status(201).json(await buildConsultation(c));
});

router.get("/consultations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [c] = await db.select().from(consultationsTable).where(eq(consultationsTable.id, id)).limit(1);
  if (!c) { res.status(404).json({ error: "Consultation not found" }); return; }
  res.json(await buildConsultation(c));
});

router.patch("/consultations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const updates: Record<string, unknown> = {};
  const fields = ["symptoms", "diagnosis", "prescription", "notes", "followUpDate"];
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  const [c] = await db.update(consultationsTable).set(updates).where(eq(consultationsTable.id, id)).returning();
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await buildConsultation(c));
});

export default router;
