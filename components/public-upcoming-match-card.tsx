"use client";

import Link from "next/link";
import { MAP_LOOKUP } from "@/lib/map-pool";
import type { NextSeriesMap, SeriesRecord } from "@/types/series";

function getSideAssignments(series: SeriesRecord, mapSlot: NextSeriesMap) {
  if (!mapSlot.startingSide || !mapSlot.sideChosenBy) {
    return null;
  }

  const chooser = mapSlot.sideChosenBy === "teamA" ? series.teamA : series.teamB;
  const opponent = mapSlot.sideChosenBy === "teamA" ? series.teamB : series.teamA;

  return mapSlot.startingSide === "atk"
    ? { atk: chooser, def: opponent }
    : { atk: opponent, def: chooser };
}

export function PublicUpcomingMatchCard({
  series,
  mapSlot,
}: {
  series: SeriesRecord;
  mapSlot: NextSeriesMap;
}) {
  const sides = getSideAssignments(series, mapSlot);

  return (
    <article className="bg-[var(--bg-panel-low)] px-5 py-5 md:px-6 md:py-6">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="tactical-chip text-[var(--text-accent)]">
            Next match
          </span>
          <span className="tactical-chip text-[var(--text-secondary)]">
            Map {mapSlot.order}
          </span>
          <span className="tactical-chip text-[var(--text-secondary)]">
            {MAP_LOOKUP[mapSlot.map].label}
          </span>
        </div>

        <div className="bg-[var(--bg-panel)] px-4 py-4 md:px-5">
          <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)]">
            <Link
              className="min-w-0 font-display text-3xl font-black uppercase tracking-[-0.05em] transition hover:text-[var(--text-accent)] md:text-right"
              href={`/team/${series.teamASlug}`}
            >
              {series.teamA}
            </Link>
            <span className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full border border-white/8 bg-[var(--bg-panel-lowest)] font-display text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] md:h-12 md:w-12 md:text-base">
              VS
            </span>
            <Link
              className="min-w-0 font-display text-3xl font-black uppercase tracking-[-0.05em] transition hover:text-[var(--text-accent)]"
              href={`/team/${series.teamBSlug}`}
            >
              {series.teamB}
            </Link>
          </div>
          {mapSlot.isDecider ? (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Decider map</p>
          ) : (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Picked by {mapSlot.pickedBy === "teamA" ? series.teamA : series.teamB}
            </p>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="bg-[var(--bg-panel)] px-4 py-4">
            <div className="font-display text-[0.68rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              ATK
            </div>
            <div className="mt-2 font-display text-xl font-black uppercase tracking-[-0.04em]">
              {sides?.atk ?? "Pending"}
            </div>
          </div>
          <div className="bg-[var(--bg-panel)] px-4 py-4">
            <div className="font-display text-[0.68rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              DEF
            </div>
            <div className="mt-2 font-display text-xl font-black uppercase tracking-[-0.04em]">
              {sides?.def ?? "Pending"}
            </div>
          </div>
        </div>

      </div>
    </article>
  );
}
