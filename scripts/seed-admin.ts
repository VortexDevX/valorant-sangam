import { hash } from "bcryptjs";
import { getDb } from "../lib/mongodb";

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD?.trim();

  if (!username || !password) {
    throw new Error(
      "SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD must be set in the environment.",
    );
  }

  const db = await getDb();
  const now = new Date();
  const passwordHash = await hash(password, 12);

  await db.collection("admins").updateOne(
    { username },
    {
      $set: {
        username,
        passwordHash,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  await db.collection("admins").createIndex({ username: 1 }, { unique: true });

  console.log(`Admin user "${username}" is ready.`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
