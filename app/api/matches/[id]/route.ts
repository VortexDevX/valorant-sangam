import { ObjectId } from "mongodb";
import { getAuthorizedAdmin } from "@/lib/auth";
import { logApiError } from "@/lib/api-errors";
import { getDb } from "@/lib/mongodb";
import { matchSchema, normalizeScore } from "@/lib/validators";
import type { MatchRecord } from "@/types/match";

export const runtime = "nodejs";

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

async function resolveId(
  context: { params: Promise<{ id: string }> },
): Promise<ObjectId | null> {
  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return null;
  }

  return new ObjectId(id);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAuthorizedAdmin(request);

    if (!admin) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const objectId = await resolveId(context);

    if (!objectId) {
      return Response.json({ error: "Invalid match id." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = matchSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid match payload." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const updateResult = await db.collection("matches").findOneAndUpdate(
      { _id: objectId },
      {
        $set: {
          ...parsed.data,
          score: normalizeScore(parsed.data.score),
          note: parsed.data.note?.trim() ?? "",
          updatedAt: new Date(),
          updatedBy: admin,
        },
      },
      { returnDocument: "after" },
    );

    if (!updateResult) {
      return Response.json({ error: "Match not found." }, { status: 404 });
    }

    return Response.json({
      match: serializeMatch(updateResult as Record<string, unknown>),
    });
  } catch (error) {
    logApiError("PATCH /api/matches/[id]", error);
    return Response.json({ error: "Failed to update match." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAuthorizedAdmin(request);

    if (!admin) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const objectId = await resolveId(context);

    if (!objectId) {
      return Response.json({ error: "Invalid match id." }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("matches").deleteOne({ _id: objectId });

    if (!result.deletedCount) {
      return Response.json({ error: "Match not found." }, { status: 404 });
    }

    return Response.json({ success: true, deletedBy: admin });
  } catch (error) {
    logApiError("DELETE /api/matches/[id]", error);
    return Response.json({ error: "Failed to delete match." }, { status: 500 });
  }
}
