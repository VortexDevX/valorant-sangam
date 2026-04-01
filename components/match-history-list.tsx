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
  if (matches.length === 0) {
    return <div className="empty-state">No completed matches have been added yet.</div>;
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <article
          key={match._id}
          className="panel grid gap-5 px-5 py-5 md:grid-cols-[1fr_auto]"
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">{MAP_LOOKUP[match.map].label}</span>
              <span className="mono text-sm text-[var(--text-muted)]">
                {formatTimestamp(match.createdAt)}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <h2 className="text-2xl font-bold uppercase tracking-[-0.04em]">
                {match.teamA}
              </h2>
              <div className="panel-soft px-4 py-3 text-center">
                <p className="mono text-xl font-semibold">{match.score}</p>
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-[-0.04em] md:text-right">
                {match.teamB}
              </h2>
            </div>

            {match.note ? (
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                {match.note}
              </p>
            ) : null}
          </div>

          {onEdit || onDelete ? (
            <div className="flex gap-3 md:flex-col md:items-end">
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
          ) : null}
        </article>
      ))}
    </div>
  );
}
