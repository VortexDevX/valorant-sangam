"use client";

import Image from "next/image";
import Link from "next/link";
import { MAP_LOOKUP } from "@/lib/map-pool";
import { createBracketSeriesSummary, getNextSeriesMap } from "@/lib/series";
import type { SeriesRecord } from "@/types/series";

interface PublicSeriesCardProps {
  series: SeriesRecord;
  compact?: boolean;
  focusTeamSlug?: string;
  withMapBackdrop?: boolean;
}

function getScoreTone(series: SeriesRecord, focusTeamSlug: string | undefined, winner: SeriesRecord["results"][number]["winner"]) {
  if (!focusTeamSlug) {
    return "text-[var(--text-accent)]";
  }

  const focusSlot = focusTeamSlug === series.teamASlug ? "teamA" : focusTeamSlug === series.teamBSlug ? "teamB" : null;

  if (!focusSlot) {
    return "text-[var(--text-accent)]";
  }

  return winner === focusSlot ? "text-[var(--success)]" : "text-[var(--bg-accent)]";
}

function getSeriesStatusLabel(status: SeriesRecord["status"]) {
  switch (status) {
    case "scheduled":
      return "upcoming";
    case "veto_in_progress":
      return "veto in progress";
    case "veto_completed":
      return "ready for results";
    case "completed":
      return "completed";
    default:
      return String(status).replaceAll("_", " ");
  }
}

export function PublicSeriesCard({
  series,
  compact = false,
  focusTeamSlug,
  withMapBackdrop = false,
}: PublicSeriesCardProps) {
  const visibleResults = compact ? series.results.slice(0, 2) : series.results;
  const backdropMap =
    getNextSeriesMap(series)?.map ??
    series.results[series.results.length - 1]?.map ??
    series.veto?.result.maps[0]?.map ??
    null;

  return (
    <article className="public-card public-card--series px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6">
      {withMapBackdrop && compact && backdropMap ? (
        <>
          <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
            <Image
              alt={MAP_LOOKUP[backdropMap].label}
              className="h-full w-full object-cover"
              fill
              quality={48}
              sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 33vw"
              src={MAP_LOOKUP[backdropMap].imagePath}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,15,25,0.56),rgba(5,15,25,0.88)_34%,rgba(5,15,25,0.96))]" />
        </>
      ) : null}
      <div className="public-card-shell">
        <div className="flex flex-wrap items-center gap-3">
          <span className="tactical-chip text-[var(--text-accent)]">
            {getSeriesStatusLabel(series.status)}
          </span>
          <span className="tactical-chip text-[var(--text-secondary)]">
            {series.format}
          </span>
          {series.bracket ? (
            <span className="tactical-chip text-[var(--text-secondary)]">
              {createBracketSeriesSummary(series)}
            </span>
          ) : null}
          {series.results.length > 0 ? (
            <span className="tactical-chip text-[var(--success)]">
              {series.overallScore.teamA}-{series.overallScore.teamB}
            </span>
          ) : null}
        </div>

        <div className="grid items-center justify-items-center gap-3 bg-[var(--bg-panel)] px-4 py-4 text-center md:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] md:justify-items-stretch md:px-5 md:text-left">
          <Link
            className={`min-w-0 break-words font-display font-black uppercase leading-none tracking-[-0.05em] transition hover:text-[var(--text-accent)] md:justify-self-end md:text-right ${compact ? "text-lg sm:text-xl md:text-2xl" : "text-xl sm:text-2xl md:text-3xl"}`}
            href={`/team/${series.teamASlug}`}
          >
            {series.teamA}
          </Link>
          <span className="my-1 flex h-10 w-10 items-center justify-center justify-self-center rounded-full border border-white/8 bg-[var(--bg-panel-lowest)] font-display text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] md:my-0 md:h-12 md:w-12 md:text-base">
            VS
          </span>
          <Link
            className={`min-w-0 break-words font-display font-black uppercase leading-none tracking-[-0.05em] transition hover:text-[var(--text-accent)] md:justify-self-start ${compact ? "text-lg sm:text-xl md:text-2xl" : "text-xl sm:text-2xl md:text-3xl"}`}
            href={`/team/${series.teamBSlug}`}
          >
            {series.teamB}
          </Link>
        </div>

        {series.veto?.status === "completed" ? (
          <div className="flex flex-wrap gap-2">
            {series.veto.result.maps.map((map) => (
              <span key={map.order} className="tactical-chip text-[var(--text-secondary)]">
                {map.order}. {MAP_LOOKUP[map.map].label}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">
            Map veto is not finished yet.
          </p>
        )}

        {series.results.length > 0 ? (
          <div className="space-y-2">
            {visibleResults.map((result) => (
              <div
                key={result.order}
                className="flex flex-col gap-2 bg-[var(--bg-panel)] px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="font-display text-[0.76rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Map {result.order}
                  </span>
                  <span className="font-display text-sm font-bold uppercase tracking-[0.08em] md:text-base">
                    {MAP_LOOKUP[result.map].label}
                  </span>
                </div>
                <span
                  className={`font-display text-sm font-black uppercase tracking-[0.08em] sm:text-base md:text-lg ${getScoreTone(
                    series,
                    focusTeamSlug,
                    result.winner,
                  )}`}
                >
                  {result.score}
                </span>
              </div>
            ))}
            {compact && series.results.length > visibleResults.length ? (
              <div className="font-display text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                +{series.results.length - visibleResults.length} more result{series.results.length - visibleResults.length > 1 ? "s" : ""}
              </div>
            ) : null}
          </div>
        ) : compact ? null : (
          <div className="status-info">No map results added yet.</div>
        )}
      </div>
    </article>
  );
}
