import { Router } from "express";
import { db, opdTokensTable, admissionsTable, bedsTable, billsTable, mediclaimsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

const router = Router();

router.get("/reports/dashboard", async (req, res): Promise<void> => {
  const date = typeof req.query.date === "string" ? req.query.date : new Date().toISOString().split("T")[0];

  const [opdStats] = await db.select({
    total: sql<number>`count(*)`,
    completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
    waiting: sql<number>`sum(case when status = 'waiting' then 1 else 0 end)`,
    in_consultation: sql<number>`sum(case when status = 'in_consultation' then 1 else 0 end)`,
  }).from(opdTokensTable).where(eq(opdTokensTable.date, date));

  const [bedStats] = await db.select({
    total: sql<number>`count(*)`,
    occupied: sql<number>`sum(case when status = 'occupied' then 1 else 0 end)`,
    available: sql<number>`sum(case when status = 'available' then 1 else 0 end)`,
  }).from(bedsTable);

  const todayStart = new Date(date);
  const todayEnd = new Date(date);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [admissionStats] = await db.select({
    admissions: sql<number>`sum(case when admission_date >= ${todayStart.toISOString()} and admission_date < ${todayEnd.toISOString()} then 1 else 0 end)`,
    discharges: sql<number>`sum(case when discharge_date >= ${todayStart.toISOString()} and discharge_date < ${todayEnd.toISOString()} then 1 else 0 end)`,
    census: sql<number>`sum(case when status = 'admitted' then 1 else 0 end)`,
  }).from(admissionsTable);

  const [revenueStats] = await db.select({
    revenue: sql<number>`sum(cast(total_amount as decimal))`,
  }).from(billsTable).where(
    and(
      gte(billsTable.createdAt, todayStart),
      lte(billsTable.createdAt, todayEnd),
      eq(billsTable.status, "paid")
    )
  );

  const [pendingClaims] = await db.select({
    count: sql<number>`count(*)`,
  }).from(mediclaimsTable).where(eq(mediclaimsTable.claimStatus, "pending"));

  res.json({
    date,
    opdCount: Number(opdStats?.total ?? 0),
    opdCompleted: Number(opdStats?.completed ?? 0),
    opdWaiting: Number(opdStats?.waiting ?? 0) + Number(opdStats?.in_consultation ?? 0),
    ipdAdmissions: Number(admissionStats?.admissions ?? 0),
    ipdDischarges: Number(admissionStats?.discharges ?? 0),
    currentIpdCensus: Number(admissionStats?.census ?? 0),
    totalBeds: Number(bedStats?.total ?? 0),
    availableBeds: Number(bedStats?.available ?? 0),
    occupiedBeds: Number(bedStats?.occupied ?? 0),
    todayRevenue: Number(revenueStats?.revenue ?? 0),
    pendingClaims: Number(pendingClaims?.count ?? 0),
  });
});

router.get("/reports/revenue", async (req, res): Promise<void> => {
  const from = typeof req.query.from === "string" ? req.query.from : new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const to = typeof req.query.to === "string" ? req.query.to : new Date().toISOString().split("T")[0];
  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setDate(toDate.getDate() + 1);

  const [stats] = await db.select({
    total: sql<number>`sum(cast(total_amount as decimal))`,
    cash: sql<number>`sum(case when payment_mode = 'cash' then cast(total_amount as decimal) else 0 end)`,
    mediclaim: sql<number>`sum(case when payment_mode = 'mediclaim' then cast(total_amount as decimal) else 0 end)`,
    opd: sql<number>`sum(case when bill_type = 'opd' then cast(total_amount as decimal) else 0 end)`,
    ipd: sql<number>`sum(case when bill_type = 'ipd' then cast(total_amount as decimal) else 0 end)`,
    pending: sql<number>`sum(case when status != 'paid' then cast(total_amount as decimal) - cast(paid_amount as decimal) else 0 end)`,
  }).from(billsTable).where(and(gte(billsTable.createdAt, fromDate), lte(billsTable.createdAt, toDate)));

  res.json({
    from,
    to,
    totalRevenue: Number(stats?.total ?? 0),
    cashRevenue: Number(stats?.cash ?? 0),
    mediclaimRevenue: Number(stats?.mediclaim ?? 0),
    opdRevenue: Number(stats?.opd ?? 0),
    ipdRevenue: Number(stats?.ipd ?? 0),
    pendingAmount: Number(stats?.pending ?? 0),
  });
});

router.get("/reports/opd-trend", async (req, res): Promise<void> => {
  const days = Math.min(parseInt(String(req.query.days ?? "7"), 10), 30);
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const [row] = await db.select({ count: sql<number>`count(*)` }).from(opdTokensTable).where(eq(opdTokensTable.date, dateStr));
    result.push({ date: dateStr, count: Number(row?.count ?? 0) });
  }
  res.json(result);
});

router.get("/reports/bed-occupancy", async (_req, res): Promise<void> => {
  const [total] = await db.select({ total: sql<number>`count(*)`, occupied: sql<number>`sum(case when status='occupied' then 1 else 0 end)`, available: sql<number>`sum(case when status='available' then 1 else 0 end)` }).from(bedsTable);

  const byType = await db.select({
    roomType: bedsTable.roomType,
    total: sql<number>`count(*)`,
    occupied: sql<number>`sum(case when status='occupied' then 1 else 0 end)`,
    available: sql<number>`sum(case when status='available' then 1 else 0 end)`,
  }).from(bedsTable).groupBy(bedsTable.roomType);

  res.json({
    total: Number(total?.total ?? 0),
    occupied: Number(total?.occupied ?? 0),
    available: Number(total?.available ?? 0),
    byRoomType: byType.map(r => ({
      roomType: r.roomType,
      total: Number(r.total),
      occupied: Number(r.occupied),
      available: Number(r.available),
    })),
  });
});

export default router;
