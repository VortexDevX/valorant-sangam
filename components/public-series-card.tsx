"use client";

import Link from "next/link";
import { MAP_LOOKUP } from "@/lib/map-pool";
import type { SeriesRecord } from "@/types/series";

interface PublicSeriesCardProps {
  series: SeriesRecord;
  compact?: boolean;
  focusTeamSlug?: string;
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

export function PublicSeriesCard({ series, compact = false, focusTeamSlug }: PublicSeriesCardProps) {
  return (
    <article className="bg-[var(--bg-panel-low)] px-5 py-5 md:px-6 md:py-6">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="tactical-chip text-[var(--text-accent)]">
            {getSeriesStatusLabel(series.status)}
          </span>
          <span className="tactical-chip text-[var(--text-secondary)]">
            {series.format}
          </span>
          {series.results.length > 0 ? (
            <span className="tactical-chip text-[var(--success)]">
              {series.overallScore.teamA}-{series.overallScore.teamB}
            </span>
          ) : null}
        </div>

        <div className="grid items-center gap-4 bg-[var(--bg-panel)] px-4 py-4 md:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] md:px-5">
          <Link
            className="min-w-0 font-display text-2xl font-black uppercase tracking-[-0.05em] transition hover:text-[var(--text-accent)] md:justify-self-end md:text-right md:text-3xl"
            href={`/team/${series.teamASlug}`}
          >
            {series.teamA}
          </Link>
          <span className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full border border-white/10 bg-[var(--bg-panel-high)] font-display text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] md:h-12 md:w-12 md:text-base">
            VS
          </span>
          <Link
            className="min-w-0 font-display text-2xl font-black uppercase tracking-[-0.05em] transition hover:text-[var(--text-accent)] md:justify-self-start md:text-3xl"
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
            {series.results.map((result) => (
              <div
                key={result.order}
                className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-panel)] px-4 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-[0.76rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Map {result.order}
                  </span>
                  <span className="font-display text-sm font-bold uppercase tracking-[0.08em] md:text-base">
                    {MAP_LOOKUP[result.map].label}
                  </span>
                </div>
                <span
                  className={`font-display text-base font-black uppercase tracking-[0.08em] md:text-lg ${getScoreTone(
                    series,
                    focusTeamSlug,
                    result.winner,
                  )}`}
                >
                  {result.score}
                </span>
              </div>
            ))}
          </div>
        ) : compact ? null : (
          <div className="status-info">No map results added yet.</div>
        )}
      </div>
    </article>
  );
}
