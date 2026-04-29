import Link from "next/link";
import type { BracketContinuationResolution } from "@/types/bracket";

interface BracketAuditTrailProps {
  resolutions: BracketContinuationResolution[];
}

export function BracketAuditTrail({ resolutions }: BracketAuditTrailProps) {
  if (resolutions.length === 0) {
    return null;
  }

  const sorted = [...resolutions].sort((a, b) =>
    (b.resolvedAt ?? "").localeCompare(a.resolvedAt ?? ""),
  );

  return (
    <section className="panel space-y-5 px-6 py-6 md:px-8 md:py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Audit Trail</p>
          <h3 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.05em]">
            Continuation History
          </h3>
        </div>
        <span className="tactical-chip text-[var(--text-secondary)]">
          {resolutions.length} {resolutions.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="space-y-3">
        {sorted.map((entry) => (
          <article
            key={`${entry.round}-${entry.match}-${entry.seriesId}`}
            className="panel-soft space-y-3 px-5 py-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="tactical-chip text-[var(--text-accent)]">
                Round {entry.round}
              </span>
              <span className="tactical-chip text-[var(--text-secondary)]">
                Match {entry.match}
              </span>
              <span className="tactical-chip text-[var(--success)]">
                {entry.winnerName}
              </span>
              <span className="tactical-chip text-[var(--text-secondary)]">
                {entry.scoreline}
              </span>
            </div>
            <div className="space-y-1.5 text-sm leading-7 text-[var(--text-secondary)]">
              <div>
                Resolved via manual series{" "}
                <Link
                  className="text-[var(--text-primary)] underline decoration-white/20 underline-offset-4 hover:decoration-white/50"
                  href={`/admin/series/${entry.seriesId}`}
                >
                  {entry.seriesId}
                </Link>
              </div>
              {entry.note ? <div>{entry.note}</div> : null}
              {entry.resolvedAt ? (
                <div className="mono text-xs text-[var(--text-muted)]">
                  Resolved{" "}
                  {new Date(entry.resolvedAt).toLocaleString("en-IN")}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
