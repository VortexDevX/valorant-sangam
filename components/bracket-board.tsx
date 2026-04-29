"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import {
  SingleEliminationBracket,
  createTheme,
} from "@g-loot/react-tournament-brackets";
import type {
  BracketMatchRecord,
  BracketRecord,
  BracketSlotRecord,
} from "@/types/bracket";

interface BracketBoardProps {
  bracket: BracketRecord;
  busy?: boolean;
  editable?: boolean;
  onPickWinner?: (
    round: number,
    match: number,
    winnerSeed: number | null,
  ) => Promise<void> | void;
}

type BaseMatch = {
  id: number | string;
  name?: string;
  nextMatchId: number | string | null;
  tournamentRoundText?: string;
  startTime: string;
  state: string;
  participants: TournamentParticipant[];
};

type TournamentMatch = BaseMatch & {
  metaRound: number;
  metaMatch: number;
  winnerSeed: number | null;
  winnerSource: "auto" | "series" | "continuation" | "manual" | null;
  seriesId: string | null;
  seriesScore: string | null;
  autoAdvanced: boolean;
  canPickWinner: boolean;
};

type TournamentParticipant = {
  id: string | number;
  name?: string;
  isWinner?: boolean;
  status?: "PLAYED" | "NO_SHOW" | "WALK_OVER" | "NO_PARTY" | null;
  resultText?: string | null;
  seed: number | null;
  isBye: boolean;
};

type MatchComponentProps = {
  match: TournamentMatch;
  topParty: TournamentParticipant;
  bottomParty: TournamentParticipant;
  teamNameFallback: string;
};

type BracketWrapperProps = {
  bracketWidth: number;
  bracketHeight: number;
  children: ReactNode;
};

const COLORS = {
  accent: "#ff4655",
  accentBorder: "rgba(255,179,178,0.18)",
  accentBorderStrong: "rgba(255,179,178,0.82)",
  accentBorderHover: "rgba(255,179,178,0.82)",
  winnerBg: "rgba(107,22,29,0.96)",
  winnerGradient:
    "linear-gradient(135deg, rgba(107,22,29,0.96), rgba(255,70,85,0.28))",
  rowDefault: "rgba(18,28,39,0.92)",
  shell:
    "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)), rgba(5,15,25,0.96)",
  textPrimary: "#d9e3f2",
  textMuted: "rgba(185,198,213,0.62)",
  textAccent: "#ffb3b2",
  textSuccess: "#60dcb0",
  textGold: "#ffe0ab",
  connector: "rgba(255,179,178,0.28)",
  connectorHighlight: "rgba(255,179,178,0.82)",
} as const;

const bracketTheme = createTheme({
  fontFamily: "var(--font-display), sans-serif",
  roundHeaders: { background: "rgba(255, 70, 85, 0.16)" },
  textColor: {
    highlighted: "#fff0f0",
    main: COLORS.textPrimary,
    dark: "#9caec2",
    disabled: "#5d6d80",
  },
  matchBackground: { wonColor: "#6b161d", lostColor: "#121c27" },
  border: {
    color: COLORS.accentBorder,
    highlightedColor: COLORS.accentBorderStrong,
  },
  score: {
    text: {
      highlightedWonColor: "#fff0f0",
      highlightedLostColor: COLORS.textAccent,
    },
    background: { wonColor: COLORS.accent, lostColor: "#2c3641" },
  },
  canvasBackground: "#050f19",
});

function buildParticipant(
  slot: BracketSlotRecord | null,
  match: BracketMatchRecord,
  side: "top" | "bottom",
): TournamentParticipant {
  if (!slot) {
    return {
      id: `${match.round}-${match.match}-${side}-pending`,
      name: undefined,
      isWinner: false,
      status: "NO_PARTY",
      resultText: null,
      seed: null,
      isBye: false,
    };
  }

  if (slot.isBye) {
    return {
      id: `${match.round}-${match.match}-${side}-bye`,
      name: "BYE",
      isWinner: match.winnerSeed === slot.seed,
      status: "WALK_OVER",
      resultText: "BYE",
      seed: null,
      isBye: true,
    };
  }

  return {
    id: slot.seed ?? `${match.round}-${match.match}-${side}`,
    name: slot.name || undefined,
    isWinner: match.winnerSeed === slot.seed,
    status: match.isComplete ? "PLAYED" : null,
    resultText: slot.seed ? `S${slot.seed}` : null,
    seed: slot.seed,
    isBye: false,
  };
}

function toTournamentMatches(bracket: BracketRecord): TournamentMatch[] {
  const totalRounds = bracket.rounds.length;

  return bracket.rounds.flatMap((round, roundIndex) =>
    round.matches.map((match) => ({
      id: `${match.round}-${match.match}`,
      name: round.label,
      nextMatchId:
        roundIndex === totalRounds - 1
          ? null
          : `${match.round + 1}-${Math.ceil(match.match / 2)}`,
      tournamentRoundText: round.label,
      startTime: "",
      state: match.autoAdvanced
        ? "WALK_OVER"
        : match.isComplete
          ? "DONE"
          : "NO_PARTY",
      participants: [
        buildParticipant(match.top, match, "top"),
        buildParticipant(match.bottom, match, "bottom"),
      ],
      metaRound: match.round,
      metaMatch: match.match,
      winnerSeed: match.winnerSeed,
      winnerSource: match.winnerSource,
      seriesId: match.seriesId,
      seriesScore: match.seriesScore,
      autoAdvanced: match.autoAdvanced,
      canPickWinner: match.canPickWinner,
    })),
  );
}

