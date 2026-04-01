"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import {
  SingleEliminationBracket,
  createTheme,
} from "@g-loot/react-tournament-brackets";
import type { BracketMatchRecord, BracketRecord, BracketSlotRecord } from "@/types/bracket";

interface BracketBoardProps {
  bracket: BracketRecord;
  busy?: boolean;
  editable?: boolean;
  onEditTeamName?: (seed: number, name: string) => void;
  onPickWinner?: (round: number, match: number, winnerSeed: number | null) => Promise<void> | void;
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

const bracketTheme = createTheme({
  fontFamily: "var(--font-display), sans-serif",
  roundHeaders: {
    background: "rgba(255, 70, 85, 0.16)",
  },
  textColor: {
    highlighted: "#fff0f0",
    main: "#d9e3f2",
    dark: "#9caec2",
    disabled: "#5d6d80",
  },
  matchBackground: {
    wonColor: "#6b161d",
    lostColor: "#121c27",
  },
  border: {
    color: "rgba(255, 179, 178, 0.18)",
    highlightedColor: "rgba(255, 179, 178, 0.8)",
  },
  score: {
    text: {
      highlightedWonColor: "#fff0f0",
      highlightedLostColor: "#ffb3b2",
    },
    background: {
      wonColor: "#ff4655",
      lostColor: "#2c3641",
    },
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
        roundIndex === totalRounds - 1 ? null : `${match.round + 1}-${Math.ceil(match.match / 2)}`,
      tournamentRoundText: round.label,
      startTime: "",
      state: match.autoAdvanced ? "WALK_OVER" : match.isComplete ? "DONE" : "NO_PARTY",
      participants: [
        buildParticipant(match.top, match, "top"),
        buildParticipant(match.bottom, match, "bottom"),
      ],
      metaRound: match.round,
      metaMatch: match.match,
      winnerSeed: match.winnerSeed,
      autoAdvanced: match.autoAdvanced,
      canPickWinner: match.canPickWinner,
    })),
  );
}

