import { Router } from "express";
import { db, bedsTable, admissionsTable, patientsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/ipd/beds", async (_req, res): Promise<void> => {
  const beds = await db.select().from(bedsTable).orderBy(bedsTable.bedNumber);

  const result = await Promise.all(beds.map(async (bed) => {
    let currentPatientName: string | null = null;
    if (bed.currentAdmissionId) {
      const [admission] = await db.select().from(admissionsTable).where(eq(admissionsTable.id, bed.currentAdmissionId)).limit(1);
      if (admission) {
        const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, admission.patientId)).limit(1);
        currentPatientName = patient?.name ?? null;
      }
    }
    return { ...bed, currentPatientName };
  }));

  res.json(result);
});

router.post("/ipd/beds", async (req, res): Promise<void> => {
  const { bedNumber, roomType, wardName } = req.body;
  if (!bedNumber || !roomType) { res.status(400).json({ error: "bedNumber and roomType required" }); return; }
  const [bed] = await db.insert(bedsTable).values({ bedNumber, roomType, wardName: wardName ?? null, status: "available" }).returning();
  res.status(201).json({ ...bed, currentPatientName: null });
});

async function buildAdmission(a: typeof admissionsTable.$inferSelect) {
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, a.patientId)).limit(1);
  const [bed] = await db.select().from(bedsTable).where(eq(bedsTable.id, a.bedId)).limit(1);
  let doctorName: string | null = null;
  if (a.doctorId) {
    const [doc] = await db.select().from(usersTable).where(eq(usersTable.id, a.doctorId)).limit(1);
    doctorName = doc?.name ?? null;
  }
  return {
    id: a.id,
    patientId: a.patientId,
    patientName: patient?.name ?? "Unknown",
    patientMobile: patient?.mobile ?? "",
    bedId: a.bedId,
    bedNumber: bed?.bedNumber ?? "",
    roomType: bed?.roomType ?? "general",
    doctorId: a.doctorId,
    doctorName,
    admissionType: a.admissionType,
    status: a.status,
    admissionDate: a.admissionDate,
    dischargeDate: a.dischargeDate,
    diagnosis: a.diagnosis,
    notes: a.notes,
    createdAt: a.createdAt,
  };
}

router.get("/ipd/admissions", async (req, res): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  let query = db.select().from(admissionsTable);
  if (status === "admitted" || status === "discharged") {
    query = query.where(eq(admissionsTable.status, status)) as typeof query;
  }
  const admissions = await query.orderBy(admissionsTable.admissionDate);
  res.json(await Promise.all(admissions.map(buildAdmission)));
});

router.post("/ipd/admissions", async (req, res): Promise<void> => {
  const { patientId, bedId, doctorId, admissionType, diagnosis, notes } = req.body;
  if (!patientId || !bedId || !admissionType) {
    res.status(400).json({ error: "patientId, bedId, and admissionType required" });
    return;
  }

  // Check bed availability
  const [bed] = await db.select().from(bedsTable).where(eq(bedsTable.id, bedId)).limit(1);
  if (!bed || bed.status === "occupied") {
    res.status(400).json({ error: "Bed is not available" });
    return;
  }

  const [admission] = await db.insert(admissionsTable).values({
    patientId, bedId, doctorId: doctorId ?? null, admissionType, diagnosis: diagnosis ?? null, notes: notes ?? null,
    status: "admitted", admissionDate: new Date(),
  }).returning();

  // Mark bed as occupied
  await db.update(bedsTable).set({ status: "occupied", currentAdmissionId: admission.id }).where(eq(bedsTable.id, bedId));
  // Update patient last visit
  await db.update(patientsTable).set({ lastVisitDate: new Date() }).where(eq(patientsTable.id, patientId));

  res.status(201).json(await buildAdmission(admission));
});

router.get("/ipd/admissions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [admission] = await db.select().from(admissionsTable).where(eq(admissionsTable.id, id)).limit(1);
  if (!admission) { res.status(404).json({ error: "Admission not found" }); return; }
  res.json(await buildAdmission(admission));
});

router.patch("/ipd/admissions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const updates: Record<string, unknown> = {};
  const fields = ["bedId", "doctorId", "diagnosis", "notes", "status"];
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (req.body.dischargeDate) updates.dischargeDate = new Date(req.body.dischargeDate);

  const [admission] = await db.update(admissionsTable).set(updates).where(eq(admissionsTable.id, id)).returning();
  if (!admission) { res.status(404).json({ error: "Not found" }); return; }

  // Free the bed if discharged
  if (req.body.status === "discharged") {
    await db.update(bedsTable).set({ status: "available", currentAdmissionId: null }).where(eq(bedsTable.id, admission.bedId));
  }

  res.json(await buildAdmission(admission));
});

export default router;
