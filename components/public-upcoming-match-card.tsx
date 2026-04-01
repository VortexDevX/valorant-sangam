"use client";

import Image from "next/image";
import Link from "next/link";
import { MAP_LOOKUP } from "@/lib/map-pool";
import { createBracketSeriesSummary } from "@/lib/series";
import type { NextSeriesMap, SeriesRecord } from "@/types/series";

function getSideAssignments(series: SeriesRecord, mapSlot: NextSeriesMap) {
  if (!mapSlot.startingSide || !mapSlot.sideChosenBy) {
    return null;
  }

  const chooser =
    mapSlot.sideChosenBy === "teamA" ? series.teamA : series.teamB;
  const opponent =
    mapSlot.sideChosenBy === "teamA" ? series.teamB : series.teamA;

  return mapSlot.startingSide === "atk"
    ? { atk: chooser, def: opponent }
    : { atk: opponent, def: chooser };
}

export function PublicUpcomingMatchCard({
  series,
  mapSlot,
  withMapBackdrop = false,
}: {
  series: SeriesRecord;
  mapSlot: NextSeriesMap;
  withMapBackdrop?: boolean;
}) {
  const sides = getSideAssignments(series, mapSlot);
  const sideChooser =
    mapSlot.sideChosenBy === "teamA"
      ? series.teamA
      : mapSlot.sideChosenBy === "teamB"
        ? series.teamB
        : null;

  return (
    <article className="public-card public-card--upcoming group px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6">
      {withMapBackdrop ? (
        <>
          <div className="pointer-events-none absolute inset-0 opacity-[0.72]">
            <Image
              alt={MAP_LOOKUP[mapSlot.map].label}
              className="h-full w-full object-cover"
              fill
              quality={48}
              sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 33vw"
              src={MAP_LOOKUP[mapSlot.map].imagePath}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,10,20,0.34),rgba(10,20,30,0.66)_42%,rgba(10,20,30,0.86))]" />
        </>
      ) : null}
      <div className="public-card-shell">
        <div className="flex flex-wrap items-center gap-3">
          <span className="tactical-chip text-(--text-accent)">Next match</span>
          <span className="tactical-chip text-(--text-secondary)">
            Map {mapSlot.order}
          </span>
          <span className="tactical-chip text-(--text-secondary)">
            {MAP_LOOKUP[mapSlot.map].label}
          </span>
          {series.bracket ? (
            <span className="tactical-chip text-(--text-secondary)">
              {createBracketSeriesSummary(series)}
            </span>
          ) : null}
        </div>

        <div className="relative overflow-hidden border border-[rgba(255,70,85,0.14)] bg-[linear-gradient(180deg,rgba(255,70,85,0.08),transparent_28%),linear-gradient(145deg,rgba(255,255,255,0.02),rgba(8,13,19,0.24)),var(--bg-panel)] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-5 md:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.03),transparent_26%)]" />
          <div className="pointer-events-none absolute left-0 top-0 h-16 w-16 border-l border-t border-[rgba(255,70,85,0.18)]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-16 w-16 border-b border-r border-[rgba(255,70,85,0.12)]" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.08),transparent)] md:block" />
          <div className="relative grid items-center justify-items-center gap-3 text-center md:grid-cols-[minmax(0,1fr)_5.25rem_minmax(0,1fr)] md:justify-items-stretch md:text-left">
            <Link
              className="min-w-0 wrap-break-word font-display text-2xl font-black uppercase leading-none tracking-[-0.05em] text-white transition hover:text-(--text-accent) sm:text-3xl md:text-right"
              href={`/team/${series.teamASlug}`}
            >
              {series.teamA}
            </Link>
            <span className="my-1 flex h-12 w-12 items-center justify-center justify-self-center rounded-full border border-[rgba(255,70,85,0.16)] bg-[radial-gradient(circle_at_top,rgba(255,70,85,0.18),rgba(5,15,25,0.98))] font-display text-sm font-black uppercase tracking-[0.08em] text-(--text-accent) shadow-[0_0_0_8px_rgba(5,15,25,0.42)] md:my-0 md:h-16 md:w-16 md:text-lg">
              VS
            </span>
            <Link
              className="min-w-0 wrap-break-word font-display text-2xl font-black uppercase leading-none tracking-[-0.05em] text-white transition hover:text-(--text-accent) sm:text-3xl"
              href={`/team/${series.teamBSlug}`}
            >
              {series.teamB}
            </Link>
          </div>
          <div className="relative mt-4 flex flex-wrap items-center justify-center gap-2 text-center text-[0.68rem] sm:gap-3 sm:text-[0.72rem] md:justify-start md:text-left">
            <span className="font-display uppercase tracking-[0.14em] text-(--text-accent) sm:tracking-[0.16em]">
              {mapSlot.isDecider
                ? "Decider map"
                : `Picked by ${mapSlot.pickedBy === "teamA" ? series.teamA : series.teamB}`}
            </span>
            {sideChooser ? (
              <span className="font-display uppercase tracking-[0.14em] text-(--text-secondary) sm:tracking-[0.16em]">
                Side choice by {sideChooser}
              </span>
            ) : (
              <span className="font-display uppercase tracking-[0.14em] text-(--text-muted) sm:tracking-[0.16em]">
                Side selection pending
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="overflow-hidden border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_42%),var(--bg-panel)] px-4 py-4">
            <div className="mb-3 h-0.5 w-10 bg-[rgba(255,255,255,0.18)]" />
            <div className="font-display text-[0.68rem] font-bold uppercase tracking-[0.16em] text-(--text-secondary)">
              ATK
            </div>
            <div className="mt-3 wrap-break-word font-display text-lg font-black uppercase tracking-[-0.04em] text-white sm:text-xl">
              {sides?.atk ?? "Pending"}
            </div>
          </div>
          <div className="overflow-hidden border border-[rgba(255,70,85,0.14)] bg-[linear-gradient(180deg,rgba(255,70,85,0.09),transparent_42%),var(--bg-panel)] px-4 py-4">
            <div className="mb-3 h-0.5 w-10 bg-(--bg-accent)" />
            <div className="font-display text-[0.68rem] font-bold uppercase tracking-[0.16em] text-(--text-accent)">
              DEF
            </div>
            <div className="mt-3 wrap-break-word font-display text-lg font-black uppercase tracking-[-0.04em] text-white sm:text-xl">
              {sides?.def ?? "Pending"}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
