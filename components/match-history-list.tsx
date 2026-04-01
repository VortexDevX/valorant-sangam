import Image from "next/image";
import { MAP_LOOKUP } from "@/lib/map-pool";
import type { MatchRecord } from "@/types/match";

interface MatchHistoryListProps {
  matches: MatchRecord[];
  onEdit?: (match: MatchRecord) => void;
  onDelete?: (match: MatchRecord) => void;
  deletingId?: string | null;
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function MatchHistoryList({
  matches,
  onEdit,
  onDelete,
  deletingId,
}: MatchHistoryListProps) {
  const adminMode = Boolean(onEdit || onDelete);

  if (matches.length === 0) {
    return (
      <div className="empty-state">
        {adminMode
          ? "No match records have been deployed yet."
          : "No completed matches have been added yet."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        adminMode ? (
          <article
            key={match._id}
            className="group bg-[var(--bg-panel)] p-4 transition-colors hover:bg-[var(--bg-panel-high)]"
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="hidden h-12 w-12 flex-col items-center justify-center bg-[var(--bg-panel-lowest)] md:flex">
                  <span className="font-display text-[0.55rem] font-bold uppercase tracking-[0.16em] text-[var(--bg-accent)]">
                    REC
                  </span>
                  <span className="mt-1 h-1.5 w-1.5 bg-[var(--bg-accent)]" />
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg font-bold uppercase tracking-[-0.04em]">
                      {match.teamA}
                    </span>
                    <span className="font-display text-[0.65rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      vs
                    </span>
                    <span className="font-display text-lg font-bold uppercase tracking-[-0.04em]">
                      {match.teamB}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-4">
                    <span className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      Map: {MAP_LOOKUP[match.map].label}
                    </span>
                    <span className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-accent)]">
                      Score: {match.score}
                    </span>
                    <span className="mono text-[0.7rem] text-[var(--text-muted)]">
                      {formatTimestamp(match.createdAt)}
                    </span>
                  </div>
                  {match.note ? (
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                      {match.note}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                {onEdit ? (
                  <button
                    className="button-secondary"
                    onClick={() => onEdit(match)}
                    type="button"
                  >
                    Edit
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    className="button-danger"
                    disabled={deletingId === match._id}
                    onClick={() => onDelete(match)}
                    type="button"
                  >
                    {deletingId === match._id ? "Deleting..." : "Delete"}
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ) : (
          <article
            key={match._id}
            className="group overflow-hidden bg-[var(--bg-panel-low)] transition-colors duration-200 hover:bg-[var(--bg-panel)]"
          >
            <div className="flex flex-col md:flex-row">
              <div className="relative h-48 bg-[var(--bg-panel-highest)] md:h-auto md:w-56">
                <Image
                  alt={MAP_LOOKUP[match.map].label}
                  className="h-full w-full object-cover opacity-65 transition-transform duration-500 group-hover:scale-105"
                  fill
                  sizes="(max-width: 768px) 100vw, 224px"
                  src={MAP_LOOKUP[match.map].imagePath}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-xl font-black uppercase tracking-[0.18em] text-white">
                    {MAP_LOOKUP[match.map].label}
                  </span>
                </div>
              </div>

              <div className="grid flex-1 gap-6 p-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div className="flex items-center justify-between gap-8 md:justify-start">
                  <div className="min-w-0 text-left">
                    <div className="font-display text-[0.62rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Team A
                    </div>
                    <div className="mt-1 truncate font-display text-xl font-bold uppercase tracking-[-0.05em] md:text-2xl">
                      {match.teamA}
                    </div>
                  </div>
                  <div className="font-display text-4xl font-black text-[var(--bg-accent)]">
                    {match.score.split("-")[0]}
                  </div>
                </div>

                <div className="space-y-2 border-y border-white/8 py-4 text-center md:border-x md:border-y-0 md:px-6 md:py-0">
                  <div className="font-display text-[0.62rem] uppercase tracking-[0.2em] text-[var(--success)]">
                    {match.note?.trim() || "Match Record"}
                  </div>
                  <div className="mono text-[0.72rem] uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                    {formatTimestamp(match.createdAt)}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-8 md:justify-end">
                  <div className="font-display text-4xl font-black text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]">
                    {match.score.split("-")[1]}
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="font-display text-[0.62rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Team B
                    </div>
                    <div className="mt-1 truncate font-display text-xl font-bold uppercase tracking-[-0.05em] md:text-2xl">
                      {match.teamB}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )
      ))}
    </div>
  );
}
