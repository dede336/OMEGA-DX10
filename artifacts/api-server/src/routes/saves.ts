import { Router } from "express";
import { db, gameSavesTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

const CODEX_ORDER = [
  'agumon','agumonSaver','geoGreymon','rizeGreymon','shineGreymon','shineGreymonBurstMode',
  'veemon','exVeemon','paildramon','imperialDramonFM','imperialDramonRM','imperialDramonPM',
  'greymon','metalGreymon','warGreymon',
  'gabumon','garurumon','wereGarurumon','metalGarurumon','omegamon',
  'guilmon','growlmon','megaloGrowlmon','gallantmon','gallantmonCrimsonMode',
  'lucemon','lucemonChaosMode',
  'patamon','angemon','magnaAngemon','goldramon','seraphimon',
  'pyomon','birdramon','garudamon','phoenixmon',
  'salamon','tailmon','angewomon','magnadramon','ophanimon',
  'palmon','togemon','lillymon','rosemon','rosemonBurstMode',
  'demiDevimon','devimon','myotismon','vnonMyotismon',
  'gulusGammamon',
];

type OwnedEntry = { ownedId: string; characterId: string; level: number; exp: number };

function injectAdminDigimon(saveData: Record<string, unknown>): Record<string, unknown> {
  const existing = (saveData.collection ?? []) as OwnedEntry[];
  const ownedCharIds = new Set(existing.map((c) => c.characterId));
  const missing = CODEX_ORDER.filter((id) => !ownedCharIds.has(id));
  if (missing.length === 0) return saveData;
  const injected: OwnedEntry[] = missing.map((charId) => ({
    ownedId: `admin_${charId}`,
    characterId: charId,
    level: 100,
    exp: 0,
  }));
  return { ...saveData, collection: [...existing, ...injected] };
}

// GET /saves
router.get("/", requireAuth, async (req, res) => {
  const [save] = await db.select().from(gameSavesTable).where(eq(gameSavesTable.userId, req.auth!.userId)).limit(1);
  if (!save) {
    res.status(404).json({ error: "Nenhum save encontrado" });
    return;
  }
  const [user] = await db.select({ isAdmin: usersTable.isAdmin }).from(usersTable).where(eq(usersTable.id, req.auth!.userId)).limit(1);
  const isAdmin = user?.isAdmin ?? false;
  const saveData = isAdmin
    ? injectAdminDigimon(save.saveData as Record<string, unknown>)
    : save.saveData;
  res.json({ saveData, updatedAt: save.updatedAt, isAdmin, isDede: isAdmin });
});

// PUT /saves
router.put("/", requireAuth, async (req, res) => {
  const { saveData } = req.body as { saveData?: unknown };
  if (!saveData || typeof saveData !== "object") {
    res.status(400).json({ error: "saveData inválido" });
    return;
  }

  let merged = saveData as Record<string, unknown>;

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
      merged = { ...merged, messages: [...incomingMessages, ...serverOnly] };
    }
  }

  const [user] = await db.select({ isAdmin: usersTable.isAdmin }).from(usersTable).where(eq(usersTable.id, req.auth!.userId)).limit(1);
  if (user?.isAdmin) {
    merged = injectAdminDigimon(merged);
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
