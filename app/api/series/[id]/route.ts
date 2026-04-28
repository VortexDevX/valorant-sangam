import { ObjectId } from "mongodb";
import { getAuthorizedAdmin } from "@/lib/auth";
import { logApiError } from "@/lib/api-errors";
import { getDb } from "@/lib/mongodb";
import { canEditSeriesSetup, canSwapSeriesSides, serializeSeries } from "@/lib/series";
import { seriesUpdateSchema } from "@/lib/validators";

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const objectId = await resolveId(context);

    if (!objectId) {
      return Response.json({ error: "Invalid series id." }, { status: 400 });
    }

    const db = await getDb();
    const series = await db.collection("series").findOne({ _id: objectId });

    if (!series) {
      return Response.json({ error: "Series not found." }, { status: 404 });
    }

    return Response.json({
      series: serializeSeries(series as Record<string, unknown>),
    });
  } catch (error) {
    logApiError("GET /api/series/[id]", error);
    return Response.json({ error: "Failed to load series." }, { status: 500 });
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
      return Response.json({ error: "Invalid series id." }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection("series").findOne({ _id: objectId });

    if (!existing) {
      return Response.json({ error: "Series not found." }, { status: 404 });
    }

    const serialized = serializeSeries(existing as Record<string, unknown>);

    if (serialized.bracket) {
      return Response.json(
        { error: "Bracket-generated series cannot be deleted directly." },
        { status: 409 },
      );
    }

    if (serialized.manualContinuation) {
      return Response.json(
        { error: "This manual series resolves a bracket match and cannot be deleted directly." },
        { status: 409 },
      );
    }

    const result = await db.collection("series").deleteOne({ _id: objectId });

    if (!result.deletedCount) {
      return Response.json({ error: "Series not found." }, { status: 404 });
    }

    return Response.json({ success: true, deletedBy: admin });
  } catch (error) {
    logApiError("DELETE /api/series/[id]", error);
    return Response.json({ error: "Failed to delete series." }, { status: 500 });
  }
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
      return Response.json({ error: "Invalid series id." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = seriesUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid series update." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const existing = await db.collection("series").findOne({ _id: objectId });

    if (!existing) {
      return Response.json({ error: "Series not found." }, { status: 404 });
    }

    const serialized = serializeSeries(existing as Record<string, unknown>);

    if (parsed.data.action === "swap_sides") {
      if (serialized.locked) {
        return Response.json(
          { error: "This series is locked. Unlock it before changing sides." },
          { status: 409 },
        );
      }

      if (!canSwapSeriesSides(serialized)) {
        return Response.json(
          { error: "Sides can only be swapped before veto starts." },
          { status: 409 },
        );
      }

      const now = new Date();

      await db.collection("series").updateOne(
        { _id: objectId },
        {
          $set: {
            teamA: serialized.teamB,
            teamB: serialized.teamA,
            teamASlug: serialized.teamBSlug,
            teamBSlug: serialized.teamASlug,
            updatedAt: now,
            updatedBy: admin,
          },
        },
      );

      const updated = await db.collection("series").findOne({ _id: objectId });

      return Response.json({
        series: serializeSeries(updated as Record<string, unknown>),
      });
    }

    if (parsed.data.action === "update_setup") {
      if (serialized.locked) {
        return Response.json(
          { error: "This series is locked. Unlock it before changing setup." },
          { status: 409 },
        );
      }

      if (!canEditSeriesSetup(serialized)) {
        return Response.json(
          { error: "Setup can only be changed before veto starts." },
          { status: 409 },
        );
      }

      const now = new Date();

      await db.collection("series").updateOne(
        { _id: objectId },
        {
          $set: {
            format: parsed.data.format,
            vetoStarter: parsed.data.vetoStarter,
            updatedAt: now,
            updatedBy: admin,
          },
        },
      );

      const updated = await db.collection("series").findOne({ _id: objectId });

      return Response.json({
        series: serializeSeries(updated as Record<string, unknown>),
      });
    }

    if (parsed.data.action === "set_lock") {
      const now = new Date();

      await db.collection("series").updateOne(
        { _id: objectId },
        {
          $set: {
            locked: parsed.data.locked,
            updatedAt: now,
            updatedBy: admin,
          },
        },
      );

      const updated = await db.collection("series").findOne({ _id: objectId });

      return Response.json({
        series: serializeSeries(updated as Record<string, unknown>),
      });
    }

    return Response.json({ error: "Unsupported series update." }, { status: 400 });
  } catch (error) {
    logApiError("PATCH /api/series/[id]", error);
    return Response.json({ error: "Failed to update series." }, { status: 500 });
  }
}
