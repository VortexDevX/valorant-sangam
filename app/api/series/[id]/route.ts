import { ObjectId } from "mongodb";
import { getAuthorizedAdmin } from "@/lib/auth";
import { logApiError } from "@/lib/api-errors";
import { getDb } from "@/lib/mongodb";
import { serializeSeries } from "@/lib/series";

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
