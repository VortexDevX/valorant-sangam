import { ObjectId, type Db } from "mongodb";
import { computeBracketView, serializeBracket } from "@/lib/brackets";
import { buildPairKey, serializeSeries } from "@/lib/series";
import type { BracketMatchRecord, BracketRecord } from "@/types/bracket";
import type { SeriesRecord } from "@/types/series";
import type { SeriesFormat } from "@/types/veto";

export class BracketSeriesConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BracketSeriesConflictError";
  }
}

interface DesiredBracketSeries {
  round: number;
  match: number;
  teamA: string;
  teamB: string;
  teamASlug: string;
  teamBSlug: string;
  pairKey: string;
  format: SeriesFormat;
}

function getSeriesKey(round: number, match: number) {
  return `${round}-${match}`;
}

function isBracketReadyForSeries(bracket: BracketRecord) {
  return bracket.teams.every((entry) => entry.name.trim().length > 0 && entry.slug);
}

function buildDesiredBracketSeries(
  bracketFormat: SeriesFormat,
  match: BracketMatchRecord,
): DesiredBracketSeries | null {
  if (
    !match.top ||
    !match.bottom ||
    match.top.isBye ||
    match.bottom.isBye ||
    !match.top.name ||
    !match.bottom.name ||
    !match.top.slug ||
    !match.bottom.slug
  ) {
    return null;
  }

  return {
    round: match.round,
    match: match.match,
    teamA: match.top.name,
    teamB: match.bottom.name,
    teamASlug: match.top.slug,
    teamBSlug: match.bottom.slug,
    pairKey: buildPairKey(match.top.slug, match.bottom.slug),
    format: bracketFormat,
  };
}

function listDesiredBracketSeries(bracket: BracketRecord) {
  return bracket.rounds
    .flatMap((round) =>
      round.matches.map((match) => buildDesiredBracketSeries(bracket.format, match)),
    )
    .filter((entry): entry is DesiredBracketSeries => entry !== null);
}

function hasSameParticipants(existing: SeriesRecord, desired: DesiredBracketSeries) {
  return (
    existing.pairKey === desired.pairKey &&
    (
      (existing.teamASlug === desired.teamASlug && existing.teamBSlug === desired.teamBSlug) ||
      (existing.teamASlug === desired.teamBSlug && existing.teamBSlug === desired.teamASlug)
    )
  );
}

function isBracketLinkedSeriesMutable(series: SeriesRecord) {
  return series.bracket !== null && series.veto === null && series.results.length === 0;
}

export function canSafelyReplaceBracketTeams(linkedSeries: SeriesRecord[]) {
  return linkedSeries.every((entry) => isBracketLinkedSeriesMutable(entry));
}

export async function loadBracketLinkedSeries(db: Db, bracketId: string) {
  const series = await db
    .collection("series")
    .find({ "bracket.id": bracketId })
    .sort({ "bracket.round": 1, "bracket.match": 1, updatedAt: -1 })
    .toArray();

  return series.map((entry) => serializeSeries(entry as Record<string, unknown>));
}

export async function hasLaterRoundBracketSeries(db: Db, bracketId: string, round: number) {
  const count = await db.collection("series").countDocuments({
    "bracket.id": bracketId,
    "bracket.round": { $gt: round },
  });

  return count > 0;
}

export async function deleteBracketSeries(db: Db, bracketId: string) {
  await db.collection("series").deleteMany({ "bracket.id": bracketId });
}

export async function syncBracketSeries(db: Db, bracket: BracketRecord, actor?: string | null) {
  if (!isBracketReadyForSeries(bracket)) {
    return;
  }

  const linkedSeries = await loadBracketLinkedSeries(db, bracket._id);
  const computed = computeBracketView({
    teamCount: bracket.teamCount,
    bracketSize: bracket.bracketSize,
    teams: bracket.teams,
    winners: bracket.winners,
    manualResolutions: bracket.manualResolutions,
    linkedSeries,
  });
  const projectedBracket: BracketRecord = {
    ...bracket,
    rounds: computed.rounds,
    status: computed.status,
    championSeed: computed.championSeed,
    championName: computed.championName,
  };
  const desiredSeries = listDesiredBracketSeries(projectedBracket);
  const existingByKey = new Map<string, SeriesRecord>();

  for (const entry of linkedSeries) {
    if (!entry.bracket) {
      continue;
    }

    const key = getSeriesKey(entry.bracket.round, entry.bracket.match);

    if (!existingByKey.has(key)) {
      existingByKey.set(key, entry);
    }
  }

  for (const desired of desiredSeries) {
    const key = getSeriesKey(desired.round, desired.match);
    const existing = existingByKey.get(key);
    const now = new Date();

    if (!existing) {
      await db.collection("series").insertOne({
        pairKey: desired.pairKey,
        teamA: desired.teamA,
        teamB: desired.teamB,
        teamASlug: desired.teamASlug,
        teamBSlug: desired.teamBSlug,
        bracket: {
          id: bracket._id,
          title: bracket.title,
          round: desired.round,
          match: desired.match,
        },
        manualContinuation: null,
        locked: false,
        format: desired.format,
        veto: null,
        results: [],
        createdAt: now,
        updatedAt: now,
        ...(actor ? { createdBy: actor, updatedBy: actor } : {}),
      });
      continue;
    }

    const sameParticipants = hasSameParticipants(existing, desired);
    const teamsChanged =
      (!sameParticipants ||
        existing.format !== desired.format) &&
      (
        existing.teamA !== desired.teamA ||
        existing.teamB !== desired.teamB ||
        existing.teamASlug !== desired.teamASlug ||
        existing.teamBSlug !== desired.teamBSlug ||
        existing.format !== desired.format
      );
    const titleChanged = existing.bracket?.title !== bracket.title;

    if (!teamsChanged && !titleChanged) {
      continue;
    }

    if (teamsChanged && !isBracketLinkedSeriesMutable(existing)) {
      throw new BracketSeriesConflictError(
        `Round ${desired.round} match ${desired.match} already has active bracket series data.`,
      );
    }

    await db.collection("series").updateOne(
      { _id: new ObjectId(existing._id) },
      {
        $set: {
          ...(teamsChanged
            ? {
                pairKey: desired.pairKey,
                teamA: desired.teamA,
                teamB: desired.teamB,
                teamASlug: desired.teamASlug,
                teamBSlug: desired.teamBSlug,
                format: desired.format,
              }
            : {}),
          "bracket.title": bracket.title,
          updatedAt: now,
          ...(actor ? { updatedBy: actor } : {}),
        },
      },
    );
  }
}

export async function syncBracketSeriesById(db: Db, bracketId: string, actor?: string | null) {
  if (!ObjectId.isValid(bracketId)) {
    return;
  }

  const bracketSource = await db.collection("brackets").findOne({ _id: new ObjectId(bracketId) });

  if (!bracketSource) {
    return;
  }

  await syncBracketSeries(db, serializeBracket(bracketSource as Record<string, unknown>), actor);
}
