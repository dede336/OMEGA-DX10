import { Router } from "express";
import { db, gameSavesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

// GET /saves
router.get("/", requireAuth, async (req, res) => {
  const [save] = await db.select().from(gameSavesTable).where(eq(gameSavesTable.userId, req.auth!.userId)).limit(1);
  if (!save) {
    res.status(404).json({ error: "Nenhum save encontrado" });
    return;
  }
  res.json({ saveData: save.saveData, updatedAt: save.updatedAt });
});

// PUT /saves
router.put("/", requireAuth, async (req, res) => {
  const { saveData } = req.body as { saveData?: unknown };
  if (!saveData || typeof saveData !== "object") {
    res.status(400).json({ error: "saveData inválido" });
    return;
  }

  const merged = saveData as Record<string, unknown>;

  const [existing] = await db
    .select()
    .from(gameSavesTable)
    .where(eq(gameSavesTable.userId, req.auth!.userId))
    .limit(1);

  if (existing) {
    const dbMessages = ((existing.saveData as Record<string, unknown>)?.messages ?? []) as { id: string }[];
    const incomingMessages = (merged.messages ?? []) as { id: string }[];
    const incomingIds = new Set(incomingMessages.map((m) => m.id));
    const serverOnly = dbMessages.filter((m) => !incomingIds.has(m.id));
    if (serverOnly.length > 0) {
      merged.messages = [...incomingMessages, ...serverOnly];
    }
  }

  const [save] = await db
    .insert(gameSavesTable)
    .values({ userId: req.auth!.userId, saveData: merged, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: gameSavesTable.userId,
      set: { saveData: merged, updatedAt: sql`now()` },
    })
    .returning();
  res.json({ saveData: save.saveData, updatedAt: save.updatedAt });
});

export default router;
