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
import { serializeSeries } from "@/lib/series";
import { bracketContinuationSchema, bracketWinnerSchema } from "@/lib/validators";

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
    const winnerParsed = bracketWinnerSchema.safeParse(body);
    const continuationParsed = bracketContinuationSchema.safeParse(body);

    if (!winnerParsed.success && !continuationParsed.success) {
      return Response.json(
        {
          error:
            winnerParsed.error?.issues[0]?.message ??
            continuationParsed.error?.issues[0]?.message ??
            "Invalid winner payload.",
        },
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

    const bracket = serializeBracket(existing as Record<string, unknown>, {
      linkedSeries,
    });

    if (bracket.locked) {
      return Response.json(
        { error: "This bracket is frozen. Unfreeze it before changing match resolution." },
        { status: 409 },
      );
    }
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
    const existingManualResolution =
      bracket.manualResolutions.find(
        (entry) => entry.round === resolved.roundNumber && entry.match === resolved.matchNumber,
      ) ?? null;

    if (continuationParsed.success) {
      if (!targetMatch.top?.slug || !targetMatch.bottom?.slug) {
        return Response.json(
          { error: "This match is not ready for continuation resolution yet." },
          { status: 400 },
        );
      }

      if (linkedMatchSeries?.overallScore.completed) {
        return Response.json(
          { error: "This bracket match is already resolved by its generated series results." },
          { status: 409 },
        );
      }

      const currentWinnerSeed = targetMatch.winnerSeed;
      const nextContinuations = bracket.manualResolutions.filter(
        (entry) => !(entry.round === resolved.roundNumber && entry.match === resolved.matchNumber),
      );

      if (continuationParsed.data.continuationSeriesId === null) {
        if (
          currentWinnerSeed !== null &&
          existingManualResolution &&
          (await hasLaterRoundBracketSeries(db, bracket._id, resolved.roundNumber))
        ) {
          return Response.json(
            {
              error:
                "Later-round generated series already exist for this bracket. Clear downstream generated series first.",
            },
            { status: 409 },
          );
        }

        await db.collection("brackets").updateOne(
          { _id: resolved.objectId },
          {
            $set: {
              manualResolutions: nextContinuations,
              updatedAt: new Date(),
              updatedBy: admin,
            },
          },
        );

        if (existingManualResolution) {
          await db.collection("series").updateOne(
            { _id: new ObjectId(existingManualResolution.seriesId) },
            {
              $set: {
                manualContinuation: null,
                updatedAt: new Date(),
                updatedBy: admin,
              },
            },
          );
        }
      } else {
        const continuationId = continuationParsed.data.continuationSeriesId;

        if (!ObjectId.isValid(continuationId)) {
          return Response.json({ error: "Invalid continuation series id." }, { status: 400 });
        }

        const continuationSource = await db
          .collection("series")
          .findOne({ _id: new ObjectId(continuationId) });

        if (!continuationSource) {
          return Response.json({ error: "Continuation series not found." }, { status: 404 });
        }

        const continuationSeries = serializeSeries(continuationSource as Record<string, unknown>);

        if (continuationSeries.bracket) {
          return Response.json(
            { error: "Only manual series can be used as continuation sources." },
            { status: 409 },
          );
        }

        if (
          continuationSeries.manualContinuation &&
          !(
            continuationSeries.manualContinuation.id === bracket._id &&
            continuationSeries.manualContinuation.round === resolved.roundNumber &&
            continuationSeries.manualContinuation.match === resolved.matchNumber
          )
        ) {
          return Response.json(
            { error: "That manual series already resolves another bracket match." },
            { status: 409 },
          );
        }

        if (!continuationSeries.overallScore.completed || continuationSeries.overallScore.winner === null) {
          return Response.json(
            { error: "Continuation series must be completed first." },
            { status: 409 },
          );
        }

        const matchPair = new Set([targetMatch.top.slug, targetMatch.bottom.slug]);
        const continuationPair = new Set([
          continuationSeries.teamASlug,
          continuationSeries.teamBSlug,
        ]);

        if (
          continuationPair.size !== matchPair.size ||
          [...matchPair].some((entry) => !continuationPair.has(entry))
        ) {
          return Response.json(
            { error: "Continuation series teams must match the bracket matchup." },
            { status: 409 },
          );
        }

        const winnerSlug =
          continuationSeries.overallScore.winner === "teamA"
            ? continuationSeries.teamASlug
            : continuationSeries.teamBSlug;
        const winnerSeed =
          winnerSlug === targetMatch.top.slug
            ? targetMatch.top.seed
            : winnerSlug === targetMatch.bottom.slug
              ? targetMatch.bottom.seed
              : null;

        if (typeof winnerSeed !== "number") {
          return Response.json(
            { error: "Continuation winner could not be mapped to this bracket match." },
            { status: 409 },
          );
        }

        if (
          currentWinnerSeed !== winnerSeed &&
          currentWinnerSeed !== null &&
          (await hasLaterRoundBracketSeries(db, bracket._id, resolved.roundNumber))
        ) {
          return Response.json(
            {
              error:
                "Later-round generated series already exist for this bracket. Update those first before changing this continuation winner.",
            },
            { status: 409 },
          );
        }

        nextContinuations.push({
          round: resolved.roundNumber,
          match: resolved.matchNumber,
          seriesId: continuationSeries._id,
          winnerSeed,
          winnerName:
            continuationSeries.overallScore.winner === "teamA"
              ? continuationSeries.teamA
              : continuationSeries.teamB,
          scoreline: `${continuationSeries.overallScore.teamA}-${continuationSeries.overallScore.teamB}`,
          note: continuationParsed.data.note?.trim() ?? "",
          resolvedAt: new Date().toISOString(),
        });

        await db.collection("brackets").updateOne(
          { _id: resolved.objectId },
          {
            $set: {
              manualResolutions: nextContinuations,
              winners: bracket.winners.filter(
                (entry) =>
                  !(entry.round === resolved.roundNumber && entry.match === resolved.matchNumber),
              ),
              updatedAt: new Date(),
              updatedBy: admin,
            },
          },
        );

        if (
          existingManualResolution &&
          existingManualResolution.seriesId !== continuationSeries._id
        ) {
          await db.collection("series").updateOne(
            { _id: new ObjectId(existingManualResolution.seriesId) },
            {
              $set: {
                manualContinuation: null,
                updatedAt: new Date(),
                updatedBy: admin,
              },
            },
          );
        }

        await db.collection("series").updateOne(
          { _id: new ObjectId(continuationSeries._id) },
          {
            $set: {
              manualContinuation: {
                id: bracket._id,
                title: bracket.title,
                round: resolved.roundNumber,
                match: resolved.matchNumber,
              },
              updatedAt: new Date(),
              updatedBy: admin,
            },
          },
        );
      }

      const updatedContinuationBracket = await db.collection("brackets").findOne({ _id: resolved.objectId });

      if (!updatedContinuationBracket) {
        return Response.json({ error: "Bracket not found." }, { status: 404 });
      }

      await syncBracketSeries(db, serializeBracket(updatedContinuationBracket as Record<string, unknown>), admin);
      const refreshedLinkedSeries = await loadBracketLinkedSeries(db, String(resolved.objectId));

      return Response.json({
        bracket: serializeBracket(updatedContinuationBracket as Record<string, unknown>, {
          linkedSeries: refreshedLinkedSeries,
        }),
      });
    }

    if (linkedMatchSeries) {
      return Response.json(
        { error: "This bracket match is controlled by its generated series results." },
        { status: 400 },
      );
    }

    if (!winnerParsed.success) {
      return Response.json({ error: "Invalid winner payload." }, { status: 400 });
    }

    const winnerData = winnerParsed.data;

    if (
      winnerData.winnerSeed !== null &&
      !allowedSeeds.includes(winnerData.winnerSeed)
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
      currentWinnerSeed !== winnerData.winnerSeed &&
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

    if (winnerData.winnerSeed !== null) {
      nextSelections.push({
        round: resolved.roundNumber,
        match: resolved.matchNumber,
        winnerSeed: winnerData.winnerSeed,
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