function slotLabel(participant: TournamentParticipant, fallback: string) {
  if (participant.isBye) {
    return "BYE";
  }

  return participant.name || fallback;
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
  const typedMatch = match as TournamentMatch;
  const topParticipant = topParty as TournamentParticipant;
  const bottomParticipant = bottomParty as TournamentParticipant;
  const canPickTop =
    editable &&
    typedMatch.canPickWinner &&
    !topParticipant.isBye &&
    typeof topParticipant.seed === "number";
  const canPickBottom =
    editable &&
    typedMatch.canPickWinner &&
    !bottomParticipant.isBye &&
    typeof bottomParticipant.seed === "number";

  const shellStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "0.55rem",
    padding: "0.7rem",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)), rgba(5,15,25,0.96)",
    border: "1px solid rgba(255,179,178,0.14)",
    boxShadow: "0 18px 30px rgba(0,0,0,0.24)",
  };

  function rowStyle(participant: TournamentParticipant): CSSProperties {
    const isWinner = typedMatch.winnerSeed !== null && participant.seed === typedMatch.winnerSeed;
    const clickable =
      editable &&
      typedMatch.canPickWinner &&
      !participant.isBye &&
      typeof participant.seed === "number";

    return {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto",
      alignItems: "stretch",
      minHeight: "3.5rem",
      border: isWinner
        ? "1px solid rgba(255,179,178,0.82)"
        : "1px solid rgba(255,179,178,0.14)",
      background: participant.isBye
        ? "rgba(255,255,255,0.04)"
        : isWinner
          ? "linear-gradient(135deg, rgba(107,22,29,0.96), rgba(255,70,85,0.28))"
          : "rgba(18,28,39,0.92)",
      color: participant.isBye ? "rgba(185,198,213,0.56)" : "#d9e3f2",
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
      borderLeft: "1px solid rgba(255,179,178,0.14)",
      background: active ? "rgba(255,70,85,0.12)" : "transparent",
      color: active ? "#fff0f0" : "rgba(255,179,178,0.66)",
      fontFamily: "var(--font-display), sans-serif",
      fontWeight: 800,
      fontSize: "0.72rem",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    };
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
        <span
          style={{
            color: "#ffb3b2",
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "0.64rem",
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Match {typedMatch.metaMatch}
        </span>
        <span
          style={{
            color: typedMatch.autoAdvanced ? "#60dcb0" : "#7b8d9f",
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "0.58rem",
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {typedMatch.autoAdvanced ? "Auto Advance" : typedMatch.winnerSeed ? "Completed" : "Live"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        <button
          disabled={busy || !canPickTop}
          onClick={() => {
            if (typeof topParticipant.seed === "number") {
              void onPickWinner?.(typedMatch.metaRound, typedMatch.metaMatch, topParticipant.seed);
            }
          }}
          style={rowStyle(topParticipant)}
          type="button"
        >
          <div style={{ minWidth: 0, padding: "0.55rem 0.7rem" }}>
            <div
              style={{
                color: "rgba(185,198,213,0.62)",
                fontFamily: "var(--font-display), sans-serif",
                fontSize: "0.54rem",
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {topParticipant.isBye
                ? "BYE"
                : topParticipant.seed
                  ? `Seed ${topParticipant.seed}`
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
              {slotLabel(topParticipant, teamNameFallback)}
            </div>
          </div>
          <div style={actionStyle(typedMatch.winnerSeed === topParticipant.seed)}>
            {typedMatch.winnerSeed === topParticipant.seed ? "W" : canPickTop ? "Pick" : "-"}
          </div>
        </button>

        <button
          disabled={busy || !canPickBottom}
          onClick={() => {
            if (typeof bottomParticipant.seed === "number") {
              void onPickWinner?.(typedMatch.metaRound, typedMatch.metaMatch, bottomParticipant.seed);
            }
          }}
          style={rowStyle(bottomParticipant)}
          type="button"
        >
          <div style={{ minWidth: 0, padding: "0.55rem 0.7rem" }}>
            <div
              style={{
                color: "rgba(185,198,213,0.62)",
                fontFamily: "var(--font-display), sans-serif",
                fontSize: "0.54rem",
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {bottomParticipant.isBye
                ? "BYE"
                : bottomParticipant.seed
                  ? `Seed ${bottomParticipant.seed}`
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
              {slotLabel(bottomParticipant, teamNameFallback)}
            </div>
          </div>
          <div style={actionStyle(typedMatch.winnerSeed === bottomParticipant.seed)}>
            {typedMatch.winnerSeed === bottomParticipant.seed ? "W" : canPickBottom ? "Pick" : "-"}
          </div>
        </button>
      </div>

      <div style={{ minHeight: "1.1rem" }}>
        {editable && typedMatch.canPickWinner && typedMatch.winnerSeed !== null ? (
          <button
            disabled={busy}
            onClick={() => {
              void onPickWinner?.(typedMatch.metaRound, typedMatch.metaMatch, null);
            }}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              color: "#b9c6d5",
              fontFamily: "var(--font-display), sans-serif",
              fontSize: "0.62rem",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
            type="button"
          >
            Clear Winner
          </button>
        ) : !typedMatch.canPickWinner && !typedMatch.autoAdvanced && !typedMatch.winnerSeed ? (
          <span
            style={{
              color: "#7b8d9f",
              fontFamily: "var(--font-display), sans-serif",
              fontSize: "0.62rem",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Waiting For Matchup
          </span>
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
            <span className="tactical-chip text-[var(--text-secondary)]">{bracket.teamCount} teams</span>
            {bracket.championName ? (
              <span className="tactical-chip text-[var(--success)]">Champion: {bracket.championName}</span>
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
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            Powered by a tournament layout engine now, with the Valorant presentation layered on top.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="tactical-chip text-[var(--text-accent)]">
            {bracket.status.replaceAll("_", " ")}
          </span>
          <span className="tactical-chip text-[var(--text-secondary)]">
            {bracket.teamCount} teams
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
              connectorColor: "rgba(255, 179, 178, 0.28)",
              connectorColorHighlight: "rgba(255, 179, 178, 0.82)",
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
