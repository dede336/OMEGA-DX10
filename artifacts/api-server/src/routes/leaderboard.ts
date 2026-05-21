import { Router } from "express";
import { db, usersTable, gameSavesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /leaderboard
router.get("/", async (req, res) => {
  const limitRaw = Number(req.query["limit"] ?? 50);
  const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 50 : limitRaw), 100);

  const rows = await db
    .select({
      username: usersTable.username,
      saveData: gameSavesTable.saveData,
      updatedAt: gameSavesTable.updatedAt,
    })
    .from(gameSavesTable)
    .innerJoin(usersTable, eq(gameSavesTable.userId, usersTable.id))
    .orderBy(desc(gameSavesTable.updatedAt))
    .limit(limit * 3);

  type SaveData = { tamerLevel?: number; playerName?: string; collection?: unknown[]; tamerId?: string };

  const entries = rows
    .map((row) => {
      const data = row.saveData as SaveData;
      return {
        username: row.username,
        tamerLevel: data.tamerLevel ?? 1,
        tamerName: data.playerName ?? row.username,
        collectionSize: Array.isArray(data.collection) ? data.collection.length : 0,
        tamerId: data.tamerId ?? null,
        updatedAt: row.updatedAt,
      };
    })
    .sort((a, b) => b.tamerLevel - a.tamerLevel || b.collectionSize - a.collectionSize)
    .slice(0, limit)
    .map((entry, i) => ({ rank: i + 1, ...entry }));

  res.json(entries);
});

export default router;
