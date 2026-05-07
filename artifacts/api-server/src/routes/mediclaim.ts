import { Router } from "express";
import { db, mediclaimsTable, patientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function buildMediclaim(m: typeof mediclaimsTable.$inferSelect) {
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, m.patientId)).limit(1);
  return {
    id: m.id,
    patientId: m.patientId,
    patientName: patient?.name ?? "Unknown",
    admissionId: m.admissionId,
    insuranceProvider: m.insuranceProvider,
    policyNumber: m.policyNumber,
    tpaName: m.tpaName,
    sumInsured: m.sumInsured ? Number(m.sumInsured) : null,
    claimAmount: m.claimAmount ? Number(m.claimAmount) : null,
    claimStatus: m.claimStatus,
    preauthStatus: m.preauthStatus,
    preauthAmount: m.preauthAmount ? Number(m.preauthAmount) : null,
    notes: m.notes,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

router.get("/mediclaim", async (req, res): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  let query = db.select().from(mediclaimsTable);
  if (status) {
    query = query.where(eq(mediclaimsTable.claimStatus, status as "pending" | "submitted" | "approved" | "rejected")) as typeof query;
  }
  const items = await query.orderBy(mediclaimsTable.createdAt);
  res.json(await Promise.all(items.map(buildMediclaim)));
});

router.post("/mediclaim", async (req, res): Promise<void> => {
  const { patientId, admissionId, insuranceProvider, policyNumber, tpaName, sumInsured, claimAmount, preauthAmount, notes } = req.body;
  if (!patientId || !insuranceProvider || !policyNumber) {
    res.status(400).json({ error: "patientId, insuranceProvider, policyNumber required" });
    return;
  }
  const [m] = await db.insert(mediclaimsTable).values({
    patientId,
    admissionId: admissionId ?? null,
    insuranceProvider,
    policyNumber,
    tpaName: tpaName ?? null,
    sumInsured: sumInsured ? String(sumInsured) : null,
    claimAmount: claimAmount ? String(claimAmount) : null,
    preauthAmount: preauthAmount ? String(preauthAmount) : null,
    notes: notes ?? null,
    claimStatus: "pending",
    preauthStatus: "pending",
  }).returning();
  res.status(201).json(await buildMediclaim(m));
});

router.patch("/mediclaim/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const updates: Record<string, unknown> = {};
  if (req.body.claimStatus !== undefined) updates.claimStatus = req.body.claimStatus;
  if (req.body.preauthStatus !== undefined) updates.preauthStatus = req.body.preauthStatus;
  if (req.body.claimAmount !== undefined) updates.claimAmount = String(req.body.claimAmount);
  if (req.body.preauthAmount !== undefined) updates.preauthAmount = String(req.body.preauthAmount);
  if (req.body.tpaName !== undefined) updates.tpaName = req.body.tpaName;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;

  const [m] = await db.update(mediclaimsTable).set(updates).where(eq(mediclaimsTable.id, id)).returning();
  if (!m) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await buildMediclaim(m));
});

export default router;
