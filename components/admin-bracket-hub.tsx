"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminSession } from "@/components/admin-session";
import type { BracketCreateInput, BracketRecord } from "@/types/bracket";

const initialForm: BracketCreateInput = {
  title: "",
  teamCount: 8,
};

export function AdminBracketHub() {
  const router = useRouter();
  const { token } = useAdminSession();
  const [brackets, setBrackets] = useState<BracketRecord[]>([]);
  const [formValue, setFormValue] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadBrackets() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/brackets", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load brackets.");
      }

      setBrackets(payload.brackets);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load brackets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBrackets();
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage(null);
      setError(null);

      const response = await fetch("/api/brackets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formValue),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create bracket.");
      }

      router.push(`/admin/brackets/${payload.bracket._id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create bracket.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(bracketId: string) {
    const confirmed = window.confirm("Delete this bracket?");

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(bracketId);
      setMessage(null);
      setError(null);

      const response = await fetch(`/api/brackets/${bracketId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete bracket.");
      }

      setMessage("Bracket deleted.");
      await loadBrackets();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete bracket.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-8" id="brackets">
      <section className="grid gap-8 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <form className="panel px-6 py-6 md:px-8 md:py-8" onSubmit={handleCreate}>
          <p className="eyebrow">Create Bracket</p>
          <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-[-0.05em]">
            New Bracket
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
            Enter a title and total teams. The bracket starts empty, and you choose the first-round matchups in the workspace.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label className="label" htmlFor="bracket-title">
                Bracket Title
              </label>
              <div className="tactical-input-wrap">
                <input
                  id="bracket-title"
                  className="field"
                  placeholder="ENTER BRACKET TITLE"
                  value={formValue.title}
                  onChange={(event) =>
                    setFormValue((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="bracket-team-count">
                Number Of Teams
              </label>
              <select
                id="bracket-team-count"
                className="select"
                value={formValue.teamCount}
                onChange={(event) =>
                  setFormValue((current) => ({
                    ...current,
                    teamCount: Number(event.target.value),
                  }))
                }
              >
                {Array.from({ length: 32 }, (_, index) => index + 1).map((count) => (
                  <option key={count} value={count}>
                    {count} Teams
                  </option>
                ))}
              </select>
            </div>

            <button className="button-primary w-full" disabled={submitting} type="submit">
              {submitting ? "Creating..." : "Create Bracket"}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Bracket Archive</p>
              <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.05em]">
                Saved Brackets
              </h2>
            </div>
            <span className="font-display text-[0.72rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {brackets.length} total
            </span>
          </div>

          {message ? <div className="status-success">{message}</div> : null}
          {error ? <div className="status-error">{error}</div> : null}
          {loading ? (
            <div className="status-info">Loading brackets...</div>
          ) : brackets.length === 0 ? (
            <div className="empty-state">No brackets created yet.</div>
          ) : (
            <div className="space-y-3">
              {brackets.map((bracket) => (
                <article key={bracket._id} className="bg-[var(--bg-panel-low)] px-5 py-5 md:px-6 md:py-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-3">
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
                      <h3 className="font-display text-2xl font-black uppercase tracking-[-0.05em]">
                        {bracket.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {bracket.rounds.length} round{bracket.rounds.length > 1 ? "s" : ""} | {bracket.rounds[0]?.matches.length ?? 0} opening matches
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link className="button-primary" href={`/admin/brackets/${bracket._id}`}>
                        Open Bracket
                      </Link>
                      <button
                        className="button-danger"
                        disabled={deletingId === bracket._id}
                        onClick={() => void handleDelete(bracket._id)}
                        type="button"
                      >
                        {deletingId === bracket._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