function slotLabel(participant: TournamentParticipant, fallback: string) {
  if (participant.isBye) return "BYE";
  return participant.name || fallback;
}

function labelStyle(color: string): CSSProperties {
  return {
    color,
    fontFamily: "var(--font-display), sans-serif",
    fontSize: "0.62rem",
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  };
}

function BracketMatchCard({
  match,
  topParty,
  bottomParty,
  teamNameFallback,
  editable,
  busy,
  onPickWinner,
}: MatchComponentProps & {
  editable: boolean;
  busy: boolean;
  onPickWinner?: BracketBoardProps["onPickWinner"];
}) {
  const canPickTop =
    editable &&
    match.canPickWinner &&
    !topParty.isBye &&
    typeof topParty.seed === "number";
  const canPickBottom =
    editable &&
    match.canPickWinner &&
    !bottomParty.isBye &&
    typeof bottomParty.seed === "number";

  const statusLabel = match.autoAdvanced
    ? "Auto Advance"
    : match.winnerSource === "series"
      ? "Series Result"
      : match.winnerSource === "continuation"
        ? "Continuation"
        : match.seriesId
          ? "Linked Series"
          : match.winnerSeed
            ? "Completed"
            : "Live";

  const winnerName =
    match.winnerSeed === topParty.seed
      ? slotLabel(topParty, teamNameFallback)
      : match.winnerSeed === bottomParty.seed
        ? slotLabel(bottomParty, teamNameFallback)
        : null;

  const shellStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "0.55rem",
    padding: "0.7rem",
    background: COLORS.shell,
    border: `1px solid ${COLORS.accentBorder}`,
    boxShadow: "0 18px 30px rgba(0,0,0,0.24)",
  };

  function rowStyle(participant: TournamentParticipant): CSSProperties {
    const isWinner =
      match.winnerSeed !== null && participant.seed === match.winnerSeed;
    const clickable =
      editable &&
      match.canPickWinner &&
      !participant.isBye &&
      typeof participant.seed === "number";

    return {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto",
      alignItems: "stretch",
      minHeight: "3.5rem",
      border: isWinner
        ? `1px solid ${COLORS.accentBorderStrong}`
        : `1px solid ${COLORS.accentBorder}`,
      background: participant.isBye
        ? "rgba(255,255,255,0.04)"
        : isWinner
          ? COLORS.winnerGradient
          : COLORS.rowDefault,
      color: participant.isBye ? "rgba(185,198,213,0.56)" : COLORS.textPrimary,
      transition: "border-color 120ms ease, transform 120ms ease",
      cursor: clickable ? "pointer" : "default",
    };
  }

  function actionStyle(active: boolean): CSSProperties {
    return {
      minWidth: "2.35rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderLeft: `1px solid ${COLORS.accentBorder}`,
      background: active ? "rgba(255,70,85,0.12)" : "transparent",
      color: active ? "#fff0f0" : "rgba(255,179,178,0.66)",
      fontFamily: "var(--font-display), sans-serif",
      fontWeight: 800,
      fontSize: "0.72rem",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    };
  }

  function makeParticipantRow(
    participant: TournamentParticipant,
    canPick: boolean,
  ) {
    return (
      <button
        disabled={busy || !canPick}
        onClick={() => {
          if (typeof participant.seed === "number") {
            void onPickWinner?.(
              match.metaRound,
              match.metaMatch,
              participant.seed,
            );
          }
        }}
        style={rowStyle(participant)}
        type="button"
      >
        <div style={{ minWidth: 0, padding: "0.55rem 0.7rem" }}>
          <div
            style={{
              color: COLORS.textMuted,
              fontFamily: "var(--font-display), sans-serif",
              fontSize: "0.54rem",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {participant.isBye
              ? "BYE"
              : participant.seed
                ? `Seed ${participant.seed}`
                : "Pending"}
          </div>
          <div
            style={{
              marginTop: "0.18rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-display), sans-serif",
              fontSize: "1rem",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
            }}
          >
            {slotLabel(participant, teamNameFallback)}
          </div>
        </div>
        <div style={actionStyle(match.winnerSeed === participant.seed)}>
          {match.winnerSeed === participant.seed ? "W" : canPick ? "Pick" : "–"}
        </div>
      </button>
    );
  }

  return (
    <div style={shellStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <span style={labelStyle(COLORS.textAccent)}>
          Match {match.metaMatch}
        </span>
        <span
          style={labelStyle(
            match.autoAdvanced
              ? COLORS.textSuccess
              : match.winnerSource === "series"
                ? COLORS.textAccent
                : match.seriesId
                  ? COLORS.textPrimary
                  : "#7b8d9f",
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        {makeParticipantRow(topParty, canPickTop)}
        {makeParticipantRow(bottomParty, canPickBottom)}
      </div>

      <div style={{ minHeight: "1.1rem" }}>
        {match.autoAdvanced ? (
          <span style={labelStyle(COLORS.textSuccess)}>
            Advanced automatically — opposing slot is a BYE.
          </span>
        ) : match.winnerSource === "series" && winnerName ? (
          <span style={labelStyle(COLORS.textAccent)}>
            {match.seriesScore
              ? `${winnerName} advanced via linked series (${match.seriesScore}).`
              : `${winnerName} advanced via linked series.`}
          </span>
        ) : match.winnerSource === "continuation" && winnerName ? (
          <span style={labelStyle(COLORS.textGold)}>
            {match.seriesScore
              ? `${winnerName} advanced via manual continuation (${match.seriesScore}).`
              : `${winnerName} advanced via manual continuation.`}
          </span>
        ) : match.seriesId ? (
          <span style={labelStyle("#9caec2")}>
            Complete the linked series to advance.
          </span>
        ) : editable && match.canPickWinner && match.winnerSeed !== null ? (
          <button
            disabled={busy}
            onClick={() =>
              void onPickWinner?.(match.metaRound, match.metaMatch, null)
            }
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              ...labelStyle(COLORS.textPrimary),
              cursor: "pointer",
            }}
            type="button"
          >
            Clear Winner
          </button>
        ) : match.winnerSource === "manual" && winnerName ? (
          <span style={labelStyle(COLORS.textPrimary)}>
            {winnerName} was advanced manually.
          </span>
        ) : !match.canPickWinner && !match.autoAdvanced && !match.winnerSeed ? (
          <span style={labelStyle("#7b8d9f")}>Waiting for matchup</span>
        ) : null}
      </div>
    </div>
  );
}

export function BracketBoard({
  bracket,
  busy = false,
  editable = false,
  onPickWinner,
}: BracketBoardProps) {
  const matches = useMemo(() => toTournamentMatches(bracket), [bracket]);

  if (bracket.rounds.length === 0) {
    return (
      <section className="bracket-engine-frame">
        <div className="bracket-engine-header">
          <div>
            <p className="eyebrow">Bracket Board</p>
            <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-[-0.05em]">
              {bracket.title}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="tactical-chip text-[var(--text-secondary)]">
              {bracket.teamCount} teams
            </span>
            <span className="tactical-chip text-[var(--text-secondary)]">
              {bracket.format}
            </span>
            {bracket.championName ? (
              <span className="tactical-chip text-[var(--success)]">
                Champion: {bracket.championName}
              </span>
            ) : null}
          </div>
        </div>
        <div className="bracket-engine-empty">
          <div className="font-display text-[0.72rem] font-black uppercase tracking-[0.18em] text-[var(--text-accent)]">
            Direct Champion
          </div>
          <div className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em]">
            {bracket.championName ?? "TBD"}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bracket-engine-frame">
      <div className="bracket-engine-header">
        <div>
          <p className="eyebrow">Bracket Board</p>
          <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-[-0.05em]">
            {bracket.title}
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="tactical-chip text-[var(--text-accent)]">
            {bracket.status.replaceAll("_", " ")}
          </span>
          <span className="tactical-chip text-[var(--text-secondary)]">
            {bracket.teamCount} teams
          </span>
          <span className="tactical-chip text-[var(--text-secondary)]">
            {bracket.format}
          </span>
          {bracket.championName ? (
            <span className="tactical-chip text-[var(--success)]">
              Champion: {bracket.championName}
            </span>
          ) : null}
        </div>
      </div>

      <div className="bracket-engine-scroll">
        <SingleEliminationBracket
          matches={matches}
          matchComponent={(props: MatchComponentProps) => (
            <BracketMatchCard
              {...props}
              busy={busy}
              editable={editable}
              onPickWinner={onPickWinner}
            />
          )}
          options={{
            style: {
              width: 330,
              boxHeight: 168,
              canvasPadding: 24,
              spaceBetweenColumns: 64,
              spaceBetweenRows: 24,
              roundHeader: {
                isShown: true,
                height: 40,
                marginBottom: 24,
                fontSize: 14,
                fontColor: "#fff0f0",
                backgroundColor: "rgba(255, 70, 85, 0.16)",
                fontFamily: "var(--font-display), sans-serif",
                roundTextGenerator: (currentRoundNumber: number) =>
                  bracket.rounds[currentRoundNumber - 1]?.label,
              },
              connectorColor: COLORS.connector,
              connectorColorHighlight: COLORS.connectorHighlight,
            },
          }}
          svgWrapper={({ children, ...props }: BracketWrapperProps) => (
            <div
              style={{
                minWidth: `${props.bracketWidth}px`,
                minHeight: `${props.bracketHeight}px`,
                paddingBottom: "1rem",
              }}
            >
              {children}
            </div>
          )}
          theme={bracketTheme}
        />
      </div>
    </section>
  );
}
