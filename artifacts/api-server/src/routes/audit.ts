import { Router } from "express";
import { db, auditLogsTable, usersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/audit", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10), 200);
  const offset = parseInt(String(req.query.offset ?? "0"), 10);

  const logs = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(limit).offset(offset);
  const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(auditLogsTable);
  const total = Number(totalRow?.count ?? 0);

  const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean) as number[])];
  const users = userIds.length > 0
    ? await db.select().from(usersTable).where(sql`id = ANY(ARRAY[${sql.join(userIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
    : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  res.json({
    logs: logs.map(l => ({
      id: l.id,
      userId: l.userId,
      userName: l.userId ? (userMap.get(l.userId)?.name ?? null) : null,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      details: l.details,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt,
    })),
    total,
  });
});

export default router;
