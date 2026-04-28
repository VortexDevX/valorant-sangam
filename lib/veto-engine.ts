import { MAP_POOL, type MapId } from "@/lib/map-pool";
import type {
  DerivedVetoState,
  SeriesFormat,
  TeamSlot,
  VetoActionInput,
  VetoActionRecord,
  VetoResultMap,
  VetoSessionRecord,
  VetoStepDefinition,
} from "@/types/veto";

interface SessionShape {
  format: SeriesFormat;
  vetoStarter: TeamSlot;
  mapPool?: MapId[];
  actions: VetoActionRecord[];
}

function otherTeam(team: TeamSlot): TeamSlot {
  return team === "teamA" ? "teamB" : "teamA";
}

function getStepTemplate(format: SeriesFormat, vetoStarter: TeamSlot): VetoStepDefinition[] {
  const first = vetoStarter;
  const second = otherTeam(vetoStarter);

  if (format === "bo1") {
    return [
      { step: 1, type: "ban", team: first },
      { step: 2, type: "ban", team: second },
      { step: 3, type: "ban", team: first },
      { step: 4, type: "ban", team: second },
      { step: 5, type: "ban", team: first },
      { step: 6, type: "ban", team: second },
      { step: 7, type: "decider", team: "system", order: 1 },
      { step: 8, type: "side", team: second, order: 1 },
    ];
  }

  if (format === "bo3") {
    return [
      { step: 1, type: "ban", team: first },
      { step: 2, type: "ban", team: second },
      { step: 3, type: "pick", team: first, order: 1 },
      { step: 4, type: "side", team: second, order: 1 },
      { step: 5, type: "pick", team: second, order: 2 },
      { step: 6, type: "side", team: first, order: 2 },
      { step: 7, type: "ban", team: first },
      { step: 8, type: "ban", team: second },
      { step: 9, type: "decider", team: "system", order: 3 },
      { step: 10, type: "side", team: second, order: 3 },
    ];
  }

  return [
    { step: 1, type: "ban", team: first },
    { step: 2, type: "ban", team: second },
    { step: 3, type: "pick", team: first, order: 1 },
    { step: 4, type: "side", team: second, order: 1 },
    { step: 5, type: "pick", team: second, order: 2 },
    { step: 6, type: "side", team: first, order: 2 },
    { step: 7, type: "pick", team: first, order: 3 },
    { step: 8, type: "side", team: second, order: 3 },
    { step: 9, type: "pick", team: second, order: 4 },
    { step: 10, type: "side", team: first, order: 4 },
    { step: 11, type: "decider", team: "system", order: 5 },
    { step: 12, type: "side", team: second, order: 5 },
  ];
}

function sortMaps(maps: VetoResultMap[]) {
  return [...maps].sort((left, right) => left.order - right.order);
}

export function deriveVetoState(session: SessionShape): DerivedVetoState {
  const availableMaps = new Set<MapId>(session.mapPool ?? MAP_POOL);
  const resultByOrder = new Map<number, VetoResultMap>();
  const templates = getStepTemplate(session.format, session.vetoStarter);

  for (const action of session.actions) {
    if (action.type === "ban" && action.map) {
      availableMaps.delete(action.map);
    }

    if (action.type === "pick" && action.map && action.order) {
      availableMaps.delete(action.map);
      resultByOrder.set(action.order, {
        order: action.order,
        map: action.map,
        pickedBy: action.team === "system" ? undefined : action.team,
        isDecider: false,
      });
    }

    if (action.type === "decider" && action.map && action.order) {
      availableMaps.delete(action.map);
      resultByOrder.set(action.order, {
        order: action.order,
        map: action.map,
        isDecider: true,
      });
    }

    if (action.type === "side" && action.order && action.side) {
      const existing = resultByOrder.get(action.order);

      if (existing) {
        existing.sideChosenBy = action.team === "system" ? undefined : action.team;
        existing.startingSide = action.side;
      }
    }
  }

  return {
    availableMaps: [...availableMaps],
    nextStep: templates[session.actions.length] ?? null,
    result: {
      maps: sortMaps([...resultByOrder.values()]),
    },
    isComplete: session.actions.length >= templates.length,
  };
}

export function applyVetoAction(
  session: Pick<VetoSessionRecord, "format" | "vetoStarter" | "mapPool" | "actions">,
  input: VetoActionInput,
) {
  if (input.undo) {
    if (session.actions.length === 0) {
      throw new Error("There is no veto action to undo.");
    }

    return session.actions.slice(0, -1);
  }

  const derived = deriveVetoState(session);
  const nextStep = derived.nextStep;

  if (!nextStep) {
    throw new Error("This veto session is already complete.");
  }

  const now = new Date().toISOString();

  if (nextStep.type === "ban" || nextStep.type === "pick") {
    if (!input.map) {
      throw new Error("A map selection is required for this step.");
    }

    if (!derived.availableMaps.includes(input.map)) {
      throw new Error("That map is no longer available.");
    }

    const action: VetoActionRecord = {
      step: nextStep.step,
      team: nextStep.team,
      type: nextStep.type,
      order: nextStep.order,
      map: input.map,
      createdAt: now,
    };

    return [...session.actions, action];
  }

  if (nextStep.type === "decider") {
    if (derived.availableMaps.length !== 1) {
      throw new Error("Decider step requires exactly one map remaining.");
    }

    const action: VetoActionRecord = {
      step: nextStep.step,
      team: "system",
      type: "decider",
      order: nextStep.order,
      map: derived.availableMaps[0],
      createdAt: now,
    };

    return [...session.actions, action];
  }

  if (!input.side) {
    throw new Error("A side selection is required for this step.");
  }

  const targetMap = derived.result.maps.find((map) => map.order === nextStep.order);

  if (!targetMap) {
    throw new Error("Cannot set side before a map exists for this slot.");
  }

  const sideAction: VetoActionRecord = {
    step: nextStep.step,
    team: nextStep.team,
    type: "side",
    order: nextStep.order,
    map: targetMap.map,
    side: input.side,
    createdAt: now,
  };

  return [...session.actions, sideAction];
}
