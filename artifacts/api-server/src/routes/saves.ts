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
  const [save] = await db
    .insert(gameSavesTable)
    .values({ userId: req.auth!.userId, saveData, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: gameSavesTable.userId,
      set: { saveData, updatedAt: sql`now()` },
    })
    .returning();
  res.json({ saveData: save.saveData, updatedAt: save.updatedAt });
});

export default router;
