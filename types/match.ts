import type { MapId } from "@/lib/map-pool";

export interface MatchInput {
  teamA: string;
  teamB: string;
  map: MapId;
  score: string;
  note?: string;
}

export interface MatchRecord extends MatchInput {
  _id: string;
  createdAt: string;
  updatedAt: string;
}
