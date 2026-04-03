import { ObjectId } from "mongodb";
import {
  BracketSeriesConflictError,
  canSafelyReplaceBracketTeams,
  loadBracketLinkedSeries,
  syncBracketSeries,
} from "@/lib/bracket-series";
import { getAuthorizedAdmin } from "@/lib/auth";
import { logApiError } from "@/lib/api-errors";
import { normalizeBracketTeams, serializeBracket } from "@/lib/brackets";
import { getDb } from "@/lib/mongodb";
import { slugifyTeamName } from "@/lib/series";
import { bracketUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";

async function resolveId(context: { params: Promise<{ id: string }> }) {
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
      return Response.json({ error: "Invalid bracket id." }, { status: 400 });
    }

    const db = await getDb();
    const bracket = await db.collection("brackets").findOne({ _id: objectId });

    if (!bracket) {
      return Response.json({ error: "Bracket not found." }, { status: 404 });
    }

    const linkedSeries = await loadBracketLinkedSeries(db, String(objectId));

    return Response.json({
      bracket: serializeBracket(bracket as Record<string, unknown>, {
        linkedSeries,
      }),
    });
  } catch (error) {
    logApiError("GET /api/brackets/[id]", error);
    return Response.json({ error: "Failed to load bracket." }, { status: 500 });
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
      return Response.json({ error: "Invalid bracket id." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = bracketUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid bracket update." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const existing = await db.collection("brackets").findOne({ _id: objectId });

    if (!existing) {
      return Response.json({ error: "Bracket not found." }, { status: 404 });
    }

    const serialized = serializeBracket(existing as Record<string, unknown>);

    if (parsed.data.teams && parsed.data.teams.length !== serialized.teamCount) {
      return Response.json(
        { error: `This bracket requires exactly ${serialized.teamCount} teams.` },
        { status: 400 },
      );
    }

    const nextTeams = parsed.data.teams
      ? normalizeBracketTeams(parsed.data.teams)
      : serialized.teams;
    const teamsChanged =
      parsed.data.teams !== undefined &&
      nextTeams.some((entry, index) => entry.name !== serialized.teams[index]?.name);
    const formatChanged =
      parsed.data.format !== undefined && parsed.data.format !== serialized.format;
    const linkedSeries = await loadBracketLinkedSeries(db, String(objectId));

    if (
      (teamsChanged || formatChanged) &&
      linkedSeries.length > 0 &&
      !canSafelyReplaceBracketTeams(linkedSeries)
    ) {
      return Response.json(
        {
          error:
            "This bracket already has active generated series. Create a new bracket or keep the current team list and format.",
        },
        { status: 409 },
      );
    }

    if ((teamsChanged || formatChanged) && serialized.locked) {
      return Response.json(
        { error: "This bracket is frozen. Unfreeze it before changing teams or format." },
        { status: 409 },
      );
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
      updatedBy: admin,
    };

    if (parsed.data.title) {
      const title = parsed.data.title.trim();
      updatePayload.title = title;
      updatePayload.slug = slugifyTeamName(title) || serialized.slug;
    }

    if (parsed.data.format) {
      updatePayload.format = parsed.data.format;
    }

    if (parsed.data.locked !== undefined) {
      updatePayload.locked = parsed.data.locked;
    }

    if (parsed.data.teams) {
      updatePayload.teams = nextTeams;
      updatePayload.winners = [];
      updatePayload.manualResolutions = [];
    }

    await db.collection("brackets").updateOne(
      { _id: objectId },
      { $set: updatePayload },
    );

    const updated = await db.collection("brackets").findOne({ _id: objectId });

    if (!updated) {
      return Response.json({ error: "Bracket not found." }, { status: 404 });
    }

    await syncBracketSeries(db, serializeBracket(updated as Record<string, unknown>), admin);
    const refreshedLinkedSeries = await loadBracketLinkedSeries(db, String(objectId));

    return Response.json({
      bracket: serializeBracket(updated as Record<string, unknown>, {
        linkedSeries: refreshedLinkedSeries,
      }),
    });
  } catch (error) {
    if (error instanceof BracketSeriesConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    logApiError("PATCH /api/brackets/[id]", error);
    return Response.json({ error: "Failed to update bracket." }, { status: 500 });
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
      return Response.json({ error: "Invalid bracket id." }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("series").deleteMany({ "bracket.id": String(objectId) });
    const deletion = await db.collection("brackets").deleteOne({ _id: objectId });

    if (deletion.deletedCount === 0) {
      return Response.json({ error: "Bracket not found." }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    logApiError("DELETE /api/brackets/[id]", error);
    return Response.json({ error: "Failed to delete bracket." }, { status: 500 });
  }
}
