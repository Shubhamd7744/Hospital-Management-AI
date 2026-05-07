import { Router } from "express";
import { db, opdTokensTable, patientsTable, usersTable, consultationsTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";

const router = Router();

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

router.get("/opd/queue", async (req, res): Promise<void> => {
  const date = typeof req.query.date === "string" ? req.query.date : todayDate();
  const tokens = await db.select().from(opdTokensTable)
    .where(eq(opdTokensTable.date, date))
    .orderBy(opdTokensTable.tokenNumber);

  const patientIds = [...new Set(tokens.map(t => t.patientId))];
  const doctorIds = [...new Set(tokens.map(t => t.doctorId).filter(Boolean) as number[])];

  const patients = patientIds.length > 0
    ? await db.select().from(patientsTable).where(sql`id = ANY(ARRAY[${sql.join(patientIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
    : [];
  const doctors = doctorIds.length > 0
    ? await db.select().from(usersTable).where(sql`id = ANY(ARRAY[${sql.join(doctorIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
    : [];

  const patientMap = new Map(patients.map(p => [p.id, p]));
  const doctorMap = new Map(doctors.map(d => [d.id, d]));

  res.json(tokens.map(t => ({
    id: t.id,
    tokenNumber: t.tokenNumber,
    patientId: t.patientId,
    patientName: patientMap.get(t.patientId)?.name ?? "Unknown",
    patientMobile: patientMap.get(t.patientId)?.mobile ?? "",
    doctorId: t.doctorId,
    doctorName: t.doctorId ? (doctorMap.get(t.doctorId)?.name ?? null) : null,
    status: t.status,
    consultationId: t.consultationId,
    date: t.date,
    createdAt: t.createdAt,
  })));
});

router.post("/opd/queue", async (req, res): Promise<void> => {
  const { patientId, doctorId, visitType } = req.body;
  if (!patientId) { res.status(400).json({ error: "patientId required" }); return; }

  const date = todayDate();
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(opdTokensTable).where(eq(opdTokensTable.date, date));
  const tokenNumber = Number(countResult[0]?.count ?? 0) + 1;

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId)).limit(1);
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

  const [token] = await db.insert(opdTokensTable).values({
    patientId,
    doctorId: doctorId ?? null,
    visitType: visitType ?? "cash",
    tokenNumber,
    date,
    status: "waiting",
  }).returning();

  // Update patient last visit
  await db.update(patientsTable).set({ lastVisitDate: new Date() }).where(eq(patientsTable.id, patientId));

  let doctorName = null;
  if (doctorId) {
    const [doc] = await db.select().from(usersTable).where(eq(usersTable.id, doctorId)).limit(1);
    doctorName = doc?.name ?? null;
  }

  res.status(201).json({
    id: token.id,
    tokenNumber: token.tokenNumber,
    patientId: token.patientId,
    patientName: patient.name,
    patientMobile: patient.mobile,
    doctorId: token.doctorId,
    doctorName,
    status: token.status,
    consultationId: token.consultationId,
    date: token.date,
    createdAt: token.createdAt,
  });
});

router.patch("/opd/queue/:id/status", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { status, doctorId } = req.body;

  const updates: Record<string, unknown> = { status };
  if (doctorId !== undefined) updates.doctorId = doctorId;

  const [token] = await db.update(opdTokensTable).set(updates).where(eq(opdTokensTable.id, id)).returning();
  if (!token) { res.status(404).json({ error: "Token not found" }); return; }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, token.patientId)).limit(1);
  let doctorName = null;
  if (token.doctorId) {
    const [doc] = await db.select().from(usersTable).where(eq(usersTable.id, token.doctorId)).limit(1);
    doctorName = doc?.name ?? null;
  }

  res.json({
    id: token.id,
    tokenNumber: token.tokenNumber,
    patientId: token.patientId,
    patientName: patient?.name ?? "Unknown",
    patientMobile: patient?.mobile ?? "",
    doctorId: token.doctorId,
    doctorName,
    status: token.status,
    consultationId: token.consultationId,
    date: token.date,
    createdAt: token.createdAt,
  });
});

export default router;
