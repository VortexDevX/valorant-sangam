import { logApiError } from "@/lib/api-errors";
import { getDb } from "@/lib/mongodb";
import { serializeSeries } from "@/lib/series";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const db = await getDb();
    const series = await db
      .collection("series")
      .find({
        $or: [{ teamASlug: slug }, { teamBSlug: slug }],
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    if (series.length === 0) {
      return Response.json({ error: "Team not found." }, { status: 404 });
    }

    const serialized = series.map((entry) =>
      serializeSeries(entry as Record<string, unknown>),
    );
    const teamName =
      serialized[0].teamASlug === slug ? serialized[0].teamA : serialized[0].teamB;

    return Response.json({
      team: {
        slug,
        name: teamName,
        series: serialized,
      },
    });
  } catch (error) {
    logApiError("GET /api/team/[slug]", error);
    return Response.json({ error: "Failed to load team page." }, { status: 500 });
  }
}
