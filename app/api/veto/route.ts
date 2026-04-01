import { getAuthorizedAdmin } from "@/lib/auth";
import { logApiError } from "@/lib/api-errors";
import { MAP_POOL, isMapId, type MapId } from "@/lib/map-pool";
import { getDb } from "@/lib/mongodb";
import { deriveVetoState } from "@/lib/veto-engine";
import { vetoSessionSchema } from "@/lib/validators";
import type { SeriesFormat, VetoSessionRecord } from "@/types/veto";

export const runtime = "nodejs";

function serializeVetoSession(
  session: Record<string, unknown>,
): VetoSessionRecord {
  const actions = Array.isArray(session.actions) ? session.actions : [];
  const mapPool = Array.isArray(session.mapPool)
    ? session.mapPool.filter(
        (value): value is MapId => typeof value === "string" && isMapId(value),
      )
    : [...MAP_POOL];

  return {
    _id: String(session._id),
    teamA: String(session.teamA),
    teamB: String(session.teamB),
    format: String(session.format) as SeriesFormat,
    status: String(session.status) as "in_progress" | "completed",
    mapPool,
    actions: actions.map((action) => {
      const typedAction = action as Record<string, unknown>;
      return {
        step: Number(typedAction.step),
        team: String(typedAction.team) as "teamA" | "teamB" | "system",
        type: String(typedAction.type) as "ban" | "pick" | "side" | "decider",
        map:
          typeof typedAction.map === "string" && isMapId(typedAction.map)
            ? typedAction.map
            : undefined,
        side:
          typedAction.side === "atk" || typedAction.side === "def"
            ? typedAction.side
            : undefined,
        order:
          typeof typedAction.order === "number" ? typedAction.order : undefined,
        createdAt:
          typedAction.createdAt instanceof Date
            ? typedAction.createdAt.toISOString()
            : String(typedAction.createdAt),
      };
    }),
    result:
      typeof session.result === "object" && session.result
        ? (session.result as VetoSessionRecord["result"])
        : { maps: [] },
    createdAt:
      session.createdAt instanceof Date
        ? session.createdAt.toISOString()
        : String(session.createdAt),
    updatedAt:
      session.updatedAt instanceof Date
        ? session.updatedAt.toISOString()
        : String(session.updatedAt),
  };
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthorizedAdmin(request);

    if (!admin) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = vetoSessionSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid veto payload." },
        { status: 400 },
      );
    }

    const now = new Date();
    const baseSession = {
      ...parsed.data,
      status: "in_progress" as const,
      mapPool: [...parsed.data.mapPool],
      actions: [],
      result: { maps: [] },
      createdAt: now,
      updatedAt: now,
      createdBy: admin,
    };

    const db = await getDb();
    const result = await db.collection("vetoSessions").insertOne(baseSession);
    const storedSession = await db
      .collection("vetoSessions")
      .findOne({ _id: result.insertedId });

    if (!storedSession) {
      return Response.json(
        { error: "Failed to create veto session." },
        { status: 500 },
      );
    }

    const session = serializeVetoSession(storedSession as Record<string, unknown>);
    const derived = deriveVetoState(session);

    return Response.json({
      session: {
        ...session,
        result: derived.result,
      },
      derived,
    });
  } catch (error) {
    logApiError("POST /api/veto", error);
    return Response.json({ error: "Failed to create veto session." }, { status: 500 });
  }
}
