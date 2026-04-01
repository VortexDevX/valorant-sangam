"use client";

import type { BracketMatchRecord, BracketRecord, BracketSlotRecord } from "@/types/bracket";

interface BracketBoardProps {
  bracket: BracketRecord;
  busy?: boolean;
  editable?: boolean;
  onEditTeamName?: (seed: number, name: string) => void;
  onPickWinner?: (round: number, match: number, winnerSeed: number | null) => Promise<void> | void;
}

function chunkMatches(matches: BracketMatchRecord[]) {
  const pairs: BracketMatchRecord[][] = [];

  for (let index = 0; index < matches.length; index += 2) {
    pairs.push(matches.slice(index, index + 2));
  }

  return pairs;
}

function getRoundGroupGap(roundIndex: number) {
  if (roundIndex === 0) {
    return "2.5rem";
  }

  if (roundIndex === 1) {
    return "7rem";
  }

  return "14rem";
}

function slotTone(match: BracketMatchRecord, slot: BracketSlotRecord | null) {
  if (!slot) {
    return "border-[rgba(214,191,129,0.12)] bg-[rgba(27,10,10,0.78)] text-[rgba(235,219,177,0.45)]";
  }

  if (slot.isBye) {
    return "border-[rgba(214,191,129,0.16)] bg-[rgba(27,10,10,0.62)] text-[rgba(235,219,177,0.45)]";
  }

  if (match.winnerSeed === slot.seed) {
    return "border-[rgba(214,191,129,0.72)] bg-[rgba(102,21,23,0.86)] text-[rgba(250,241,216,0.98)]";
  }

  return "border-[rgba(214,191,129,0.24)] bg-[rgba(27,10,10,0.82)] text-[rgba(250,241,216,0.88)]";
}

