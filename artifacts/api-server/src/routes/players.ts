import { Router } from "express";
import { db, usersTable, gameSavesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// GET /players/:username
router.get("/:username", async (req, res) => {
  const { username } = req.params as { username: string };

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!user) {
    res.status(404).json({ error: "Jogador não encontrado" });
    return;
  }

  const [save] = await db.select().from(gameSavesTable).where(eq(gameSavesTable.userId, user.id)).limit(1);

  type SaveData = { tamerLevel?: number; playerName?: string; collection?: unknown[]; team?: string[] };
  const data = (save?.saveData ?? {}) as SaveData;

  res.json({
    username: user.username,
    tamerLevel: data.tamerLevel ?? 1,
    tamerName: data.playerName ?? user.username,
    collectionSize: Array.isArray(data.collection) ? data.collection.length : 0,
    topTeam: Array.isArray(data.team) ? data.team.slice(0, 3) : [],
    updatedAt: save?.updatedAt ?? user.createdAt,
  });
});

export default router;
