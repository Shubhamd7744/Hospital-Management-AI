import { Router } from "express";
import { db, billsTable, patientsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

interface BillItem {
  id: number;
  description: string;
  chargeType: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

function computeTotals(items: Array<{ quantity: number; unitPrice: number }>, discount = 0) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  return { subtotal, totalAmount };
}

async function generateBillNumber(): Promise<string> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(billsTable);
  const count = Number(result[0]?.count ?? 0) + 1;
  return `BILL-${String(count).padStart(5, "0")}`;
}

async function buildBill(b: typeof billsTable.$inferSelect) {
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, b.patientId)).limit(1);
  const rawItems = Array.isArray(b.items) ? b.items as Array<{ description: string; chargeType: string; quantity: number; unitPrice: number }> : [];
  const items: BillItem[] = rawItems.map((item, idx) => ({
    id: idx + 1,
    description: item.description,
    chargeType: item.chargeType,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: item.quantity * item.unitPrice,
  }));
  return {
    id: b.id,
    billNumber: b.billNumber,
    patientId: b.patientId,
    patientName: patient?.name ?? "Unknown",
    admissionId: b.admissionId,
    billType: b.billType,
    paymentMode: b.paymentMode,
    status: b.status,
    items,
    subtotal: Number(b.subtotal),
    discount: Number(b.discount),
    totalAmount: Number(b.totalAmount),
    paidAmount: Number(b.paidAmount),
    notes: b.notes,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

router.get("/billing", async (req, res): Promise<void> => {
  const patientId = req.query.patientId ? parseInt(String(req.query.patientId), 10) : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  let query = db.select().from(billsTable);
  if (patientId) query = query.where(eq(billsTable.patientId, patientId)) as typeof query;
  if (status) query = query.where(eq(billsTable.status, status as "draft" | "final" | "paid")) as typeof query;

  const bills = await query.orderBy(billsTable.createdAt);
  res.json(await Promise.all(bills.map(buildBill)));
});

router.post("/billing", async (req, res): Promise<void> => {
  const { patientId, admissionId, billType, paymentMode, items = [], discount = 0, paidAmount = 0, notes } = req.body;
  if (!patientId || !billType || !paymentMode) {
    res.status(400).json({ error: "patientId, billType, paymentMode required" });
    return;
  }
  const billNumber = await generateBillNumber();
  const { subtotal, totalAmount } = computeTotals(items, discount);
  const [bill] = await db.insert(billsTable).values({
    billNumber,
    patientId,
    admissionId: admissionId ?? null,
    billType,
    paymentMode,
    status: "draft",
    items,
    subtotal: String(subtotal),
    discount: String(discount),
    totalAmount: String(totalAmount),
    paidAmount: String(paidAmount),
    notes: notes ?? null,
  }).returning();
  res.status(201).json(await buildBill(bill));
});

router.get("/billing/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [bill] = await db.select().from(billsTable).where(eq(billsTable.id, id)).limit(1);
  if (!bill) { res.status(404).json({ error: "Bill not found" }); return; }
  res.json(await buildBill(bill));
});

router.patch("/billing/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [existing] = await db.select().from(billsTable).where(eq(billsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Bill not found" }); return; }

  const updates: Record<string, unknown> = {};
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.paymentMode !== undefined) updates.paymentMode = req.body.paymentMode;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  if (req.body.paidAmount !== undefined) updates.paidAmount = String(req.body.paidAmount);
  if (req.body.discount !== undefined) updates.discount = String(req.body.discount);

  if (req.body.items !== undefined) {
    const items = req.body.items;
    const discount = req.body.discount ?? Number(existing.discount);
    const { subtotal, totalAmount } = computeTotals(items, discount);
    updates.items = items;
    updates.subtotal = String(subtotal);
    updates.totalAmount = String(totalAmount);
  }

  const [bill] = await db.update(billsTable).set(updates).where(eq(billsTable.id, id)).returning();
  res.json(await buildBill(bill));
});

export default router;
