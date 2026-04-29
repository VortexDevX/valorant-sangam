import { getDb } from "@/lib/mongodb";
import { loadBracketLinkedSeries } from "@/lib/bracket-series";
import { serializeBracket } from "@/lib/brackets";
import { serializeSeries } from "@/lib/series";
import type { BracketRecord } from "@/types/bracket";
import type { SeriesRecord, TeamPageRecord } from "@/types/series";

export async function getAllSeries(): Promise<SeriesRecord[]> {
  const db = await getDb();
  const docs = await db
    .collection("series")
    .find({})
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray();

  return docs.map((doc) => serializeSeries(doc as Record<string, unknown>));
}

export async function getAllBrackets(): Promise<BracketRecord[]> {
  const db = await getDb();
  const docs = await db
    .collection("brackets")
    .find({})
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray();

  const linkedSeriesGroups = await Promise.all(
    docs.map((doc) => loadBracketLinkedSeries(db, String(doc._id))),
  );

  return docs.map((doc, index) =>
    serializeBracket(doc as Record<string, unknown>, {
      linkedSeries: linkedSeriesGroups[index],
    }),
  );
}

export async function getBracketById(
  id: string,
): Promise<BracketRecord | null> {
  const { ObjectId } = await import("mongodb");

  if (!ObjectId.isValid(id)) {
    return null;
  }

  const db = await getDb();
  const doc = await db
    .collection("brackets")
    .findOne({ _id: new ObjectId(id) });

  if (!doc) {
    return null;
  }

  const linkedSeries = await loadBracketLinkedSeries(db, id);

  return serializeBracket(doc as Record<string, unknown>, { linkedSeries });
}

export async function getTeamPage(
  slug: string,
): Promise<TeamPageRecord | null> {
  const db = await getDb();
  const docs = await db
    .collection("series")
    .find({
      $or: [{ teamASlug: slug }, { teamBSlug: slug }],
    })
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray();

  if (docs.length === 0) {
    return null;
  }

  const series = docs.map((doc) =>
    serializeSeries(doc as Record<string, unknown>),
  );

  const firstSeries = series[0];
  const name =
    firstSeries.teamASlug === slug ? firstSeries.teamA : firstSeries.teamB;

  return { slug, name, series };
}
