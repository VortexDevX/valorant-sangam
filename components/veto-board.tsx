"use client";

import Image from "next/image";
import { useState } from "react";
import { MAP_LOOKUP, type MapId } from "@/lib/map-pool";
import type {
  DerivedVetoState,
  StartingSide,
  TeamSlot,
  VetoSessionRecord,
  VetoStepDefinition,
} from "@/types/veto";

interface VetoBoardProps {
  session: VetoSessionRecord;
  derived: DerivedVetoState;
  busy: boolean;
  onApply: (payload: { map?: MapId; side?: StartingSide; undo?: boolean }) => Promise<void>;
}

function MapPreview({ alt, src }: { alt: string; src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0f1419] px-4 text-center">
        <span className="mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Asset pending
        </span>
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className="object-cover"
      fill
      onError={() => setFailed(true)}
      quality={56}
      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
      src={src}
    />
  );
}

function teamLabel(session: VetoSessionRecord, team: TeamSlot) {
  return team === "teamA" ? session.teamA : session.teamB;
}

function buildInstruction(
  session: VetoSessionRecord,
  nextStep: VetoStepDefinition | null,
  derived: DerivedVetoState,
) {
  if (!nextStep) {
    return "Veto complete.";
  }

  if (nextStep.type === "ban") {
    return `${teamLabel(session, nextStep.team as TeamSlot)} ban a map`;
  }

  if (nextStep.type === "pick") {
    return `${teamLabel(session, nextStep.team as TeamSlot)} pick map ${nextStep.order}`;
  }

  if (nextStep.type === "decider") {
    return `Confirm ${MAP_LOOKUP[derived.availableMaps[0]].label} as the decider map`;
  }

  const targetMap = derived.result.maps.find((map) => map.order === nextStep.order);
  const label = targetMap ? MAP_LOOKUP[targetMap.map].label : `map ${nextStep.order}`;

  return `${teamLabel(session, nextStep.team as TeamSlot)} choose starting side for ${label}`;
}

function mapState(
  mapId: MapId,
  derived: DerivedVetoState,
): "available" | "banned" | "picked" | "decider" {
  const resultMap = derived.result.maps.find((map) => map.map === mapId);

  if (resultMap?.isDecider) {
    return "decider";
  }

  if (resultMap) {
    return "picked";
  }

  if (derived.availableMaps.includes(mapId)) {
    return "available";
  }

  return "banned";
}

function timelineText(session: VetoSessionRecord, index: number) {
  const action = session.actions[index];

  if (action.team === "system" && action.type === "decider" && action.map) {
    return `Decider set to ${MAP_LOOKUP[action.map].label}`;
  }

  if (action.type === "side" && action.map && action.side) {
    const teamName = action.team === "teamA" ? session.teamA : session.teamB;
    return `${teamName} chose ${action.side.toUpperCase()} on ${MAP_LOOKUP[action.map].label}`;
  }

  if (action.map) {
    const teamName = action.team === "teamA" ? session.teamA : session.teamB;

    if (action.type === "ban") {
      return `${teamName} banned ${MAP_LOOKUP[action.map].label}`;
    }

    if (action.type === "pick") {
      return `${teamName} picked ${MAP_LOOKUP[action.map].label}`;
    }
  }

  return `Step ${action.step}`;
}

