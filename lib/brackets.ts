import { normalizeTeamName, slugifyTeamName } from "@/lib/series";
import type {
  BracketMatchRecord,
  BracketRecord,
  BracketRoundRecord,
  BracketSeedRecord,
  BracketSlotRecord,
  BracketStatus,
  BracketWinnerSelection,
} from "@/types/bracket";
import type { SeriesRecord } from "@/types/series";

interface Competitor {
  seed: number;
  name: string;
  slug: string;
}

interface BracketComputation {
  rounds: BracketRoundRecord[];
  status: BracketStatus;
  championSeed: number | null;
  championName: string | null;
}

interface SeriesResolution {
  seriesId: string;
  winnerSeed: number;
  scoreline: string;
}

function toPositivePowerOfTwo(value: number) {
  let size = 1;

  while (size < value) {
    size *= 2;
  }

  return size;
}

export function getBracketSize(teamCount: number) {
  return toPositivePowerOfTwo(teamCount);
}

export function buildSeedOrder(size: number): number[] {
  if (size === 1) {
    return [1];
  }

  const previous = buildSeedOrder(size / 2);
  return previous.flatMap((seed) => [seed, size + 1 - seed]);
}

export function createDefaultBracketTeams(teamCount: number): BracketSeedRecord[] {
  return Array.from({ length: teamCount }, (_, index) => {
    const seed = index + 1;

    return {
      seed,
      name: "",
      slug: null,
    };
  });
}

export function normalizeBracketTeams(teams: string[]): BracketSeedRecord[] {
  return teams.map((entry, index) => {
    const seed = index + 1;
    const name = normalizeTeamName(entry);

    return {
      seed,
      name,
      slug: name ? slugifyTeamName(name) || `team-${seed}` : null,
    };
  });
}

function getRoundLabel(totalRounds: number, round: number) {
  const slotsInRound = 2 ** (totalRounds - round + 1);

  if (slotsInRound === 2) {
    return "Final";
  }

  if (slotsInRound === 4) {
    return "Semifinals";
  }

  if (slotsInRound === 8) {
    return "Quarterfinals";
  }

  return `Round of ${slotsInRound}`;
}

function buildSlot(entry: Competitor | null, options?: { isBye?: boolean }): BracketSlotRecord | null {
  if (entry) {
    return {
      seed: entry.seed,
      name: entry.name,
      slug: entry.slug,
      isBye: false,
    };
  }

  if (options?.isBye) {
    return {
      seed: null,
      name: "BYE",
      slug: null,
      isBye: true,
    };
  }

  return null;
}

function buildFirstRoundSlot(seed: number, teamCount: number, entry: Competitor | null) {
  if (seed > teamCount) {
    return {
      seed: null,
      name: "BYE",
      slug: null,
      isBye: true,
    } satisfies BracketSlotRecord;
  }

  return {
    seed,
    name: entry?.name ?? "",
    slug: entry?.slug ?? null,
    isBye: false,
  } satisfies BracketSlotRecord;
}

function buildWinnerMap(winners: BracketWinnerSelection[]) {
  return new Map(winners.map((entry) => [`${entry.round}-${entry.match}`, entry.winnerSeed]));
}

function buildLinkedSeriesMap(series: SeriesRecord[]) {
  const grouped = new Map<string, SeriesRecord>();

  for (const entry of series) {
    if (!entry.bracket) {
      continue;
    }

    const key = `${entry.bracket.round}-${entry.bracket.match}`;

    if (!grouped.has(key)) {
      grouped.set(key, entry);
    }
  }

  return grouped;
}