function TeamSlot({
  slot,
  match,
  editable,
  busy,
  onEditTeamName,
  onPickWinner,
}: {
  slot: BracketSlotRecord | null;
  match: BracketMatchRecord;
  editable: boolean;
  busy: boolean;
  onEditTeamName?: (seed: number, name: string) => void;
  onPickWinner?: (round: number, match: number, winnerSeed: number | null) => Promise<void> | void;
}) {
  const isFirstRoundInput =
    match.round === 1 &&
    !!onEditTeamName &&
    !!slot &&
    !slot.isBye &&
    typeof slot.seed === "number";
  const clickableWinner =
    editable &&
    !!onPickWinner &&
    match.canPickWinner &&
    !slot?.isBye &&
    typeof slot?.seed === "number";

  return (
    <div
      className={`grid min-h-[3.9rem] grid-cols-[minmax(0,1fr)_2.25rem] items-stretch border transition ${slotTone(
        match,
        slot,
      )} ${clickableWinner ? "hover:border-[rgba(214,191,129,0.85)]" : ""}`}
    >
      <div className="flex min-w-0 items-center px-3 py-2.5">
        {isFirstRoundInput ? (
          <input
            className="w-full bg-transparent font-display text-lg font-black uppercase tracking-[-0.04em] text-[inherit] outline-none placeholder:text-[rgba(235,219,177,0.35)]"
            disabled={busy}
            placeholder={`TEAM ${slot.seed}`}
            value={slot.name}
            onChange={(event) => onEditTeamName?.(slot.seed!, event.target.value)}
          />
        ) : (
          <div className="min-w-0">
            <div className="font-display text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(235,219,177,0.45)]">
              {slot?.isBye ? "bye" : slot?.seed ? `seed ${slot.seed}` : "pending"}
            </div>
            <div className="truncate font-display text-lg font-black uppercase tracking-[-0.04em]">
              {slot?.name || (slot ? "TBD" : "TBD")}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center border-l border-[rgba(214,191,129,0.2)]">
        {clickableWinner ? (
          <button
            className="flex h-full w-full items-center justify-center font-display text-xs font-black uppercase tracking-[0.06em] text-[rgba(214,191,129,0.75)] transition hover:bg-[rgba(214,191,129,0.12)] hover:text-[rgba(214,191,129,1)]"
            disabled={busy}
            onClick={() => {
              void onPickWinner?.(match.round, match.match, slot!.seed);
            }}
            type="button"
          >
            {match.winnerSeed === slot?.seed ? "W" : "-"}
          </button>
        ) : match.winnerSeed === slot?.seed ? (
          <span className="font-display text-xs font-black uppercase tracking-[0.06em] text-[rgba(214,191,129,0.95)]">
            W
          </span>
        ) : (
          <span className="font-display text-xs font-black uppercase tracking-[0.06em] text-[rgba(214,191,129,0.55)]">
            -
          </span>
        )}
      </div>
    </div>
  );
}

export function BracketBoard({
  bracket,
  busy = false,
  editable = false,
  onEditTeamName,
  onPickWinner,
}: BracketBoardProps) {
  return (
    <section className="relative overflow-hidden border border-[rgba(214,191,129,0.22)] bg-[linear-gradient(135deg,rgba(74,8,13,0.97),rgba(165,31,39,0.92)_45%,rgba(119,18,24,0.95))] px-5 py-5 md:px-6 md:py-6">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-16 top-10 h-72 w-72 rotate-[28deg] border border-[rgba(214,191,129,0.18)]" />
        <div className="absolute left-1/3 top-0 h-full w-px bg-[rgba(214,191,129,0.08)]" />
        <div className="absolute right-16 top-8 h-56 w-56 rotate-45 border border-[rgba(214,191,129,0.12)]" />
      </div>

      <div className="relative z-10 flex flex-col gap-4 border-b border-[rgba(214,191,129,0.12)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-[rgba(250,241,216,0.8)]">Bracket Board</p>
          <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-[-0.05em] text-[rgba(250,241,216,0.98)]">
            {bracket.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgba(250,241,216,0.74)]">
            Single-elimination tournament board. Fill round 1 first, then promote winners across the bracket.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="tactical-chip border border-[rgba(214,191,129,0.22)] bg-[rgba(27,10,10,0.34)] text-[rgba(250,241,216,0.92)]">
            {bracket.status.replaceAll("_", " ")}
          </span>
          <span className="tactical-chip border border-[rgba(214,191,129,0.22)] bg-[rgba(27,10,10,0.34)] text-[rgba(250,241,216,0.78)]">
            {bracket.teamCount} teams
          </span>
          {bracket.championName ? (
            <span className="tactical-chip border border-[rgba(214,191,129,0.4)] bg-[rgba(27,10,10,0.4)] text-[rgba(214,191,129,0.95)]">
              Champion: {bracket.championName}
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 mt-6 overflow-x-auto pb-2">
        <div className="flex min-w-max gap-8">
          {bracket.rounds.map((round, roundIndex) => (
            <section
              key={round.round}
              className="w-[296px] shrink-0"
              style={{ paddingTop: `${roundIndex * 2.75}rem` }}
            >
              <div className="mb-5 border-l-2 border-[rgba(214,191,129,0.55)] pl-3">
                <h3 className="font-display text-lg font-black uppercase tracking-[-0.04em] text-[rgba(250,241,216,0.96)]">
                  {round.label}
                </h3>
                <span className="font-display text-[0.68rem] uppercase tracking-[0.12em] text-[rgba(250,241,216,0.62)]">
                  {round.matches.length} match{round.matches.length > 1 ? "es" : ""}
                </span>
              </div>

              <div
                className="flex flex-col"
                style={{ gap: getRoundGroupGap(roundIndex) }}
              >
                {chunkMatches(round.matches).map((pair, pairIndex) => (
                  <div
                    key={`${round.round}-pair-${pairIndex}`}
                    className={`relative ${pair.length === 2 ? "grid grid-rows-2 gap-4" : ""}`}
                  >
                    {roundIndex < bracket.rounds.length - 1 && pair.length === 2 ? (
                      <>
                        <div className="absolute right-[-1rem] top-1/4 hidden h-px w-4 bg-[rgba(214,191,129,0.42)] xl:block" />
                        <div className="absolute right-[-1rem] top-3/4 hidden h-px w-4 bg-[rgba(214,191,129,0.42)] xl:block" />
                        <div className="absolute right-[-1rem] top-1/4 hidden h-1/2 w-px bg-[rgba(214,191,129,0.22)] xl:block" />
                        <div className="absolute right-[-2rem] top-1/2 hidden h-px w-4 bg-[rgba(214,191,129,0.42)] xl:block" />
                      </>
                    ) : null}

                    {pair.map((match) => (
                      <article
                        key={`${round.round}-${match.match}`}
                        className="relative overflow-visible"
                      >
                        <div className="space-y-2 bg-[rgba(22,7,8,0.18)] p-1.5">
                          <TeamSlot
                            busy={busy}
                            editable={editable}
                            match={match}
                            onEditTeamName={onEditTeamName}
                            onPickWinner={onPickWinner}
                            slot={match.top}
                          />
                          <TeamSlot
                            busy={busy}
                            editable={editable}
                            match={match}
                            onEditTeamName={onEditTeamName}
                            onPickWinner={onPickWinner}
                            slot={match.bottom}
                          />
                        </div>

                        <div className="mt-3 h-5">
                          {editable && match.canPickWinner && match.winnerSeed !== null ? (
                            <button
                              className="font-display text-[0.7rem] uppercase tracking-[0.12em] text-[rgba(250,241,216,0.76)] hover:text-[rgba(214,191,129,1)]"
                              disabled={busy}
                              onClick={() => {
                                void onPickWinner?.(match.round, match.match, null);
                              }}
                              type="button"
                            >
                              Clear winner
                            </button>
                          ) : !match.canPickWinner && !match.autoAdvanced && !match.isComplete ? (
                            <div className="font-display text-[0.7rem] uppercase tracking-[0.12em] text-[rgba(250,241,216,0.56)]">
                              Waiting for matchup
                            </div>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section
            className="flex w-[260px] shrink-0 items-center pl-2"
            style={{ paddingTop: `${Math.max(0, bracket.rounds.length - 1) * 2.75}rem` }}
          >
            <div className="w-full border border-[rgba(214,191,129,0.5)] bg-[rgba(27,10,10,0.72)] px-5 py-6 text-center">
              <div className="font-display text-[0.8rem] uppercase tracking-[0.12em] text-[rgba(214,191,129,0.88)]">
                Champion
              </div>
              <div className="mt-3 font-display text-2xl font-black uppercase tracking-[-0.05em] text-[rgba(250,241,216,0.98)]">
                {bracket.championName ?? "TBD"}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
