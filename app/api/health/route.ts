import { logApiError } from "@/lib/api-errors";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  const env = {
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    hasMongoDbName: Boolean(process.env.MONGODB_DB_NAME),
    hasAuthJwtSecret: Boolean(process.env.AUTH_JWT_SECRET),
  };

  try {
    const db = await getDb();
    await db.command({ ping: 1 });

    return Response.json({
      ok: true,
      env,
      db: "reachable",
    });
  } catch (error) {
    logApiError("GET /api/health", error);

    return Response.json(
      {
        ok: false,
        env,
        db: "unreachable",
      },
      { status: 500 },
    );
  }
}
