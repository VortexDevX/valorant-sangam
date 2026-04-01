import { normalizeScore } from "@/lib/validators";
import type { MapId } from "@/lib/map-pool";
import type { SeriesRecord, SeriesResultRecord, SeriesStatus, SeriesVetoState } from "@/types/series";
import type { SeriesFormat, TeamSlot, VetoActionRecord, VetoResultMap } from "@/types/veto";

export function slugifyTeamName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildPairKey(teamASlug: string, teamBSlug: string) {
  return [teamASlug, teamBSlug].sort().join("__");
}

export function getWinsNeeded(format: SeriesFormat) {
  if (format === "bo1") {
    return 1;
  }

  if (format === "bo3") {
    return 2;
  }

  return 3;
}

export function getWinnerFromScore(score: string): TeamSlot {
  const [teamAScore, teamBScore] = normalizeScore(score).split("-").map(Number);
  return teamAScore > teamBScore ? "teamA" : "teamB";
}

export function deriveOverallScore(
  format: SeriesFormat,
  results: SeriesResultRecord[],
) {
  const winsNeeded = getWinsNeeded(format);
  const teamA = results.filter((result) => result.winner === "teamA").length;
  const teamB = results.filter((result) => result.winner === "teamB").length;
  const winner: TeamSlot | null =
    teamA >= winsNeeded ? "teamA" : teamB >= winsNeeded ? "teamB" : null;

  return {
    teamA,
    teamB,
    winsNeeded,
    winner,
    completed: winner !== null,
  };
}

export function deriveSeriesStatus(
  format: SeriesFormat,
  veto: SeriesVetoState | null,
  results: SeriesResultRecord[],
): SeriesStatus {
  const overallScore = deriveOverallScore(format, results);

  if (overallScore.completed) {
    return "completed";
  }

  if (!veto || veto.status === "not_started") {
    return "scheduled";
  }

  if (veto.status === "completed") {
    return "veto_completed";
  }

  return "veto_in_progress";
}

function serializeVetoAction(action: Record<string, unknown>): VetoActionRecord {
  return {
    step: Number(action.step),
    team: String(action.team) as VetoActionRecord["team"],
    type: String(action.type) as VetoActionRecord["type"],
    map: typeof action.map === "string" ? (action.map as MapId) : undefined,
    side: action.side === "atk" || action.side === "def" ? action.side : undefined,
    order: typeof action.order === "number" ? action.order : undefined,
    createdAt:
      action.createdAt instanceof Date
        ? action.createdAt.toISOString()
        : String(action.createdAt),
  };
}

function serializeSeriesResult(result: Record<string, unknown>): SeriesResultRecord {
  return {
    order: Number(result.order),
    map: String(result.map) as MapId,
    score: normalizeScore(String(result.score)),
    note: String(result.note ?? ""),
    winner: String(result.winner) as TeamSlot,
    createdAt:
      result.createdAt instanceof Date
        ? result.createdAt.toISOString()
        : String(result.createdAt),
    updatedAt:
      result.updatedAt instanceof Date
        ? result.updatedAt.toISOString()
        : String(result.updatedAt),
  };
}

export function serializeSeries(series: Record<string, unknown>): SeriesRecord {
  const vetoSource =
    typeof series.veto === "object" && series.veto ? (series.veto as Record<string, unknown>) : null;
  const veto =
    vetoSource === null
      ? null
      : {
          status: String(vetoSource.status) as SeriesVetoState["status"],
          mapPool: Array.isArray(vetoSource.mapPool)
            ? vetoSource.mapPool.map((map) => String(map) as MapId)
            : [],
          actions: Array.isArray(vetoSource.actions)
            ? vetoSource.actions.map((action) =>
                serializeVetoAction(action as Record<string, unknown>),
              )
            : [],
          result:
            typeof vetoSource.result === "object" && vetoSource.result
              ? {
                  maps: Array.isArray((vetoSource.result as Record<string, unknown>).maps)
                    ? ((vetoSource.result as Record<string, unknown>).maps as unknown[]).map(
                        (map) => {
                          const typedMap = map as Record<string, unknown>;
                          return {
                            order: Number(typedMap.order),
                            map: String(typedMap.map) as MapId,
                            pickedBy:
                              typedMap.pickedBy === "teamA" || typedMap.pickedBy === "teamB"
                                ? typedMap.pickedBy
                                : undefined,
                            sideChosenBy:
                              typedMap.sideChosenBy === "teamA" ||
                              typedMap.sideChosenBy === "teamB"
                                ? typedMap.sideChosenBy
                                : undefined,
                            startingSide:
                              typedMap.startingSide === "atk" || typedMap.startingSide === "def"
                                ? typedMap.startingSide
                                : undefined,
                            isDecider: Boolean(typedMap.isDecider),
                          } satisfies VetoResultMap;
                        },
                      )
                    : [],
                }
              : { maps: [] },
          createdAt:
            vetoSource.createdAt instanceof Date
              ? vetoSource.createdAt.toISOString()
              : vetoSource.createdAt
                ? String(vetoSource.createdAt)
                : undefined,
          updatedAt:
            vetoSource.updatedAt instanceof Date
              ? vetoSource.updatedAt.toISOString()
              : vetoSource.updatedAt
                ? String(vetoSource.updatedAt)
                : undefined,
        };

  const results = Array.isArray(series.results)
    ? series.results.map((result) =>
        serializeSeriesResult(result as Record<string, unknown>),
      )
    : [];

  const format = String(series.format) as SeriesFormat;

  return {
    _id: String(series._id),
    pairKey: String(series.pairKey),
    teamA: String(series.teamA),
    teamB: String(series.teamB),
    teamASlug: String(series.teamASlug),
    teamBSlug: String(series.teamBSlug),
    format,
    veto,
    results,
    overallScore: deriveOverallScore(format, results),
    status: deriveSeriesStatus(format, veto, results),
    createdAt:
      series.createdAt instanceof Date
        ? series.createdAt.toISOString()
        : String(series.createdAt),
    updatedAt:
      series.updatedAt instanceof Date
        ? series.updatedAt.toISOString()
        : String(series.updatedAt),
  };
}

export function getNextSeriesMap(series: SeriesRecord) {
  if (!series.veto || series.veto.status !== "completed") {
    return null;
  }

  if (series.overallScore.completed) {
    return null;
  }

  const filledOrders = new Set(series.results.map((result) => result.order));

  return (
    series.veto.result.maps.find((map) => !filledOrders.has(map.order)) ?? null
  );
}
