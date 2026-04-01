"use client";

import Link from "next/link";
import type { BracketRecord } from "@/types/bracket";

interface PublicBracketCardProps {
  bracket: BracketRecord;
}

export function PublicBracketCard({ bracket }: PublicBracketCardProps) {
  return (
    <article className="bg-[var(--bg-panel-low)] px-5 py-5 md:px-6 md:py-6">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="tactical-chip text-[var(--text-accent)]">
            {bracket.status.replaceAll("_", " ")}
          </span>
          <span className="tactical-chip text-[var(--text-secondary)]">
            {bracket.teamCount} teams
          </span>
          {bracket.championName ? (
            <span className="tactical-chip text-[var(--success)]">
              {bracket.championName}
            </span>
          ) : null}
        </div>

        <div>
          <h3 className="font-display text-3xl font-black uppercase tracking-[-0.05em]">
            {bracket.title}
          </h3>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {bracket.rounds.length} round{bracket.rounds.length > 1 ? "s" : ""} generated
            automatically from the current team count.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
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
