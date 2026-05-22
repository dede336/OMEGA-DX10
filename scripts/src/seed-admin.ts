import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const ADMIN_USERNAME = "dede336";
const ADMIN_PASSWORD_HASH = "$2b$10$r/ekX0dNQuELGOBopAzOeu1bkUPXzYVwZVvXT/jyUs0wT9ZQQbbry";

async function seedAdmin() {
  const [existing] = await db
    .select({ id: usersTable.id, isAdmin: usersTable.isAdmin })
    .from(usersTable)
    .where(eq(usersTable.username, ADMIN_USERNAME))
    .limit(1);

  if (existing) {
    if (!existing.isAdmin) {
      await db
        .update(usersTable)
        .set({ isAdmin: true })
        .where(eq(usersTable.id, existing.id));
      console.log(`Conta '${ADMIN_USERNAME}' já existia — promovida para admin.`);
    } else {
      console.log(`Conta '${ADMIN_USERNAME}' já existe e já é admin. Nada a fazer.`);
    }
  } else {
    await db.insert(usersTable).values({
      username: ADMIN_USERNAME,
      passwordHash: ADMIN_PASSWORD_HASH,
      isAdmin: true,
    });
    console.log(`Conta admin '${ADMIN_USERNAME}' criada com sucesso.`);
  }

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Erro ao criar conta admin:", err);
  process.exit(1);
});
