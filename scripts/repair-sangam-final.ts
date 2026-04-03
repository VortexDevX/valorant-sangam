import { existsSync, readFileSync } from "node:fs";
import { ObjectId } from "mongodb";
import { getDb } from "../lib/mongodb";
import { serializeBracket } from "../lib/brackets";
import { serializeSeries } from "../lib/series";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

function fromExtendedJson(value: JsonValue): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => fromExtendedJson(entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if ("$oid" in value && typeof value.$oid === "string" && Object.keys(value).length === 1) {
    return new ObjectId(value.$oid);
  }

  if ("$date" in value && typeof value.$date === "string" && Object.keys(value).length === 1) {
    return new Date(value.$date);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, fromExtendedJson(entry)]),
  );
}

function readExtendedJsonFile(path: string) {
  return fromExtendedJson(JSON.parse(readFileSync(path, "utf8")) as JsonValue);
}

const BRACKET_ID = new ObjectId("69ce828effc76291bd5a27f7");
const LINKED_FINAL_ID = new ObjectId("69cfcec04b416aeacac8b6d9");

const splitFinalSource = {
  bo5: {
    _id: new ObjectId("69cf716bd55234288886eb7c"),
    pairKey: "boosted-irons__nagar-haters",
    teamA: "NAGAR HATERS",
    teamB: "BOOSTED IRONS",
    teamASlug: "nagar-haters",
    teamBSlug: "boosted-irons",
    bracket: null,
    manualContinuation: null,
    format: "bo5",
    veto: {
      status: "completed",
      mapPool: ["bind", "haven", "fracture", "lotus", "split", "pearl", "breeze"],
      actions: [
        { step: 1, team: "teamA", type: "ban", map: "pearl", order: null, side: null, createdAt: "2026-04-03T07:51:20.733Z" },
        { step: 2, team: "teamB", type: "ban", map: "fracture", order: null, side: null, createdAt: "2026-04-03T07:51:25.678Z" },
        { step: 3, team: "teamA", type: "pick", map: "bind", order: 1, side: null, createdAt: "2026-04-03T07:51:35.481Z" },
        { step: 4, team: "teamB", type: "side", map: "bind", order: 1, side: "atk", createdAt: "2026-04-03T07:51:39.539Z" },
        { step: 5, team: "teamB", type: "pick", map: "split", order: 2, side: null, createdAt: "2026-04-03T07:51:44.971Z" },
        { step: 6, team: "teamA", type: "side", map: "split", order: 2, side: "atk", createdAt: "2026-04-03T07:51:54.062Z" },
        { step: 7, team: "teamA", type: "pick", map: "haven", order: 3, side: null, createdAt: "2026-04-03T07:52:12.156Z" },
        { step: 8, team: "teamB", type: "side", map: "haven", order: 3, side: "atk", createdAt: "2026-04-03T07:52:15.837Z" },
        { step: 9, team: "teamB", type: "pick", map: "lotus", order: 4, side: null, createdAt: "2026-04-03T07:52:22.706Z" },
        { step: 10, team: "teamA", type: "side", map: "lotus", order: 4, side: "def", createdAt: "2026-04-03T07:52:27.108Z" },
        { step: 11, team: "system", type: "decider", map: "breeze", order: 5, side: null, createdAt: "2026-04-03T07:52:28.765Z" },
        { step: 12, team: "teamB", type: "side", map: "breeze", order: 5, side: "def", createdAt: "2026-04-03T07:52:43.134Z" },
      ],
      result: {
        maps: [
          { order: 1, map: "bind", pickedBy: "teamA", isDecider: false, sideChosenBy: "teamB", startingSide: "atk" },
          { order: 2, map: "split", pickedBy: "teamB", isDecider: false, sideChosenBy: "teamA", startingSide: "atk" },
          { order: 3, map: "haven", pickedBy: "teamA", isDecider: false, sideChosenBy: "teamB", startingSide: "atk" },
          { order: 4, map: "lotus", pickedBy: "teamB", isDecider: false, sideChosenBy: "teamA", startingSide: "def" },
          { order: 5, map: "breeze", isDecider: true, sideChosenBy: "teamB", startingSide: "def" },
        ],
      },
      createdAt: new Date("2026-04-03T07:51:12.144Z"),
      updatedAt: new Date("2026-04-03T07:52:43.134Z"),
    },
    results: [
      { order: 1, map: "bind", score: "10-13", note: "", winner: "teamB", createdAt: new Date("2026-04-03T09:41:08.040Z"), updatedAt: new Date("2026-04-03T09:41:08.040Z") },
      { order: 2, map: "split", score: "13-11", note: "", winner: "teamA", createdAt: new Date("2026-04-03T10:33:18.226Z"), updatedAt: new Date("2026-04-03T10:33:18.226Z") },
    ],
    createdAt: new Date("2026-04-03T07:51:07.517Z"),
    updatedAt: new Date("2026-04-03T10:33:18.226Z"),
    createdBy: "VALORANT",
    updatedBy: "VALORANT",
  },
  bo1: {
    _id: new ObjectId("69cf989c6b78f9063d724d87"),
    pairKey: "boosted-irons__nagar-haters",
    teamA: "BOOSTED IRONS",
    teamB: "NAGAR HATERS",
    teamASlug: "boosted-irons",
    teamBSlug: "nagar-haters",
    bracket: null,
    manualContinuation: null,
    format: "bo1",
    veto: {
      status: "completed",
      mapPool: ["bind", "haven", "fracture", "lotus", "split", "pearl", "breeze"],
      actions: [
        { step: 1, team: "teamA", type: "ban", map: "bind", order: null, side: null, createdAt: "2026-04-03T10:38:50.080Z" },
        { step: 2, team: "teamB", type: "ban", map: "split", order: null, side: null, createdAt: "2026-04-03T10:38:51.545Z" },
        { step: 3, team: "teamA", type: "ban", map: "fracture", order: null, side: null, createdAt: "2026-04-03T10:39:06.681Z" },
        { step: 4, team: "teamB", type: "ban", map: "pearl", order: null, side: null, createdAt: "2026-04-03T10:39:10.388Z" },
        { step: 5, team: "teamA", type: "ban", map: "haven", order: null, side: null, createdAt: "2026-04-03T10:39:15.047Z" },
        { step: 6, team: "teamB", type: "ban", map: "breeze", order: null, side: null, createdAt: "2026-04-03T10:39:19.374Z" },
        { step: 7, team: "system", type: "decider", map: "lotus", order: 1, side: null, createdAt: "2026-04-03T10:39:20.789Z" },
        { step: 8, team: "teamB", type: "side", map: "lotus", order: 1, side: "atk", createdAt: "2026-04-03T10:39:41.299Z" },
      ],
      result: {
        maps: [{ order: 1, map: "lotus", isDecider: true, sideChosenBy: "teamB", startingSide: "atk" }],
      },
      createdAt: new Date("2026-04-03T10:38:30.234Z"),
      updatedAt: new Date("2026-04-03T10:39:41.299Z"),
    },
    results: [
      { order: 1, map: "lotus", score: "13-10", note: "", winner: "teamA", createdAt: new Date("2026-04-03T11:34:14.427Z"), updatedAt: new Date("2026-04-03T11:34:14.427Z") },
    ],
    createdAt: new Date("2026-04-03T10:38:20.504Z"),
    updatedAt: new Date("2026-04-03T11:34:14.427Z"),
    createdBy: "VALORANT",
    updatedBy: "VALORANT",
  },
};

