"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BracketBoard } from "@/components/bracket-board";
import { useAdminSession } from "@/components/admin-session";
import { computeBracketView, normalizeBracketTeams } from "@/lib/brackets";
import type { BracketRecord } from "@/types/bracket";

interface AdminBracketWorkspaceProps {
  bracketId: string;
}

export function AdminBracketWorkspace({ bracketId }: AdminBracketWorkspaceProps) {
  const { token } = useAdminSession();
  const [bracket, setBracket] = useState<BracketRecord | null>(null);
  const [title, setTitle] = useState("");
  const [teams, setTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBracket = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/brackets/${bracketId}`, { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load bracket.");
        }

        setBracket(payload.bracket);
        setTitle(payload.bracket.title);
        setTeams(payload.bracket.teams.map((entry: { name: string }) => entry.name));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load bracket.");
      } finally {
        setLoading(false);
      }
    };

    void loadBracket();
  }, [bracketId]);

  const previewBracket = useMemo(() => {
    if (!bracket) {
      return null;
    }

    const normalizedTeams = normalizeBracketTeams(teams);
    const computed = computeBracketView({
      teamCount: bracket.teamCount,
      bracketSize: bracket.bracketSize,
      teams: normalizedTeams,
      winners: bracket.winners,
    });

    return {
      ...bracket,
      title,
      teams: normalizedTeams,
      rounds: computed.rounds,
      status: computed.status,
      championSeed: computed.championSeed,
      championName: computed.championName,
    } satisfies BracketRecord;
  }, [bracket, teams, title]);

  const hasUnsavedChanges =
    !!bracket &&
    (title !== bracket.title ||
      teams.some((entry, index) => entry !== bracket.teams[index]?.name));
  const setupComplete =
    previewBracket !== null &&
    teams.filter((entry) => entry.trim().length > 0).length === previewBracket.teamCount;

  async function saveDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setBusy(true);
      setMessage(null);
      setError(null);

      const response = await fetch(`/api/brackets/${bracketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, teams }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save bracket.");
      }

      setBracket(payload.bracket);
      setTitle(payload.bracket.title);
      setTeams(payload.bracket.teams.map((entry: { name: string }) => entry.name));
      setMessage("Bracket setup saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save bracket.");
    } finally {
      setBusy(false);
    }
  }

  async function pickWinner(round: number, match: number, winnerSeed: number | null) {
    try {
      setBusy(true);
      setMessage(null);
      setError(null);

      const response = await fetch(`/api/brackets/${bracketId}/matches/${round}/${match}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ winnerSeed }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update match winner.");
      }

      setBracket(payload.bracket);
      setTitle(payload.bracket.title);
      setTeams(payload.bracket.teams.map((entry: { name: string }) => entry.name));
      setMessage("Bracket updated.");
    } catch (pickError) {
      setError(pickError instanceof Error ? pickError.message : "Failed to update bracket.");
    } finally {
      setBusy(false);
    }
  }

  function updateTeamName(seed: number, value: string) {
    setTeams((current) =>
      current.map((entry, index) => (index === seed - 1 ? value : entry)),
    );
  }

  if (loading) {
    return <div className="status-info">Loading bracket workspace...</div>;
  }

  if (!previewBracket) {
    return <div className="status-error">Bracket not found.</div>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Link className="eyebrow" href="/admin/brackets">
          Back To Brackets
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="page-title">{previewBracket.title}</h1>
            <p className="page-subtitle mt-4">
              Enter team names directly in the first round, save once, then advance winners through the bracket.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="tactical-chip text-[var(--text-accent)]">
              {previewBracket.status.replaceAll("_", " ")}
            </span>
            <span className="tactical-chip text-[var(--text-secondary)]">
              {previewBracket.teamCount} teams
            </span>
            {previewBracket.championName ? (
              <span className="tactical-chip text-[var(--success)]">
                {previewBracket.championName}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {message ? <div className="status-success">{message}</div> : null}
      {error ? <div className="status-error">{error}</div> : null}

      <form className="space-y-6" onSubmit={saveDetails}>
        <section className="panel space-y-5 px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Bracket Setup</p>
              <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.05em]">
                {previewBracket.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                Bracket is generated automatically. Fill the first round directly on the board.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="button-primary sm:min-w-56" disabled={busy} type="submit">
                {busy ? "Saving..." : "Save Bracket"}
              </button>

              <Link className="button-secondary sm:min-w-56" href={`/brackets/${previewBracket._id}`}>
                Open Public Bracket
              </Link>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div>
              <label className="label" htmlFor="bracket-workspace-title">
                Bracket Title
              </label>
              <div className="tactical-input-wrap">
                <input
                  id="bracket-workspace-title"
                  className="field"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
            </div>

            {!setupComplete ? (
              <div className="status-info lg:max-w-md">
                Add all {previewBracket.teamCount} team names before selecting winners.
              </div>
            ) : hasUnsavedChanges ? (
              <div className="status-info lg:max-w-md">
                Save the bracket before continuing with winner selection.
              </div>
            ) : null}
          </div>
        </section>

        <BracketBoard
          bracket={previewBracket}
          busy={busy}
          editable={!hasUnsavedChanges && setupComplete}
          onEditTeamName={updateTeamName}
          onPickWinner={!hasUnsavedChanges && setupComplete ? pickWinner : undefined}
        />
      </form>
    </div>
  );
}