function resolveSeriesOutcome(
  linkedSeries: SeriesRecord | undefined,
  top: BracketSlotRecord | null,
  bottom: BracketSlotRecord | null,
): SeriesResolution | null {
  if (
    !linkedSeries ||
    !linkedSeries.overallScore.completed ||
    linkedSeries.overallScore.winner === null ||
    !top?.slug ||
    !bottom?.slug ||
    typeof top.seed !== "number" ||
    typeof bottom.seed !== "number"
  ) {
    return null;
  }

  const winnerSlug =
    linkedSeries.overallScore.winner === "teamA"
      ? linkedSeries.teamASlug
      : linkedSeries.teamBSlug;

  if (winnerSlug === top.slug) {
    return {
      seriesId: linkedSeries._id,
      winnerSeed: top.seed,
      scoreline: `${linkedSeries.overallScore.teamA}-${linkedSeries.overallScore.teamB}`,
    };
  }

  if (winnerSlug === bottom.slug) {
    return {
      seriesId: linkedSeries._id,
      winnerSeed: bottom.seed,
      scoreline: `${linkedSeries.overallScore.teamA}-${linkedSeries.overallScore.teamB}`,
    };
  }

  return null;
}

export function computeBracketView(input: {
  teamCount: number;
  bracketSize: number;
  teams: BracketSeedRecord[];
  winners: BracketWinnerSelection[];
  linkedSeries?: SeriesRecord[];
}): BracketComputation {
  const readyTeams = input.teams
    .filter((entry) => entry.name.trim().length > 0 && entry.slug)
    .map((entry) => ({
      seed: entry.seed,
      name: entry.name,
      slug: entry.slug as string,
    }));

  if (input.bracketSize === 1) {
    const soloTeam = readyTeams[0] ?? null;

    return {
      rounds: [],
      status: soloTeam ? "completed" : "draft",
      championSeed: soloTeam?.seed ?? null,
      championName: soloTeam?.name ?? null,
    };
  }

  const totalRounds = Math.log2(input.bracketSize);
  const winnerMap = buildWinnerMap(input.winners);
  const linkedSeriesMap = buildLinkedSeriesMap(input.linkedSeries ?? []);
  const seedOrder = buildSeedOrder(input.bracketSize);
  const competitorsBySeed = new Map<number, Competitor>(
    readyTeams.map((entry) => [entry.seed, entry]),
  );

  const seededSlots = seedOrder.map((seed) => ({
    seed,
    competitor: seed <= input.teamCount ? (competitorsBySeed.get(seed) ?? null) : null,
    isBye: seed > input.teamCount,
  }));
  let currentEntries: Array<Competitor | null> = seededSlots.map((entry) => entry.competitor);

  const rounds: BracketRoundRecord[] = [];
  let champion: Competitor | null = null;
  let hasManualProgress = false;

  for (let round = 1; round <= totalRounds; round += 1) {
    const matches: BracketMatchRecord[] = [];
    const nextEntries: Array<Competitor | null> = [];

    for (let matchIndex = 0; matchIndex < currentEntries.length; matchIndex += 2) {
      const matchNumber = matchIndex / 2 + 1;
      const topCompetitor = currentEntries[matchIndex];
      const bottomCompetitor = currentEntries[matchIndex + 1];
      const initialTop = round === 1 ? seededSlots[matchIndex] : null;
      const initialBottom = round === 1 ? seededSlots[matchIndex + 1] : null;
      const availableCompetitors = [topCompetitor, bottomCompetitor].filter(
        (entry): entry is Competitor => entry !== null,
      );
      const top = round === 1
        ? buildFirstRoundSlot(initialTop!.seed, input.teamCount, topCompetitor)
        : buildSlot(topCompetitor);
      const bottom = round === 1
        ? buildFirstRoundSlot(initialBottom!.seed, input.teamCount, bottomCompetitor)
        : buildSlot(bottomCompetitor);
      const linkedSeries = linkedSeriesMap.get(`${round}-${matchNumber}`);
      const autoWinner =
        round === 1 && topCompetitor && initialBottom?.isBye
          ? topCompetitor
          : round === 1 && initialTop?.isBye && bottomCompetitor
            ? bottomCompetitor
            : null;
      const seriesResolution =
        autoWinner === null
          ? resolveSeriesOutcome(linkedSeries, top, bottom)
          : null;
      const seriesWinner =
        seriesResolution === null
          ? null
          : availableCompetitors.find((entry) => entry.seed === seriesResolution.winnerSeed) ?? null;
      const storedWinnerSeed = winnerMap.get(`${round}-${matchNumber}`) ?? null;
      const manualWinner =
        autoWinner === null && seriesWinner === null
          ? availableCompetitors.find((entry) => entry.seed === storedWinnerSeed) ?? null
          : null;
      const winner = autoWinner ?? seriesWinner ?? manualWinner ?? null;
      const winnerSource =
        autoWinner !== null
          ? "auto"
          : seriesWinner !== null
            ? "series"
            : manualWinner !== null
              ? "manual"
              : null;

      if (seriesWinner || manualWinner) {
        hasManualProgress = true;
      }

      if (round === totalRounds && winner) {
        champion = winner;
      }

      matches.push({
        round,
        match: matchNumber,
        top,
        bottom,
        winnerSeed: winner?.seed ?? null,
        winnerName: winner?.name ?? null,
        winnerSource,
        seriesId: linkedSeries?._id ?? null,
        seriesScore: seriesResolution?.scoreline ?? null,
        autoAdvanced: autoWinner !== null,
        canPickWinner:
          autoWinner === null &&
          !linkedSeries &&
          availableCompetitors.length === 2 &&
          !top?.isBye &&
          !bottom?.isBye,
        isComplete: winner !== null,
      });
      nextEntries.push(winner);
    }

    rounds.push({
      round,
      label: getRoundLabel(totalRounds, round),
      matches,
    });
    currentEntries = nextEntries;
  }

  return {
    rounds,
    status: champion ? "completed" : hasManualProgress ? "in_progress" : "draft",
    championSeed: champion?.seed ?? null,
    championName: champion?.name ?? null,
  };
}