function buildRepairedLinkedFinal() {
  return {
    _id: LINKED_FINAL_ID,
    pairKey: "boosted-irons__nagar-haters",
    teamA: "BOOSTED IRONS",
    teamB: "NAGAR HATERS",
    teamASlug: "boosted-irons",
    teamBSlug: "nagar-haters",
    bracket: { id: String(BRACKET_ID), title: "SANGAM", round: 3, match: 1 },
    manualContinuation: null,
    format: "bo3",
    veto: {
      status: "completed",
      mapPool: ["bind", "haven", "fracture", "lotus", "split", "pearl", "breeze"],
      actions: [
        { step: 1, team: "teamB", type: "ban", map: "pearl", order: null, side: null, createdAt: "2026-04-03T07:51:20.733Z" },
        { step: 2, team: "teamA", type: "ban", map: "fracture", order: null, side: null, createdAt: "2026-04-03T07:51:25.678Z" },
        { step: 3, team: "teamB", type: "pick", map: "bind", order: 1, side: null, createdAt: "2026-04-03T07:51:35.481Z" },
        { step: 4, team: "teamA", type: "side", map: "bind", order: 1, side: "atk", createdAt: "2026-04-03T07:51:39.539Z" },
        { step: 5, team: "teamA", type: "pick", map: "split", order: 2, side: null, createdAt: "2026-04-03T07:51:44.971Z" },
        { step: 6, team: "teamB", type: "side", map: "split", order: 2, side: "atk", createdAt: "2026-04-03T07:51:54.062Z" },
        { step: 7, team: "teamA", type: "ban", map: "haven", order: null, side: null, createdAt: "2026-04-03T10:39:15.047Z" },
        { step: 8, team: "teamB", type: "ban", map: "breeze", order: null, side: null, createdAt: "2026-04-03T10:39:19.374Z" },
        { step: 9, team: "system", type: "decider", map: "lotus", order: 3, side: null, createdAt: "2026-04-03T10:39:20.789Z" },
        { step: 10, team: "teamB", type: "side", map: "lotus", order: 3, side: "atk", createdAt: "2026-04-03T10:39:41.299Z" },
      ],
      result: {
        maps: [
          { order: 1, map: "bind", pickedBy: "teamB", isDecider: false, sideChosenBy: "teamA", startingSide: "atk" },
          { order: 2, map: "split", pickedBy: "teamA", isDecider: false, sideChosenBy: "teamB", startingSide: "atk" },
          { order: 3, map: "lotus", isDecider: true, sideChosenBy: "teamB", startingSide: "atk" },
        ],
      },
      createdAt: new Date("2026-04-03T07:51:12.144Z"),
      updatedAt: new Date("2026-04-03T11:34:14.427Z"),
    },
    results: [
      { order: 1, map: "bind", score: "13-10", note: "Imported from the original BO5 before the final was shortened.", winner: "teamA", createdAt: new Date("2026-04-03T09:41:08.040Z"), updatedAt: new Date("2026-04-03T09:41:08.040Z") },
      { order: 2, map: "split", score: "11-13", note: "Imported from the original BO5 before the final was shortened.", winner: "teamB", createdAt: new Date("2026-04-03T10:33:18.226Z"), updatedAt: new Date("2026-04-03T10:33:18.226Z") },
      { order: 3, map: "lotus", score: "13-10", note: "Imported from the BO1 decider played after the BO5 stopped at 1-1.", winner: "teamA", createdAt: new Date("2026-04-03T11:34:14.427Z"), updatedAt: new Date("2026-04-03T11:34:14.427Z") },
    ],
    createdAt: new Date("2026-04-03T14:29:20.765Z"),
    updatedAt: new Date("2026-04-03T11:34:14.427Z"),
    createdBy: "VALORANT",
    updatedBy: "VALORANT",
    repair: {
      type: "merged-final",
      mergedIntoFormat: "bo3",
      reason: "Original BO5 final stopped at 1-1 and was resolved with a BO1 decider because of time constraints.",
      winner: "BOOSTED IRONS",
      sourceSeries: splitFinalSource,
    },
  };
}

