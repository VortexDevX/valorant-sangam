import { getAuthorizedAdmin } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { matchSchema, normalizeScore } from "@/lib/validators";
import type { MatchRecord } from "@/types/match";

function serializeMatch(match: Record<string, unknown>): MatchRecord {
  return {
    _id: String(match._id),
    teamA: String(match.teamA),
    teamB: String(match.teamB),
    map: String(match.map) as MatchRecord["map"],
    score: String(match.score),
    note: String(match.note ?? ""),
    createdAt:
      match.createdAt instanceof Date
        ? match.createdAt.toISOString()
        : String(match.createdAt),
    updatedAt:
      match.updatedAt instanceof Date
        ? match.updatedAt.toISOString()
        : String(match.updatedAt),
  };
}

export async function GET() {
  try {
    const db = await getDb();
    const matches = await db
      .collection("matches")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({
      matches: matches.map((match) => serializeMatch(match as Record<string, unknown>)),
    });
  } catch {
    return Response.json({ error: "Failed to load matches." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthorizedAdmin(request);

    if (!admin) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = matchSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid match payload." },
        { status: 400 },
      );
    }

    const now = new Date();
    const db = await getDb();
    const result = await db.collection("matches").insertOne({
      ...parsed.data,
      score: normalizeScore(parsed.data.score),
      note: parsed.data.note?.trim() ?? "",
      createdAt: now,
      updatedAt: now,
      createdBy: admin,
    });

    const createdMatch = await db
      .collection("matches")
      .findOne({ _id: result.insertedId });

    if (!createdMatch) {
      return Response.json({ error: "Failed to create match." }, { status: 500 });
    }

    return Response.json(
      { match: serializeMatch(createdMatch as Record<string, unknown>) },
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "Failed to create match." }, { status: 500 });
  }
}
