"use client";

import { useEffect, useState } from "react";
import { AddMatchForm } from "@/components/add-match-form";
import { MatchHistoryList } from "@/components/match-history-list";
import type { MatchInput, MatchRecord } from "@/types/match";

interface AddMatchManagerProps {
  authToken: string;
}

export function AddMatchManager({ authToken }: AddMatchManagerProps) {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [editingMatch, setEditingMatch] = useState<MatchRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadMatches() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/matches", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load matches.");
      }

      setMatches(payload.matches);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load matches.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMatches();
  }, []);

  async function handleSaveMatch(value: MatchInput) {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const isEditing = Boolean(editingMatch);
      const response = await fetch(
        isEditing ? `/api/matches/${editingMatch?._id}` : "/api/matches",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(value),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save match.");
      }

      setMessage(isEditing ? "Match updated." : "Match added.");
      setEditingMatch(null);
      await loadMatches();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save match.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(match: MatchRecord) {
    const confirmed = window.confirm(
      `Delete ${match.teamA} vs ${match.teamB} on ${match.map}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(match._id);
      setError(null);
      setMessage(null);

      const response = await fetch(`/api/matches/${match._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete match.");
      }

      if (editingMatch?._id === match._id) {
        setEditingMatch(null);
      }

      setMessage("Match deleted.");
      await loadMatches();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete match.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const uniqueMaps = new Set(matches.map((match) => match.map)).size;
  const latestRecord = matches[0];

  return (
    <div className="space-y-6">
      {message ? <div className="status-success">{message}</div> : null}
      {error ? <div className="status-error">{error}</div> : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section className="space-y-8">
        <AddMatchForm
          key={editingMatch?._id ?? "new-match"}
          initialMatch={editingMatch}
          onCancelEdit={() => setEditingMatch(null)}
          onSubmit={handleSaveMatch}
          submitting={saving}
        />

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-bold uppercase tracking-[-0.05em]">
                Deployed Match Records
              </h2>
              <span className="font-display text-[0.62rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Total Records: {matches.length.toString().padStart(3, "0")}
              </span>
            </div>

            {loading ? (
              <div className="status-info">Loading stored matches...</div>
            ) : (
              <MatchHistoryList
                deletingId={deletingId}
                matches={matches}
                onDelete={handleDelete}
                onEdit={setEditingMatch}
              />
            )}
          </section>
        </section>

        <aside className="space-y-6">
          <section className="bg-[var(--bg-panel-lowest)] px-6 py-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
              System Diagnostics
            </h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Database Status
                </span>
                <span className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-[var(--success)]">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Stored Records
                </span>
                <span className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-accent)]">
                  {matches.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Active Maps Logged
                </span>
                <span className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-accent)]">
                  {uniqueMaps}
                </span>
              </div>
            </div>
          </section>

          <section className="panel px-6 py-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.22em]">
              Record Snapshot
            </h3>
            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex justify-between">
                  <span className="font-display text-[0.62rem] uppercase tracking-[0.18em]">
                    Match Archive
                  </span>
                  <span className="font-display text-[0.62rem] uppercase tracking-[0.18em]">
                    {matches.length}
                  </span>
                </div>
                <div className="h-1 bg-[var(--bg-panel-highest)]">
                  <div
                    className="h-full bg-[var(--bg-accent)]"
                    style={{ width: `${Math.min(matches.length * 12, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between">
                  <span className="font-display text-[0.62rem] uppercase tracking-[0.18em]">
                    Map Coverage
                  </span>
                  <span className="font-display text-[0.62rem] uppercase tracking-[0.18em]">
                    {uniqueMaps}/12
                  </span>
                </div>
                <div className="h-1 bg-[var(--bg-panel-highest)]">
                  <div
                    className="h-full bg-[var(--success)]"
                    style={{ width: `${(uniqueMaps / 12) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="relative h-56 overflow-hidden bg-[var(--bg-panel-lowest)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,70,85,0.15),_transparent_55%)]" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <div className="font-display text-[0.62rem] font-black uppercase tracking-[0.28em] text-[var(--bg-accent)]">
                Protocol: Match Control
              </div>
              <div className="mt-2 font-display text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {latestRecord
                  ? `Latest update: ${latestRecord.teamA} vs ${latestRecord.teamB}`
                  : "Waiting for first record"}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