export function serializeBracket(
  source: Record<string, unknown>,
  options?: { linkedSeries?: SeriesRecord[] },
): BracketRecord {
  const teamCount = Number(source.teamCount);
  const bracketSize = Number(source.bracketSize || getBracketSize(teamCount));
  const teams = Array.isArray(source.teams)
    ? (source.teams as unknown[]).map((entry, index) => {
        const typedEntry = entry as Record<string, unknown>;
        const seed = Number(typedEntry.seed ?? index + 1);
        const name = normalizeTeamName(String(typedEntry.name ?? ""));

        return {
          seed,
          name,
          slug: name ? slugifyTeamName(name) || `team-${seed}` : null,
        } satisfies BracketSeedRecord;
      })
    : createDefaultBracketTeams(teamCount);
  const winners = Array.isArray(source.winners)
    ? (source.winners as unknown[])
        .map((entry) => {
          const typedEntry = entry as Record<string, unknown>;
          const round = Number(typedEntry.round);
          const match = Number(typedEntry.match);
          const winnerSeed =
            typedEntry.winnerSeed === null || typedEntry.winnerSeed === undefined
              ? null
              : Number(typedEntry.winnerSeed);

          if (!Number.isInteger(round) || !Number.isInteger(match)) {
            return null;
          }

          return {
            round,
            match,
            winnerSeed: Number.isInteger(winnerSeed) ? winnerSeed : null,
          } satisfies BracketWinnerSelection;
        })
        .filter((entry): entry is BracketWinnerSelection => entry !== null)
    : [];
  const computed = computeBracketView({
    teamCount,
    bracketSize,
    teams,
    winners,
    linkedSeries: options?.linkedSeries,
  });

  return {
    _id: String(source._id),
    title: String(source.title),
    slug: String(source.slug),
    teamCount,
    bracketSize,
    format:
      source.format === "bo1" || source.format === "bo5"
        ? source.format
        : "bo3",
    teams,
    winners,
    rounds: computed.rounds,
    status: computed.status,
    championSeed: computed.championSeed,
    championName: computed.championName,
    createdAt:
      source.createdAt instanceof Date
        ? source.createdAt.toISOString()
        : String(source.createdAt),
    updatedAt:
      source.updatedAt instanceof Date
        ? source.updatedAt.toISOString()
        : String(source.updatedAt),
  };
}
