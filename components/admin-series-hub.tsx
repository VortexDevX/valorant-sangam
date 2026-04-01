"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminSession } from "@/components/admin-session";
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

export function AdminSeriesHub() {
  const { token } = useAdminSession();
  const [series, setSeries] = useState<SeriesRecord[]>([]);
  const [formValue, setFormValue] = useState(initialForm);
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

  const upcoming = series.filter((entry) => entry.status !== "completed");
  const completed = series.filter((entry) => entry.status === "completed");

  return (
    <div className="space-y-8">
      <section className="grid gap-6 border-l-4 border-[var(--bg-accent)] pl-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="eyebrow">Series Hub</p>
          <h1 className="page-title">Admin Network</h1>
          <p className="page-subtitle mt-4">
            Create matchups first. Then open a series workspace to run veto and
            enter map results.
          </p>
        </div>
      </section>

      {message ? <div className="status-success">{message}</div> : null}
      {error ? <div className="status-error">{error}</div> : null}

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
                  <article key={entry._id} className="bg-[var(--bg-panel)] px-5 py-5 md:px-6 md:py-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="tactical-chip text-[var(--text-accent)]">
                            {getSeriesStatusLabel(entry.status)}
                          </span>
                          <span className="tactical-chip text-[var(--text-secondary)]">
                            {entry.format}
                          </span>
                        </div>

                        <div className="grid items-center gap-4 bg-[var(--bg-panel-low)] px-4 py-4 md:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] md:px-5">
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
                        <Link className="button-primary" href={`/admin/series/${entry._id}`}>
                          Open Series
                        </Link>
                        <button
                          className="button-danger"
                          disabled={deletingId === entry._id}
                          onClick={() => handleDelete(entry._id)}
                          type="button"
                        >
                          {deletingId === entry._id ? "Deleting..." : "Delete"}
                        </button>
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
                  <article key={entry._id} className="bg-[var(--bg-panel-low)] px-5 py-5 md:px-6 md:py-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="tactical-chip text-[var(--success)]">
                            completed
                          </span>
                          <span className="tactical-chip text-[var(--text-accent)]">
                            {entry.format}
                          </span>
                          <span className="mono text-sm text-[var(--text-primary)]">
                            {entry.overallScore.teamA}-{entry.overallScore.teamB}
                          </span>
                        </div>

                        <div className="grid items-center gap-4 bg-[var(--bg-panel)] px-4 py-4 md:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] md:px-5">
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

                      <Link className="button-secondary" href={`/admin/series/${entry._id}`}>
                        View Series
                      </Link>
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