async function main() {
  const db = await getDb();
  const bracketCollection = db.collection<Record<string, unknown>>("brackets");
  const seriesCollection = db.collection<Record<string, unknown>>("series");
  const brackets = existsSync("./valorant_sangam.brackets.json")
    ? (readExtendedJsonFile("./valorant_sangam.brackets.json") as Record<string, unknown>[])
    : [];
  const series = existsSync("./valorant_sangam.series.json")
    ? (readExtendedJsonFile("./valorant_sangam.series.json") as Record<string, unknown>[])
    : [];

  for (const bracket of brackets) {
    await bracketCollection.replaceOne(
      { _id: bracket._id as ObjectId },
      bracket,
      { upsert: true },
    );
  }

  for (const entry of series) {
    await seriesCollection.replaceOne(
      { _id: entry._id as ObjectId },
      entry,
      { upsert: true },
    );
  }

  await seriesCollection.replaceOne(
    { _id: LINKED_FINAL_ID },
    buildRepairedLinkedFinal(),
    { upsert: true },
  );

  const bracketDoc = await bracketCollection.findOne({ _id: BRACKET_ID });
  const linkedSeriesDocs = await seriesCollection
    .find({ "bracket.id": String(BRACKET_ID) })
    .sort({ "bracket.round": 1, "bracket.match": 1 })
    .toArray();

  if (!bracketDoc) {
    throw new Error("SANGAM bracket not found after repair.");
  }

  const serializedBracket = serializeBracket(bracketDoc as Record<string, unknown>, {
    linkedSeries: linkedSeriesDocs.map((entry) => serializeSeries(entry as Record<string, unknown>)),
  });
  const finalSeries = linkedSeriesDocs.find((entry) => String(entry._id) === String(LINKED_FINAL_ID));
  const serializedFinal = finalSeries
    ? serializeSeries(finalSeries as Record<string, unknown>)
    : null;

  console.log(
    JSON.stringify(
      {
        dbName: process.env.MONGODB_DB_NAME,
        bracket: {
          id: serializedBracket._id,
          status: serializedBracket.status,
          champion: serializedBracket.championName,
        },
        final: serializedFinal
          ? {
              id: serializedFinal._id,
              format: serializedFinal.format,
              teams: [serializedFinal.teamA, serializedFinal.teamB],
              score: `${serializedFinal.overallScore.teamA}-${serializedFinal.overallScore.teamB}`,
            }
          : null,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
