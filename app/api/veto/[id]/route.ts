import { ObjectId } from "mongodb";
import { getAuthorizedAdmin } from "@/lib/auth";
import { MAP_POOL, isMapId, type MapId } from "@/lib/map-pool";
import { getDb } from "@/lib/mongodb";
import { applyVetoAction, deriveVetoState } from "@/lib/veto-engine";
import { vetoActionSchema } from "@/lib/validators";
import type { SeriesFormat, VetoSessionRecord } from "@/types/veto";

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

async function resolveId(
  context: { params: Promise<{ id: string }> },
): Promise<ObjectId | null> {
  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return null;
  }

  return new ObjectId(id);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAuthorizedAdmin(request);

    if (!admin) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const objectId = await resolveId(context);

    if (!objectId) {
      return Response.json({ error: "Invalid veto session id." }, { status: 400 });
    }

    const db = await getDb();
    const storedSession = await db
      .collection("vetoSessions")
      .findOne({ _id: objectId });

    if (!storedSession) {
      return Response.json({ error: "Veto session not found." }, { status: 404 });
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
  } catch {
    return Response.json({ error: "Failed to load veto session." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAuthorizedAdmin(request);

    if (!admin) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const objectId = await resolveId(context);

    if (!objectId) {
      return Response.json({ error: "Invalid veto session id." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = vetoActionSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid veto action." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const storedSession = await db
      .collection("vetoSessions")
      .findOne({ _id: objectId });

    if (!storedSession) {
      return Response.json({ error: "Veto session not found." }, { status: 404 });
    }

    const session = serializeVetoSession(storedSession as Record<string, unknown>);
    const nextActions = applyVetoAction(session, parsed.data);
    const derived = deriveVetoState({
      format: session.format,
      mapPool: session.mapPool,
      actions: nextActions,
    });
    const nextUpdatedAt = new Date();
    const nextStatus = derived.isComplete ? "completed" : "in_progress";

    await db.collection("vetoSessions").updateOne(
      { _id: objectId },
      {
        $set: {
          actions: nextActions,
          result: derived.result,
          status: nextStatus,
          updatedAt: nextUpdatedAt,
          updatedBy: admin,
        },
      },
    );

    return Response.json({
      session: {
        ...session,
        actions: nextActions,
        result: derived.result,
        status: nextStatus,
        updatedAt: nextUpdatedAt.toISOString(),
      },
      derived,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update veto session.",
      },
      { status: 400 },
    );
  }
}
