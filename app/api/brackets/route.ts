import { loadBracketLinkedSeries } from "@/lib/bracket-series";
import { getAuthorizedAdmin } from "@/lib/auth";
import { logApiError } from "@/lib/api-errors";
import { createDefaultBracketTeams, getBracketSize, serializeBracket } from "@/lib/brackets";
import { getDb } from "@/lib/mongodb";
import { slugifyTeamName } from "@/lib/series";
import { bracketCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = await getDb();
    const brackets = await db
      .collection("brackets")
      .find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();
    const linkedSeriesGroups = await Promise.all(
      brackets.map((entry) => loadBracketLinkedSeries(db, String(entry._id))),
    );

    return Response.json({
      brackets: brackets.map((entry, index) =>
        serializeBracket(entry as Record<string, unknown>, {
          linkedSeries: linkedSeriesGroups[index],
        }),
      ),
    });
  } catch (error) {
    logApiError("GET /api/brackets", error);
    return Response.json({ error: "Failed to load brackets." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthorizedAdmin(request);

    if (!admin) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bracketCreateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid bracket payload." },
        { status: 400 },
      );
    }

    const now = new Date();
    const db = await getDb();
    const title = parsed.data.title.trim();
    const created = await db.collection("brackets").insertOne({
      title,
      slug: slugifyTeamName(title) || `bracket-${Date.now()}`,
      teamCount: parsed.data.teamCount,
      bracketSize: getBracketSize(parsed.data.teamCount),
      format: parsed.data.format,
      locked: false,
      teams: createDefaultBracketTeams(parsed.data.teamCount),
      winners: [],
      manualResolutions: [],
      createdAt: now,
      updatedAt: now,
      createdBy: admin,
    });

    const bracket = await db.collection("brackets").findOne({ _id: created.insertedId });

    if (!bracket) {
      return Response.json({ error: "Failed to create bracket." }, { status: 500 });
    }

    return Response.json(
      { bracket: serializeBracket(bracket as Record<string, unknown>) },
      { status: 201 },
    );
  } catch (error) {
    logApiError("POST /api/brackets", error);
    return Response.json({ error: "Failed to create bracket." }, { status: 500 });
  }
}
