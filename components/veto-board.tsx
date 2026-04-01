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
  onApply: (payload: { map?: MapId; side?: StartingSide }) => Promise<void>;
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
      sizes="(max-width: 1280px) 100vw, 320px"
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

  return (
    <div className="space-y-6">
      <section className="panel px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Live Veto</p>
            <h2 className="mt-2 text-2xl font-bold uppercase tracking-[-0.04em]">
              {session.teamA} vs {session.teamB}
            </h2>
          </div>
          <div className="panel-soft px-4 py-3 text-right">
            <p className="label !mb-1">Format</p>
            <p className="mono text-lg uppercase">{session.format}</p>
          </div>
        </div>

        <div className="status-info mt-5">{instruction}</div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {session.mapPool.map((mapId) => {
            const mapMeta = MAP_LOOKUP[mapId];
            const state = mapState(mapMeta.id, derived);
            const clickable =
              canChooseMap &&
              state === "available" &&
              nextStep &&
              !busy;

            return (
              <button
                key={mapMeta.id}
                className={`panel-soft overflow-hidden text-left transition ${
                  clickable ? "opacity-100" : "cursor-default opacity-70"
                }`}
                disabled={!clickable}
                onClick={() => onApply({ map: mapMeta.id })}
                type="button"
              >
                <div className="relative h-40">
                  <MapPreview alt={mapMeta.label} src={mapMeta.imagePath} />
                </div>
                <div className="space-y-2 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-bold uppercase tracking-[-0.04em]">
                      {mapMeta.label}
                    </span>
                    <span
                      className={`mono text-xs uppercase ${
                        state === "available"
                          ? "text-[var(--success)]"
                          : state === "picked"
                            ? "text-[var(--text-primary)]"
                            : state === "decider"
                              ? "text-[var(--bg-accent)]"
                              : "text-[var(--text-muted)]"
                      }`}
                    >
                      {state}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {nextStep?.type === "decider" ? (
          <div className="mt-5">
            <button
              className="button-primary"
              disabled={busy}
              onClick={() => onApply({})}
              type="button"
            >
              {busy ? "Saving..." : "Confirm Decider"}
            </button>
          </div>
        ) : null}

        {nextStep?.type === "side" ? (
          <div className="mt-5 flex gap-3">
            <button
              className="button-primary"
              disabled={busy}
              onClick={() => onApply({ side: "atk" })}
              type="button"
            >
              {busy ? "Saving..." : "ATK"}
            </button>
            <button
              className="button-secondary"
              disabled={busy}
              onClick={() => onApply({ side: "def" })}
              type="button"
            >
              DEF
            </button>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="panel px-5 py-5">
          <p className="eyebrow">Result Summary</p>
          <div className="mt-4 space-y-3">
            {derived.result.maps.length === 0 ? (
              <div className="empty-state">No maps have been locked yet.</div>
            ) : (
              derived.result.maps.map((mapResult) => (
                <div
                  key={`${mapResult.order}-${mapResult.map}`}
                  className="panel-soft grid gap-3 px-4 py-4 md:grid-cols-[auto_1fr]"
                >
                  <div className="mono text-sm text-[var(--text-secondary)]">
                    MAP {mapResult.order}
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold uppercase tracking-[-0.04em]">
                      {MAP_LOOKUP[mapResult.map].label}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {mapResult.isDecider
                        ? "Decider map"
                        : `Picked by ${teamLabel(session, mapResult.pickedBy ?? "teamA")}`}
                      {mapResult.startingSide && mapResult.sideChosenBy
                        ? ` | ${teamLabel(session, mapResult.sideChosenBy)} chose ${mapResult.startingSide.toUpperCase()}`
                        : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel px-5 py-5">
          <p className="eyebrow">Timeline</p>
          <div className="mt-4 space-y-3">
            {session.actions.length === 0 ? (
              <div className="empty-state">Veto timeline will appear here.</div>
            ) : (
              session.actions.map((action, index) => (
                <div
                  key={`${action.step}-${action.createdAt}`}
                  className="panel-soft px-4 py-4 text-sm text-[var(--text-secondary)]"
                >
                  <span className="mono text-xs text-[var(--text-muted)]">
                    STEP {action.step}
                  </span>
                  <p className="mt-2 text-[var(--text-primary)]">
                    {timelineText(session, index)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
