import { ObjectId } from "mongodb";
import {
  BracketSeriesConflictError,
  hasLaterRoundBracketSeries,
  loadBracketLinkedSeries,
  syncBracketSeries,
} from "@/lib/bracket-series";
import { getAuthorizedAdmin } from "@/lib/auth";
import { logApiError } from "@/lib/api-errors";
import { serializeBracket } from "@/lib/brackets";
import { getDb } from "@/lib/mongodb";
import { bracketWinnerSchema } from "@/lib/validators";

export const runtime = "nodejs";

async function resolveParams(
  context: { params: Promise<{ id: string; round: string; match: string }> },
) {
  const { id, round, match } = await context.params;

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const roundNumber = Number(round);
  const matchNumber = Number(match);

  if (!Number.isInteger(roundNumber) || roundNumber < 1) {
    return null;
  }

  if (!Number.isInteger(matchNumber) || matchNumber < 1) {
    return null;
  }

  return {
    objectId: new ObjectId(id),
    roundNumber,
    matchNumber,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; round: string; match: string }> },
) {
  try {
    const admin = await getAuthorizedAdmin(request);

    if (!admin) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const resolved = await resolveParams(context);

    if (!resolved) {
      return Response.json({ error: "Invalid match reference." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = bracketWinnerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid winner payload." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const existing = await db.collection("brackets").findOne({ _id: resolved.objectId });

    if (!existing) {
      return Response.json({ error: "Bracket not found." }, { status: 404 });
    }

    const linkedSeries = await loadBracketLinkedSeries(db, String(resolved.objectId));
    const linkedMatchSeries = linkedSeries.find(
      (entry) =>
        entry.bracket?.round === resolved.roundNumber &&
        entry.bracket?.match === resolved.matchNumber,
    );

    if (linkedMatchSeries) {
      return Response.json(
        { error: "This bracket match is controlled by its generated series results." },
        { status: 400 },
      );
    }

    const bracket = serializeBracket(existing as Record<string, unknown>, {
      linkedSeries,
    });
    const targetRound = bracket.rounds.find((entry) => entry.round === resolved.roundNumber);
    const targetMatch = targetRound?.matches.find((entry) => entry.match === resolved.matchNumber);

    if (!targetMatch) {
      return Response.json({ error: "Match not found." }, { status: 404 });
    }

    if (!targetMatch.canPickWinner) {
      return Response.json(
        { error: "This match cannot have a manual winner yet." },
        { status: 400 },
      );
    }

    const allowedSeeds = [targetMatch.top?.seed, targetMatch.bottom?.seed].filter(
      (entry): entry is number => typeof entry === "number",
    );

    if (
      parsed.data.winnerSeed !== null &&
      !allowedSeeds.includes(parsed.data.winnerSeed)
    ) {
      return Response.json(
        { error: "Selected winner is not part of this match." },
        { status: 400 },
      );
    }

    const currentWinnerSeed =
      bracket.winners.find(
        (entry) => entry.round === resolved.roundNumber && entry.match === resolved.matchNumber,
      )?.winnerSeed ?? null;

    if (
      currentWinnerSeed !== parsed.data.winnerSeed &&
      (await hasLaterRoundBracketSeries(db, bracket._id, resolved.roundNumber))
    ) {
      return Response.json(
        {
          error:
            "Later-round generated series already exist for this bracket. Update those first before changing this winner.",
        },
        { status: 409 },
      );
    }

    const nextSelections = bracket.winners.filter(
      (entry) => !(entry.round === resolved.roundNumber && entry.match === resolved.matchNumber),
    );

    if (parsed.data.winnerSeed !== null) {
      nextSelections.push({
        round: resolved.roundNumber,
        match: resolved.matchNumber,
        winnerSeed: parsed.data.winnerSeed,
      });
    }

    await db.collection("brackets").updateOne(
      { _id: resolved.objectId },
      {
        $set: {
          winners: nextSelections,
          updatedAt: new Date(),
          updatedBy: admin,
        },
      },
    );

    const updated = await db.collection("brackets").findOne({ _id: resolved.objectId });

    if (!updated) {
      return Response.json({ error: "Bracket not found." }, { status: 404 });
    }

    await syncBracketSeries(db, serializeBracket(updated as Record<string, unknown>), admin);
    const refreshedLinkedSeries = await loadBracketLinkedSeries(db, String(resolved.objectId));

    return Response.json({
      bracket: serializeBracket(updated as Record<string, unknown>, {
        linkedSeries: refreshedLinkedSeries,
      }),
    });
  } catch (error) {
    if (error instanceof BracketSeriesConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    logApiError("PATCH /api/brackets/[id]/matches/[round]/[match]", error);
    return Response.json({ error: "Failed to update match winner." }, { status: 500 });
  }
}
