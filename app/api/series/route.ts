import { getAuthorizedAdmin } from "@/lib/auth";
import { logApiError } from "@/lib/api-errors";
import { getDb } from "@/lib/mongodb";
import { buildPairKey, normalizeTeamName, serializeSeries, slugifyTeamName } from "@/lib/series";
import { seriesCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = await getDb();
    const series = await db
      .collection("series")
      .find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    return Response.json({
      series: series.map((entry) => serializeSeries(entry as Record<string, unknown>)),
    });
  } catch (error) {
    logApiError("GET /api/series", error);
    return Response.json({ error: "Failed to load series." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthorizedAdmin(request);

    if (!admin) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = seriesCreateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid series payload." },
        { status: 400 },
      );
    }

    const teamA = normalizeTeamName(parsed.data.teamA);
    const teamB = normalizeTeamName(parsed.data.teamB);
    const teamASlug = slugifyTeamName(teamA);
    const teamBSlug = slugifyTeamName(teamB);
    const pairKey = buildPairKey(teamASlug, teamBSlug);
    const now = new Date();
    const db = await getDb();

    const result = await db.collection("series").insertOne({
      pairKey,
      teamA,
      teamB,
      teamASlug,
      teamBSlug,
      format: parsed.data.format,
      veto: null,
      results: [],
      createdAt: now,
      updatedAt: now,
      createdBy: admin,
    });

    const createdSeries = await db
      .collection("series")
      .findOne({ _id: result.insertedId });

    if (!createdSeries) {
      return Response.json({ error: "Failed to create series." }, { status: 500 });
    }

    return Response.json(
      { series: serializeSeries(createdSeries as Record<string, unknown>) },
      { status: 201 },
    );
  } catch (error) {
    logApiError("POST /api/series", error);
    return Response.json({ error: "Failed to create series." }, { status: 500 });
  }
}
