import { ObjectId } from "mongodb";
import {
  BracketSeriesConflictError,
  syncBracketSeriesById,
} from "@/lib/bracket-series";
import { getAuthorizedAdmin } from "@/lib/auth";
import { logApiError } from "@/lib/api-errors";
import { getDb } from "@/lib/mongodb";
import { getNextSeriesMap, getWinnerFromScore, serializeSeries } from "@/lib/series";
import { normalizeScore, seriesResultSchema } from "@/lib/validators";

export const runtime = "nodejs";

async function resolveId(
  context: { params: Promise<{ id: string }> },
): Promise<ObjectId | null> {
  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return null;
  }

  return new ObjectId(id);
}

export async function POST(
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
      return Response.json({ error: "Invalid series id." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = seriesResultSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid result payload." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const existing = await db.collection("series").findOne({ _id: objectId });

    if (!existing) {
      return Response.json({ error: "Series not found." }, { status: 404 });
    }

    const series = serializeSeries(existing as Record<string, unknown>);

    if (series.locked) {
      return Response.json(
        { error: "This series is locked. Unlock it before editing results." },
        { status: 409 },
      );
    }

    const nextMap = getNextSeriesMap(series);

    if (!nextMap) {
      return Response.json(
        { error: "No map is available for the next result entry." },
        { status: 400 },
      );
    }

    const now = new Date();
    const nextResult = {
      order: nextMap.order,
      map: nextMap.map,
      score: normalizeScore(parsed.data.score),
      note: parsed.data.note?.trim() ?? "",
      winner: getWinnerFromScore(parsed.data.score),
      createdAt: now,
      updatedAt: now,
    };

    const writeResult = await db.collection("series").updateOne(
      {
        _id: objectId,
        "results.order": { $ne: nextMap.order },
      },
      {
        $push: { results: nextResult },
        $set: {
          updatedAt: now,
          updatedBy: admin,
        },
      } as never,
    );

    if (!writeResult.modifiedCount) {
      return Response.json(
        { error: "That result slot was already filled. Reload and try again." },
        { status: 409 },
      );
    }

    const updated = await db.collection("series").findOne({ _id: objectId });
    const serializedUpdated = serializeSeries(updated as Record<string, unknown>);

    if (serializedUpdated.bracket) {
      await syncBracketSeriesById(db, serializedUpdated.bracket.id, admin);
    }

    return Response.json({
      series: serializedUpdated,
    });
  } catch (error) {
    if (error instanceof BracketSeriesConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    logApiError("POST /api/series/[id]/results", error);
    return Response.json({ error: "Failed to add result." }, { status: 500 });
  }
}
