import type { MapId } from "@/lib/map-pool";

export type SeriesFormat = "bo1" | "bo3" | "bo5";
export type TeamSlot = "teamA" | "teamB";
export type ActionActor = TeamSlot | "system";
export type StartingSide = "atk" | "def";
export type VetoActionType = "ban" | "pick" | "side" | "decider";

export interface VetoActionRecord {
  step: number;
  team: ActionActor;
  type: VetoActionType;
  map?: MapId;
  side?: StartingSide;
  order?: number;
  createdAt: string;
}

export interface VetoResultMap {
  order: number;
  map: MapId;
  pickedBy?: TeamSlot;
  sideChosenBy?: TeamSlot;
  startingSide?: StartingSide;
  isDecider: boolean;
}

export interface VetoResult {
  maps: VetoResultMap[];
}

export interface VetoSessionRecord {
  _id: string;
  teamA: string;
  teamB: string;
  format: SeriesFormat;
  vetoStarter: TeamSlot;
  status: "in_progress" | "completed";
  mapPool: MapId[];
  actions: VetoActionRecord[];
  result: VetoResult;
  createdAt: string;
  updatedAt: string;
}

export interface VetoStepDefinition {
  step: number;
  type: VetoActionType;
  team: ActionActor;
  order?: number;
}

export interface DerivedVetoState {
  availableMaps: MapId[];
  nextStep: VetoStepDefinition | null;
  result: VetoResult;
  isComplete: boolean;
}

export interface VetoActionInput {
  map?: MapId;
  side?: StartingSide;
  undo?: boolean;
}
