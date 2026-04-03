import type { SeriesFormat } from "@/types/veto";

export type BracketStatus = "draft" | "in_progress" | "completed";

export interface BracketSeedRecord {
  seed: number;
  name: string;
  slug: string | null;
}

export interface BracketWinnerSelection {
  round: number;
  match: number;
  winnerSeed: number | null;
}

export interface BracketContinuationResolution {
  round: number;
  match: number;
  seriesId: string;
  winnerSeed: number;
  scoreline: string;
  winnerName: string;
  note: string;
  resolvedAt?: string;
}

export interface BracketSlotRecord {
  seed: number | null;
  name: string;
  slug: string | null;
  isBye: boolean;
}

export interface BracketMatchRecord {
  round: number;
  match: number;
  top: BracketSlotRecord | null;
  bottom: BracketSlotRecord | null;
  winnerSeed: number | null;
  winnerName: string | null;
  winnerSource: "auto" | "series" | "continuation" | "manual" | null;
  seriesId: string | null;
  seriesScore: string | null;
  autoAdvanced: boolean;
  canPickWinner: boolean;
  isComplete: boolean;
}

export interface BracketRoundRecord {
  round: number;
  label: string;
  matches: BracketMatchRecord[];
}

export interface BracketRecord {
  _id: string;
  title: string;
  slug: string;
  teamCount: number;
  bracketSize: number;
  format: SeriesFormat;
  locked: boolean;
  teams: BracketSeedRecord[];
  winners: BracketWinnerSelection[];
  manualResolutions: BracketContinuationResolution[];
  rounds: BracketRoundRecord[];
  status: BracketStatus;
  championSeed: number | null;
  championName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BracketCreateInput {
  title: string;
  teamCount: number;
  format: SeriesFormat;
}
