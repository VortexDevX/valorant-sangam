"use client";

import Link from "next/link";
import type { BracketRecord } from "@/types/bracket";

interface PublicBracketCardProps {
  bracket: BracketRecord;
}

export function PublicBracketCard({ bracket }: PublicBracketCardProps) {
  return (
    <article className="public-card public-card--bracket min-h-[18rem] px-4 py-4 sm:px-5 sm:py-5 md:min-h-[19rem] md:px-6 md:py-6">
      <div className="public-card-shell">
        <div className="flex flex-wrap items-center gap-3">
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
              {bracket.championName}
            </span>
          ) : null}
        </div>

        <div>
          <h3 className="break-words font-display text-2xl font-black uppercase leading-none tracking-[-0.05em] sm:text-3xl">
            {bracket.title}
          </h3>
          <p className="public-card-copy mt-3">
            {bracket.rounds.length} round{bracket.rounds.length > 1 ? "s" : ""} generated
            automatically from the current team count.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-[0.72rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {bracket.rounds[0]?.matches.length ?? 0} opening matches
          </span>
          <Link className="button-secondary" href={`/brackets/${bracket._id}`}>
            View Bracket
          </Link>
        </div>
      </div>
    </article>
  );
}