export function VetoBoard({
  session,
  derived,
  busy,
  onApply,
}: VetoBoardProps) {
  const nextStep = derived.nextStep;
  const instruction = buildInstruction(session, nextStep, derived);
  const canChooseMap = nextStep?.type === "ban" || nextStep?.type === "pick";
  const sideTargetMap =
    nextStep?.type === "side"
      ? derived.result.maps.find((map) => map.order === nextStep.order)
      : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex items-center justify-between bg-[var(--bg-accent-soft)] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-pulse bg-[var(--bg-accent)]" />
          <span className="font-display text-xs font-bold uppercase tracking-[0.2em]">
            {instruction}
          </span>
        </div>
        <span className="font-display text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--text-accent)]">
          {session.format}
        </span>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Live Veto</p>
              <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-[-0.06em]">
                {session.teamA} vs {session.teamB}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              {session.actions.length > 0 && !derived.isComplete ? (
                <button
                  className="button-secondary flex items-center gap-2 border-[var(--bg-accent)] !text-[var(--bg-accent)] hover:!bg-[var(--bg-accent)] hover:!text-white"
                  disabled={busy}
                  onClick={() => onApply({ undo: true })}
                  type="button"
                >
                  <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  {busy ? "Undoing..." : "Undo Last Action"}
                </button>
              ) : null}
              <div className="tactical-chip text-[var(--text-secondary)]">
                Selected Pool: {session.mapPool.length}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {session.mapPool.map((mapId) => {
              const mapMeta = MAP_LOOKUP[mapId];
              const state = mapState(mapMeta.id, derived);
              const isSideTarget = sideTargetMap?.map === mapMeta.id;
              const clickable =
                canChooseMap &&
                state === "available" &&
                nextStep &&
                !busy;
              const isDeciderTarget =
                nextStep?.type === "decider" &&
                derived.availableMaps.length === 1 &&
                derived.availableMaps[0] === mapMeta.id;
              const tileClasses = `group relative overflow-hidden text-left ${
                clickable ? "cursor-crosshair" : "cursor-default"
              }`;
              const tileBody = (
                <div
                  className={`relative h-40 overflow-hidden ${
                    state === "picked"
                      ? "ring-2 ring-[var(--success)]"
                      : state === "decider" || isDeciderTarget
                        ? "ring-2 ring-[var(--bg-accent)]"
                        : isSideTarget
                          ? "ring-2 ring-[var(--text-accent)]"
                          : "ring-1 ring-white/10"
                  }`}
                >
                  <MapPreview alt={mapMeta.label} src={mapMeta.imagePath} />
                  <div
                    className={`absolute inset-0 ${
                      state === "banned"
                        ? "bg-[rgba(5,15,25,0.82)]"
                        : state === "picked"
                          ? "bg-[rgba(18,164,125,0.18)]"
                          : state === "decider" || isDeciderTarget
                            ? "bg-[rgba(255,70,85,0.18)]"
                            : "bg-gradient-to-t from-black/75 to-transparent"
                    }`}
                  />

                  {state === "banned" ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                       <span className="font-display text-5xl font-light text-[var(--bg-accent)]">
                        ×
                      </span>
                    </div>
                  ) : null}

                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`font-display text-[0.62rem] font-black uppercase tracking-[0.18em] ${
                          state === "picked"
                            ? "text-[var(--success)]"
                            : state === "decider"
                              ? "text-[var(--text-accent)]"
                              : state === "banned"
                                ? "text-[var(--bg-accent)]"
                                : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {state}
                      </span>
                      <span className="font-display text-xs font-black uppercase tracking-[0.12em] text-white">
                        {mapMeta.label}
                      </span>
                    </div>
                  </div>

                  {isSideTarget ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[rgba(5,15,25,0.9)] px-4">
                      <span className="font-display text-[0.58rem] font-black uppercase tracking-[0.22em] text-[var(--text-accent)]">
                        Side Selection
                      </span>
                      <div className="flex w-full gap-2">
                        <button
                          className="flex-1 bg-white px-3 py-2 font-display text-[0.72rem] font-black uppercase tracking-[0.16em] text-[var(--bg-app)]"
                          disabled={busy}
                          onClick={(event) => {
                            event.stopPropagation();
                            void onApply({ side: "atk" });
                          }}
                          type="button"
                        >
                          ATK
                        </button>
                        <button
                          className="flex-1 bg-[var(--bg-panel-high)] px-3 py-2 font-display text-[0.72rem] font-black uppercase tracking-[0.16em] text-white"
                          disabled={busy}
                          onClick={(event) => {
                            event.stopPropagation();
                            void onApply({ side: "def" });
                          }}
                          type="button"
                        >
                          DEF
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );

              if (clickable) {
                return (
                  <button
                    key={mapMeta.id}
                    className={tileClasses}
                    onClick={() => onApply({ map: mapMeta.id })}
                    type="button"
                  >
                    {tileBody}
                  </button>
                );
              }

              if (isSideTarget) {
                return (
                  <div key={mapMeta.id} className={tileClasses}>
                    {tileBody}
                  </div>
                );
              }

              return (
                <div key={mapMeta.id} className={tileClasses}>
                  {tileBody}
                </div>
              );
            })}
          </div>

          {nextStep?.type === "decider" ? (
            <div className="flex flex-wrap justify-start gap-3">
              <button
                className="button-primary"
                disabled={busy || nextStep?.type !== "decider"}
                onClick={() => onApply({})}
                type="button"
              >
                {busy ? "Saving..." : "Confirm Decider"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <section className="bg-[var(--bg-panel-low)]">
            <div className="flex items-center gap-2 bg-[var(--bg-panel-high)] px-4 py-3">
              <span className="tactical-accent h-2 w-2 !h-2 !w-2" />
              <h3 className="font-display text-[0.68rem] font-bold uppercase tracking-[0.22em]">
                Protocol_Logs
              </h3>
            </div>
            <div className="tactical-scroll max-h-72 space-y-3 overflow-y-auto px-4 py-4">
              {session.actions.length === 0 ? (
                <div className="text-sm text-[var(--text-secondary)]">
                  Waiting for first veto action.
                </div>
              ) : (
                session.actions.map((action, index) => (
                  <div
                    key={`${action.step}-${action.createdAt}`}
                    className="flex items-start gap-4 text-[0.72rem]"
                  >
                    <span className="mono shrink-0 text-[var(--text-muted)]">
                      STEP {String(action.step).padStart(2, "0")}
                    </span>
                    <p className="leading-6 text-[var(--text-primary)]">
                      {timelineText(session, index)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bg-[var(--bg-accent)] px-5 py-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-black uppercase tracking-[0.22em] text-white">
                Final_Pool
              </h3>
              <span className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-white/70">
                Match Confirmed
              </span>
            </div>

            <div className="mt-4 grid auto-rows-fr grid-cols-2 gap-2 md:grid-cols-3">
              {derived.result.maps.length === 0 ? (
                <div className="col-span-full bg-white/10 px-4 py-4 text-sm text-white/80">
                  Final maps will populate here as the veto progresses.
                </div>
              ) : (
                derived.result.maps.map((mapResult) => (
                  <div
                    key={`${mapResult.order}-${mapResult.map}`}
                    className="flex min-h-32 flex-col justify-between border border-white/20 bg-[rgba(91,0,15,0.15)] px-3 py-3 text-center"
                  >
                    <div className="font-display text-[0.55rem] uppercase tracking-[0.18em] text-white/65">
                      Map {String(mapResult.order).padStart(2, "0")}
                    </div>
                    <div className="flex min-h-[2.6rem] items-center justify-center font-display text-[0.8rem] font-black uppercase leading-tight tracking-[0.12em] text-white">
                      {MAP_LOOKUP[mapResult.map].label}
                    </div>
                    <div className="font-display text-[0.55rem] uppercase tracking-[0.18em] text-white/75">
                      {mapResult.startingSide ?? "pending"}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <p className="font-display text-[0.55rem] font-bold uppercase tracking-[0.2em] text-white/70">
                  Match Confirmed
                </p>
                <p className="font-display text-xl font-black uppercase tracking-[-0.05em] text-white">
                  {session.teamA} vs {session.teamB}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="font-display text-[0.55rem] font-bold uppercase tracking-[0.2em] text-white/70">
                  Format
                </p>
                <p className="font-display text-sm font-black uppercase tracking-[0.16em] text-white">
                  {session.format}
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
