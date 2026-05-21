import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

function signToken(userId: number, username: string) {
  const secret = process.env["SESSION_SECRET"]!;
  return jwt.sign({ userId, username }, secret, { expiresIn: "30d" });
}

// POST /auth/register
router.post("/register", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "username e password são obrigatórios" });
    return;
  }
  if (username.length < 3 || username.length > 20) {
    res.status(400).json({ error: "Username deve ter entre 3 e 20 caracteres" });
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    res.status(400).json({ error: "Username só pode conter letras, números e _" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Senha deve ter ao menos 6 caracteres" });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Username já está em uso" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ username, passwordHash }).returning();
  const token = signToken(user.id, user.username);
  res.status(201).json({ token, user: { id: user.id, username: user.username, createdAt: user.createdAt } });
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "username e password são obrigatórios" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Usuário ou senha inválidos" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Usuário ou senha inválidos" });
    return;
  }
  const token = signToken(user.id, user.username);
  res.json({ token, user: { id: user.id, username: user.username, createdAt: user.createdAt } });
});

// GET /auth/me
router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.auth!.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Usuário não encontrado" });
    return;
  }
  res.json({ id: user.id, username: user.username, createdAt: user.createdAt });
});

export default router;
