import assert from "node:assert/strict";
import test from "node:test";
import { computeBracketView } from "@/lib/brackets";
import type { BracketSeedRecord } from "@/types/bracket";

const teams: BracketSeedRecord[] = [
  { seed: 1, name: "BOOSTED IRONS", slug: "boosted-irons" },
  { seed: 2, name: "NAGAR HATERS", slug: "nagar-haters" },
  { seed: 3, name: "TEAM C", slug: "team-c" },
  { seed: 4, name: "TEAM D", slug: "team-d" },
];

test("manual continuation can resolve a final and produce the champion", () => {
  const computed = computeBracketView({
    teamCount: 4,
    bracketSize: 4,
    teams,
    winners: [
      { round: 1, match: 1, winnerSeed: 1 },
      { round: 1, match: 2, winnerSeed: 2 },
    ],
    manualResolutions: [
      {
        round: 2,
        match: 1,
        seriesId: "continuation-final",
        winnerSeed: 1,
        scoreline: "2-1",
        winnerName: "BOOSTED IRONS",
        note: "Final continued outside the linked bracket series.",
        resolvedAt: "2026-04-03T12:00:00.000Z",
      },
    ],
    linkedSeries: [],
  });

  assert.equal(computed.championName, "BOOSTED IRONS");
  assert.equal(computed.status, "completed");
  assert.equal(computed.rounds[1]?.matches[0]?.winnerSource, "continuation");
  assert.equal(computed.rounds[1]?.matches[0]?.seriesScore, "2-1");
});
