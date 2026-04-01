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
  teams: BracketSeedRecord[];
  winners: BracketWinnerSelection[];
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
}
