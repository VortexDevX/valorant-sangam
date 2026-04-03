import { ObjectId } from "mongodb";
import { getAuthorizedAdmin } from "@/lib/auth";
import { logApiError } from "@/lib/api-errors";
import { getDb } from "@/lib/mongodb";
import { serializeSeries } from "@/lib/series";
import { applyVetoAction, deriveVetoState } from "@/lib/veto-engine";
import { seriesVetoSetupSchema, vetoActionSchema } from "@/lib/validators";

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
    const parsed = seriesVetoSetupSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid veto setup." },
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
        { error: "This series is locked. Unlock it before starting veto." },
        { status: 409 },
      );
    }

    if (series.results.length > 0) {
      return Response.json(
        { error: "Cannot reset veto after results have been added." },
        { status: 400 },
      );
    }

    const now = new Date();
    const veto = {
      status: "in_progress" as const,
      mapPool: parsed.data.mapPool,
      actions: [],
      result: { maps: [] },
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("series").updateOne(
      { _id: objectId },
      {
        $set: {
          veto,
          updatedAt: now,
          updatedBy: admin,
        },
      },
    );

    const updated = await db.collection("series").findOne({ _id: objectId });

    return Response.json({
      series: serializeSeries(updated as Record<string, unknown>),
    });
  } catch (error) {
    logApiError("POST /api/series/[id]/veto", error);
    return Response.json({ error: "Failed to start veto." }, { status: 500 });
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
    const parsed = vetoActionSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid veto action." },
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
        { error: "This series is locked. Unlock it before updating veto." },
        { status: 409 },
      );
    }

    if (!series.veto) {
      return Response.json({ error: "Veto has not been started yet." }, { status: 400 });
    }

    const nextActions = applyVetoAction(
      {
        format: series.format,
        mapPool: series.veto.mapPool,
        actions: series.veto.actions,
      },
      parsed.data,
    );
    const derived = deriveVetoState({
      format: series.format,
      mapPool: series.veto.mapPool,
      actions: nextActions,
    });
    const now = new Date();

    await db.collection("series").updateOne(
      { _id: objectId },
      {
        $set: {
          "veto.status": derived.isComplete ? "completed" : "in_progress",
          "veto.actions": nextActions,
          "veto.result": derived.result,
          "veto.updatedAt": now,
          updatedAt: now,
          updatedBy: admin,
        },
      },
    );

    const updated = await db.collection("series").findOne({ _id: objectId });

    return Response.json({
      series: serializeSeries(updated as Record<string, unknown>),
    });
  } catch (error) {
    logApiError("PATCH /api/series/[id]/veto", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to update veto.",
      },
      { status: 400 },
    );
  }
}
