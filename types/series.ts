import type { MapId } from "@/lib/map-pool";
import type {
  SeriesFormat,
  TeamSlot,
  VetoActionRecord,
  VetoResult,
  VetoResultMap,
} from "@/types/veto";

export type SeriesStatus =
  | "scheduled"
  | "veto_in_progress"
  | "veto_completed"
  | "completed";

export interface SeriesCreateInput {
  teamA: string;
  teamB: string;
  format: SeriesFormat;
}

export interface SeriesVetoState {
  status: "not_started" | "in_progress" | "completed";
  mapPool: MapId[];
  actions: VetoActionRecord[];
  result: VetoResult;
  createdAt?: string;
  updatedAt?: string;
}

export interface SeriesResultRecord {
  order: number;
  map: MapId;
  score: string;
  note?: string;
  winner: TeamSlot;
  createdAt: string;
  updatedAt: string;
}

export interface SeriesOverallScore {
  teamA: number;
  teamB: number;
  winsNeeded: number;
  winner: TeamSlot | null;
  completed: boolean;
}

export interface SeriesBracketLink {
  id: string;
  title: string;
  round: number;
  match: number;
}

export interface SeriesManualContinuationLink {
  id: string;
  title: string;
  round: number;
  match: number;
}

export interface SeriesRecord {
  _id: string;
  pairKey: string;
  teamA: string;
  teamB: string;
  teamASlug: string;
  teamBSlug: string;
  bracket: SeriesBracketLink | null;
  manualContinuation: SeriesManualContinuationLink | null;
  locked: boolean;
  format: SeriesFormat;
  status: SeriesStatus;
  veto: SeriesVetoState | null;
  results: SeriesResultRecord[];
  overallScore: SeriesOverallScore;
  createdAt: string;
  updatedAt: string;
}

export interface TeamPageRecord {
  slug: string;
  name: string;
  series: SeriesRecord[];
}

export interface NextSeriesMap {
  order: number;
  map: MapId;
  pickedBy?: TeamSlot;
  sideChosenBy?: TeamSlot;
  startingSide?: "atk" | "def";
  isDecider: boolean;
}

export type OrderedSeriesMap = VetoResultMap;
