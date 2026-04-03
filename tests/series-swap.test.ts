import assert from "node:assert/strict";
import test from "node:test";
import { canSwapSeriesSides } from "@/lib/series";
import type { SeriesRecord } from "@/types/series";

function createSeries(overrides: Partial<SeriesRecord> = {}): SeriesRecord {
  return {
    _id: "series-1",
    pairKey: "a__b",
    teamA: "TEAM A",
    teamB: "TEAM B",
    teamASlug: "team-a",
    teamBSlug: "team-b",
    bracket: null,
    manualContinuation: null,
    locked: false,
    format: "bo3",
    status: "scheduled",
    veto: null,
    results: [],
    overallScore: {
      teamA: 0,
      teamB: 0,
      winsNeeded: 2,
      winner: null,
      completed: false,
    },
    createdAt: "2026-04-03T00:00:00.000Z",
    updatedAt: "2026-04-03T00:00:00.000Z",
    ...overrides,
  };
}

test("series sides can swap only before veto and before results", () => {
  assert.equal(canSwapSeriesSides(createSeries()), true);
  assert.equal(
    canSwapSeriesSides(
      createSeries({
        veto: {
          status: "in_progress",
          mapPool: ["bind", "haven", "fracture", "lotus", "split", "pearl", "breeze"],
          actions: [],
          result: { maps: [] },
        },
      }),
    ),
    false,
  );
  assert.equal(
    canSwapSeriesSides(
      createSeries({
        results: [
          {
            order: 1,
            map: "bind",
            score: "13-11",
            note: "",
            winner: "teamA",
            createdAt: "2026-04-03T00:00:00.000Z",
            updatedAt: "2026-04-03T00:00:00.000Z",
          },
        ],
      }),
    ),
    false,
  );
  assert.equal(canSwapSeriesSides(createSeries({ locked: true })), false);
});
