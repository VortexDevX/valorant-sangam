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

  return (
    <div className="space-y-6">
      {message ? <div className="status-success">{message}</div> : null}
      {error ? <div className="status-error">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <AddMatchForm
          key={editingMatch?._id ?? "new-match"}
          initialMatch={editingMatch}
          onCancelEdit={() => setEditingMatch(null)}
          onSubmit={handleSaveMatch}
          submitting={saving}
        />

        <section className="space-y-4">
          <div className="panel px-5 py-5">
            <p className="eyebrow">Stored Results</p>
            <h2 className="mt-2 text-2xl font-bold uppercase tracking-[-0.04em]">
              Match Control
            </h2>
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
      </div>
    </div>
  );
}
