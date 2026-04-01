import { ObjectId } from "mongodb";
import { getAuthorizedAdmin } from "@/lib/auth";
import { logApiError } from "@/lib/api-errors";
import { getDb } from "@/lib/mongodb";
import { getWinnerFromScore, serializeSeries } from "@/lib/series";
import { normalizeScore, seriesResultSchema } from "@/lib/validators";

export const runtime = "nodejs";

async function resolveParams(
  context: { params: Promise<{ id: string; order: string }> },
) {
  const { id, order } = await context.params;

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const orderNumber = Number(order);

  if (!Number.isInteger(orderNumber) || orderNumber < 1) {
    return null;
  }

  return {
    objectId: new ObjectId(id),
    orderNumber,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; order: string }> },
) {
  try {
    const admin = await getAuthorizedAdmin(request);

    if (!admin) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const resolved = await resolveParams(context);
    if (!resolved) {
      return Response.json({ error: "Invalid result reference." }, { status: 400 });
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
    await db.collection("series").updateOne(
      {
        _id: resolved.objectId,
        "results.order": resolved.orderNumber,
      },
      {
        $set: {
          "results.$.score": normalizeScore(parsed.data.score),
          "results.$.note": parsed.data.note?.trim() ?? "",
          "results.$.winner": getWinnerFromScore(parsed.data.score),
          "results.$.updatedAt": new Date(),
          updatedAt: new Date(),
          updatedBy: admin,
        },
      },
    );

    const updated = await db.collection("series").findOne({ _id: resolved.objectId });

    if (!updated) {
      return Response.json({ error: "Series not found." }, { status: 404 });
    }

    return Response.json({
      series: serializeSeries(updated as Record<string, unknown>),
    });
  } catch (error) {
    logApiError("PATCH /api/series/[id]/results/[order]", error);
    return Response.json({ error: "Failed to update result." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; order: string }> },
) {
  try {
    const admin = await getAuthorizedAdmin(request);

    if (!admin) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const resolved = await resolveParams(context);
    if (!resolved) {
      return Response.json({ error: "Invalid result reference." }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("series").updateOne(
      { _id: resolved.objectId },
      {
        $pull: { results: { order: resolved.orderNumber } },
        $set: {
          updatedAt: new Date(),
          updatedBy: admin,
        },
      } as never,
    );

    const updated = await db.collection("series").findOne({ _id: resolved.objectId });

    if (!updated) {
      return Response.json({ error: "Series not found." }, { status: 404 });
    }

    return Response.json({
      series: serializeSeries(updated as Record<string, unknown>),
    });
  } catch (error) {
    logApiError("DELETE /api/series/[id]/results/[order]", error);
    return Response.json({ error: "Failed to delete result." }, { status: 500 });
  }
}
