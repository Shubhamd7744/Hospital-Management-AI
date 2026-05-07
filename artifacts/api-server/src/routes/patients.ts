import { Router } from "express";
import { db, patientsTable, opdTokensTable, consultationsTable, admissionsTable } from "@workspace/db";
import { eq, ilike, or, desc, sql } from "drizzle-orm";

const router = Router();

async function generatePatientId(): Promise<string> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(patientsTable);
  const count = Number(result[0]?.count ?? 0) + 1;
  return `P-${String(count).padStart(5, "0")}`;
}

router.get("/patients", async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
  const offset = parseInt(String(req.query.offset ?? "0"), 10);

  let query = db.select().from(patientsTable);
  if (q) {
    query = query.where(or(
      ilike(patientsTable.name, `%${q}%`),
      ilike(patientsTable.mobile, `%${q}%`),
      ilike(patientsTable.patientId, `%${q}%`)
    )) as typeof query;
  }

  const patients = await query.orderBy(desc(patientsTable.lastVisitDate), desc(patientsTable.createdAt)).limit(limit).offset(offset);
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(patientsTable);
  const total = Number(totalResult[0]?.count ?? 0);

  res.json({ patients, total });
});

router.post("/patients", async (req, res): Promise<void> => {
  const { name, age, dob, gender, mobile, address, emergencyContact, aadhaar, bloodGroup } = req.body;
  if (!name || !gender || !mobile) {
    res.status(400).json({ error: "name, gender, and mobile are required" });
    return;
  }
  const patientId = await generatePatientId();
  const [patient] = await db.insert(patientsTable).values({
    patientId, name, age, dob, gender, mobile, address, emergencyContact, aadhaar, bloodGroup,
  }).returning();
  res.status(201).json(patient);
});

router.get("/patients/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id)).limit(1);
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
  res.json(patient);
});

router.patch("/patients/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const updates: Record<string, unknown> = {};
  const fields = ["name", "age", "dob", "gender", "mobile", "address", "emergencyContact", "aadhaar", "bloodGroup"];
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  const [patient] = await db.update(patientsTable).set(updates).where(eq(patientsTable.id, id)).returning();
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
  res.json(patient);
});

router.get("/patients/:id/visits", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const opdVisits = await db.select().from(opdTokensTable)
    .leftJoin(consultationsTable, eq(consultationsTable.opdTokenId, opdTokensTable.id))
    .where(eq(opdTokensTable.patientId, id))
    .orderBy(desc(opdTokensTable.createdAt))
    .limit(20);

  const ipdVisits = await db.select().from(admissionsTable)
    .where(eq(admissionsTable.patientId, id))
    .orderBy(desc(admissionsTable.admissionDate))
    .limit(10);

  const visits = [
    ...opdVisits.map(v => ({
      id: v.opd_tokens.id,
      type: "opd" as const,
      date: v.opd_tokens.createdAt,
      doctorId: v.opd_tokens.doctorId,
      diagnosis: v.consultations?.diagnosis ?? null,
      status: v.opd_tokens.status,
    })),
    ...ipdVisits.map(v => ({
      id: v.id,
      type: "ipd" as const,
      date: v.admissionDate,
      doctorId: v.doctorId,
      diagnosis: v.diagnosis,
      status: v.status,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json(visits);
});

export default router;
