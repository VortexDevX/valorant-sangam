"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusToasts } from "@/components/status-toasts";
import { useAdminSession } from "@/components/admin-session";
import { createBracketSeriesSummary } from "@/lib/series";
import type { SeriesCreateInput, SeriesRecord } from "@/types/series";

const initialForm: SeriesCreateInput = {
  teamA: "",
  teamB: "",
  format: "bo3",
};

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

function compareSeries(left: SeriesRecord, right: SeriesRecord) {
  if (left.bracket && right.bracket) {
    if (left.bracket.title !== right.bracket.title) {
      return left.bracket.title.localeCompare(right.bracket.title);
    }

    if (left.bracket.round !== right.bracket.round) {
      return left.bracket.round - right.bracket.round;
    }

    if (left.bracket.match !== right.bracket.match) {
      return left.bracket.match - right.bracket.match;
    }
  } else if (left.bracket && !right.bracket) {
    return -1;
  } else if (!left.bracket && right.bracket) {
    return 1;
  }

  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}

export function AdminSeriesHub() {
  const { token } = useAdminSession();
  const [series, setSeries] = useState<SeriesRecord[]>([]);
  const [formValue, setFormValue] = useState(initialForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "completed" | "bracket" | "manual" | "locked"
  >("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSeries() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/series", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load series.");
      }

      setSeries(payload.series);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load series.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSeries();
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage(null);
      setError(null);

      const response = await fetch("/api/series", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formValue),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create series.");
      }

      setFormValue(initialForm);
      setMessage("Series created.");
      await loadSeries();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create series.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(seriesId: string) {
    const confirmed = window.confirm("Delete this series and all its veto/results?");

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(seriesId);
      setError(null);
      setMessage(null);

      const response = await fetch(`/api/series/${seriesId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete series.");
      }

      setMessage("Series deleted.");
      await loadSeries();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete series.");
    } finally {
      setDeletingId(null);
    }
  }

  const orderedSeries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return [...series]
      .sort(compareSeries)
      .filter((entry) => {
        if (statusFilter === "open" && entry.status === "completed") {
          return false;
        }

        if (statusFilter === "completed" && entry.status !== "completed") {
          return false;
        }

        if (statusFilter === "bracket" && !entry.bracket) {
          return false;
        }

        if (statusFilter === "manual" && entry.bracket) {
          return false;
        }

        if (statusFilter === "locked" && !entry.locked) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return [
          entry.teamA,
          entry.teamB,
          entry.pairKey,
          entry.bracket?.title ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      });
  }, [searchQuery, series, statusFilter]);
  const upcoming = orderedSeries.filter((entry) => entry.status !== "completed");
  const completed = orderedSeries.filter((entry) => entry.status === "completed");

  return (
    <div className="space-y-8">
      <StatusToasts
        error={error}
        success={message}
        onErrorDismiss={() => setError(null)}
        onSuccessDismiss={() => setMessage(null)}
      />
      <section className="grid gap-6 border-l-4 border-[var(--bg-accent)] pl-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="eyebrow">Series Hub</p>
          <h1 className="page-title">Admin Network</h1>
          <p className="page-subtitle mt-4">
            Brackets generate their own series automatically. Manual series still work, but bracket-linked matchups are listed first.
          </p>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <form className="panel px-6 py-6 md:px-8 md:py-8" onSubmit={handleCreate}>
          <p className="eyebrow">Create Series</p>
          <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-[-0.05em]">
            New Matchup
          </h2>

          <div className="mt-8 space-y-5">
            <div>
              <label className="label" htmlFor="series-team-a">
                Team Alpha
              </label>
              <div className="tactical-input-wrap">
                <input
                  id="series-team-a"
                  className="field"
                  placeholder="ENTER TEAM NAME"
                  value={formValue.teamA}
                  onChange={(event) =>
                    setFormValue((current) => ({ ...current, teamA: event.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="series-team-b">
                Team Bravo
              </label>
              <div className="tactical-input-wrap">
                <input
                  id="series-team-b"
                  className="field"
                  placeholder="ENTER TEAM NAME"
                  value={formValue.teamB}
                  onChange={(event) =>
                    setFormValue((current) => ({ ...current, teamB: event.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="series-format">
                Format
              </label>
              <select
                id="series-format"
                className="select"
                value={formValue.format}
                onChange={(event) =>
                  setFormValue((current) => ({
                    ...current,
                    format: event.target.value as SeriesCreateInput["format"],
                  }))
                }
              >
                <option value="bo1">BO1</option>
                <option value="bo3">BO3</option>
                <option value="bo5">BO5</option>
              </select>
            </div>

            <button className="button-primary w-full" disabled={submitting} type="submit">
              {submitting ? "Creating..." : "Create Series"}
            </button>
          </div>
        </form>

        <div className="space-y-8">
          <section className="panel px-6 py-5 md:px-8">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
              <div>
                <label className="label" htmlFor="series-search">
                  Search Series
                </label>
                <div className="tactical-input-wrap">
                  <input
                    id="series-search"
                    className="field"
                    placeholder="TEAM, PAIR, OR BRACKET"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="series-status-filter">
                  Filter
                </label>
                <select
                  id="series-status-filter"
                  className="select"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as
                        | "all"
                        | "open"
                        | "completed"
                        | "bracket"
                        | "manual"
                        | "locked",
                    )
                  }
                >
                  <option value="all">All Series</option>
                  <option value="open">Open Only</option>
                  <option value="completed">Completed</option>
                  <option value="bracket">Bracket Linked</option>
                  <option value="manual">Manual Only</option>
                  <option value="locked">Locked</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-black uppercase tracking-[-0.05em]">
                Active Series
              </h2>
              <span className="font-display text-[0.66rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {upcoming.length} Open
              </span>
            </div>

            {loading ? (
              <div className="status-info">Loading series...</div>
            ) : upcoming.length === 0 ? (
              <div className="empty-state">No active series yet.</div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((entry) => (
                  <article key={entry._id} className="panel px-5 py-5 md:px-6 md:py-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="tactical-chip text-[var(--text-accent)]">
                            {getSeriesStatusLabel(entry.status)}
                          </span>
                          <span className="tactical-chip text-[var(--text-secondary)]">
                            {entry.format}
                          </span>
                          {entry.bracket ? (
                            <span className="tactical-chip text-[var(--text-secondary)]">
                              {createBracketSeriesSummary(entry)}
                            </span>
                          ) : (
                            <span className="tactical-chip text-[var(--text-muted)]">
                              Manual series
                            </span>
                          )}
                          {entry.locked ? (
                            <span className="tactical-chip text-[var(--danger)]">
                              locked
                            </span>
                          ) : null}
                        </div>

                        <div className="panel-soft grid items-center gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] md:px-5">
                          <div className="min-w-0 font-display text-2xl font-black uppercase tracking-[-0.05em] md:justify-self-end md:text-right md:text-3xl">
                            {entry.teamA}
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full border border-white/10 bg-[var(--bg-panel-high)] font-display text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] md:h-12 md:w-12 md:text-base">
                            VS
                          </div>
                          <div className="min-w-0 font-display text-2xl font-black uppercase tracking-[-0.05em] md:text-3xl">
                            {entry.teamB}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
                          <span className="mono text-xs text-[var(--text-muted)]">
                            Updated {formatTimestamp(entry.updatedAt)}
                          </span>
                          <span className="text-[var(--text-muted)]">|</span>
                          <span>
                            Scoreline {entry.overallScore.teamA}-{entry.overallScore.teamB}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 xl:justify-end">
                        {entry.bracket ? (
                          <Link className="button-secondary" href={`/admin/brackets/${entry.bracket.id}`}>
                            Open Bracket
                          </Link>
                        ) : null}
                        <Link className="button-primary" href={`/admin/series/${entry._id}`}>
                          Open Series
                        </Link>
                        {!entry.bracket ? (
                          <button
                            className="button-danger"
                            disabled={deletingId === entry._id}
                            onClick={() => handleDelete(entry._id)}
                            type="button"
                          >
                            {deletingId === entry._id ? "Deleting..." : "Delete"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-black uppercase tracking-[-0.05em]">
                Completed Series
              </h2>
              <span className="font-display text-[0.66rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {completed.length} Finished
              </span>
            </div>

            {loading ? null : completed.length === 0 ? (
              <div className="empty-state">No completed series yet.</div>
            ) : (
              <div className="space-y-3">
                {completed.map((entry) => (
                  <article key={entry._id} className="panel px-5 py-5 md:px-6 md:py-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="tactical-chip text-[var(--success)]">
                            completed
                          </span>
                          <span className="tactical-chip text-[var(--text-accent)]">
                            {entry.format}
                          </span>
                          {entry.bracket ? (
                            <span className="tactical-chip text-[var(--text-secondary)]">
                              {createBracketSeriesSummary(entry)}
                            </span>
                          ) : null}
                          {entry.locked ? (
                            <span className="tactical-chip text-[var(--danger)]">
                              locked
                            </span>
                          ) : null}
                          <span className="mono text-sm text-[var(--text-primary)]">
                            {entry.overallScore.teamA}-{entry.overallScore.teamB}
                          </span>
                        </div>

                        <div className="panel-soft grid items-center gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] md:px-5">
                          <div className="min-w-0 font-display text-2xl font-black uppercase tracking-[-0.05em] md:justify-self-end md:text-right md:text-3xl">
                            {entry.teamA}
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full border border-white/10 bg-[var(--bg-panel-high)] font-display text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] md:h-12 md:w-12 md:text-base">
                            VS
                          </div>
                          <div className="min-w-0 font-display text-2xl font-black uppercase tracking-[-0.05em] md:text-3xl">
                            {entry.teamB}
                          </div>
                        </div>

                        <p className="mono text-xs text-[var(--text-muted)]">
                          Updated {formatTimestamp(entry.updatedAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {entry.bracket ? (
                          <Link className="button-secondary" href={`/admin/brackets/${entry.bracket.id}`}>
                            Open Bracket
                          </Link>
                        ) : null}
                        <Link className="button-primary" href={`/admin/series/${entry._id}`}>
                          View Series
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
